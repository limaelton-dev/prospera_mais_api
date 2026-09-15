import { Injectable } from "@nestjs/common";
import { SessionRepository } from "../../../application/ports/private/session.repository.js";
import { EntityManagerProvider } from "../../../../../shared/technical/database/typeorm/entity-manager.provider.js";
import { AuthSession } from "../../../application/models/auth-session.js";
import { AuthSessionOrmEntity } from "../entities/auth-session.orm-entity.js";
import { PersonId } from "../../../../spaces/domain/person/person-id.js";

@Injectable()
export class TypeOrmSessionRepository implements SessionRepository{
    constructor(private readonly entityManagerProvider: EntityManagerProvider) {}

    async save(session: AuthSession): Promise<void> {
        const repository = this.entityManagerProvider
            .get()
            .getRepository(AuthSessionOrmEntity);

        const entity = new AuthSessionOrmEntity;

        entity.id = session.id;
        entity.personId = session.personId.value;
        entity.tokenHash = session.tokenHash;
        entity.expiresAt = session.expiresAt;
        entity.createdAt = session.createdAt;

        await repository.save(entity);
    }

    async findByTokenHash(tokenHash: Buffer): Promise<AuthSession | null> {
        const repository = this.entityManagerProvider
            .get()
            .getRepository(AuthSessionOrmEntity);

        const entity = await repository.findOne({
            where: {
                tokenHash,
            },
        });

        return entity ? this.toModel(entity) : null;
    }

    async deleteById(id: string): Promise<void> {
        const repository = this.entityManagerProvider
            .get()
            .getRepository(AuthSessionOrmEntity);
            
        await repository.delete({
            id,
        });
    }

    private toModel(entity: AuthSessionOrmEntity,): AuthSession {
        return {
            id: entity.id,
            personId: PersonId.from(entity.personId),
            tokenHash: entity.tokenHash,
            expiresAt: entity.expiresAt,
            createdAt: entity.createdAt,
        };
    }

}