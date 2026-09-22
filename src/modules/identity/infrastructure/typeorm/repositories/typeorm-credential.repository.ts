import { Injectable } from '@nestjs/common';
import { EntityManagerProvider } from '../../../../../shared/technical/database/typeorm/entity-manager.provider.js';
import { PersonId } from '../../../../spaces/domain/person/person-id.js';
import { AuthCredentialOrmEntity } from '../entities/auth-credential.orm-entity.js';
import type { CredentialRepository } from '../../../application/ports/private/credential.repository.js';
import type { AuthCredential } from '../../../application/models/auth-credential.js';
import { QueryFailedError } from 'typeorm';
import { EmailAlreadyInUseError } from '../../../application/errors/email-already-in-use.error.js';

@Injectable()
export class TypeOrmCredentialRepository implements CredentialRepository {
    constructor(
        private readonly entityManagerProvider: EntityManagerProvider,
    ) {}

    async save(credential: AuthCredential): Promise<void> {
        const repository = this.entityManagerProvider
            .get()
            .getRepository(AuthCredentialOrmEntity);

        const entity = new AuthCredentialOrmEntity();

        entity.personId = credential.personId.value;
        entity.email = credential.email;
        entity.passwordHash = credential.passwordHash;
        entity.createdAt = credential.createdAt;
        entity.updatedAt = credential.updatedAt;

        try {
            await repository.save(entity);
        } catch (error: unknown) {
            if (error instanceof QueryFailedError) {
                const databaseError = error.driverError as {
                    code?: string;
                    constraint?: string;
                };

                if (
                    databaseError.code === '23505' &&
                    databaseError.constraint === 'UQ_auth_credentials_email'
                ) {
                    throw new EmailAlreadyInUseError();
                }
            }

            throw error;
        }
    }

    async findByEmail(email: string): Promise<AuthCredential | null> {
        const repository = this.entityManagerProvider
            .get()
            .getRepository(AuthCredentialOrmEntity);

        const entity = await repository.findOne({
            where: {
                email: email,
            },
        });

        return entity ? this.toModel(entity) : null;
    }

    async findByPersonId(personId: PersonId): Promise<AuthCredential | null> {
        const repository = this.entityManagerProvider
            .get()
            .getRepository(AuthCredentialOrmEntity);

        const entity = await repository.findOne({
            where: {
                personId: personId.value,
            },
        });

        return entity ? this.toModel(entity) : null;
    }

    private toModel(entity: AuthCredentialOrmEntity): AuthCredential {
        return {
            personId: PersonId.from(entity.personId),
            email: entity.email,
            passwordHash: entity.passwordHash,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
