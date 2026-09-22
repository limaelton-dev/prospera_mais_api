import { describe, expect, it, vi } from 'vitest';
import { AuthCredential } from '../models/auth-credential.js';
import { PersonId } from '../../../spaces/domain/person/person-id.js';
import { type CredentialRepository } from '../ports/private/credential.repository.js';
import { SessionRepository } from '../ports/private/session.repository.js';
import { PasswordHasher } from '../ports/private/password-hasher.js';
import { SessionTokenGenerator } from '../ports/private/session-token-generator.js';
import { ProvisionPersonalContext } from '../../../spaces/application/ports/public/provision-personal-context.js';
import { UnitOfWork } from '../../../../shared/application/unit-of-work.js';
import { ConfigService } from '@nestjs/config';
import { RegisterAccountHandler } from './register-account.handler.js';
import { EmailAlreadyInUseError } from '../errors/email-already-in-use.error.js';

describe('RegisterAccountHandler', () => {
    it('rejeita e-mail já cadastrado sem iniciar o cadastro', async () => {
        const existingCredential: AuthCredential = {
            personId:  PersonId.create(),
            email: 'elton@example.com',
            passwordHash: 'existing-password-hash',
            createdAt: new Date('2026-09-01T12:00:00.000Z'),
            updatedAt: new Date('2026-09-01T12:00:00.000Z'), 
        };

        const credentialRepository = {
            save: vi.fn<CredentialRepository['save']>(),
            findByEmail: vi
                .fn<CredentialRepository['findByEmail']>()
                .mockResolvedValue(existingCredential),
            findByPersonId: vi.fn<CredentialRepository['findByPersonId']>(),
        } satisfies CredentialRepository;

        const sessionRepository = {
            save: vi.fn<SessionRepository['save']>(),
            findByTokenHash: vi.fn<SessionRepository['findByTokenHash']>(),
            deleteById: vi.fn<SessionRepository['deleteById']>(),
        } satisfies SessionRepository;
      
        const passwordHasher = {
            hash: vi.fn<PasswordHasher['hash']>(),
            verify: vi.fn<PasswordHasher['verify']>(),
        } satisfies PasswordHasher;
      
        const sessionTokenGenerator = {
            generate: vi.fn<SessionTokenGenerator['generate']>(),
            hash: vi.fn<SessionTokenGenerator['hash']>(),
        } satisfies SessionTokenGenerator;
      
        const provisionPersonalContext = {
            provision: vi.fn<ProvisionPersonalContext['provision']>(),
        } satisfies ProvisionPersonalContext;

        const unitOfWork: UnitOfWork = {
            async execute<T>(work: () => Promise<T>): Promise<T> {
                return work();
            },
        };

        const executeTransaction = vi.spyOn(unitOfWork, 'execute');

        const configService = new ConfigService({
            SESSION_TTL_SECONDS: 604800,
        });

        const handler = new RegisterAccountHandler(
            unitOfWork,
            provisionPersonalContext,
            credentialRepository,
            sessionRepository,
            passwordHasher,
            sessionTokenGenerator,
            configService,
        );

        await expect(
            handler.execute({
                displayName: 'Elton',
                email: '  ELTON@EXAMPLE.COM  ',
                password: 'correct-horse-battery-staple',
            }),
        ).rejects.toBeInstanceOf(EmailAlreadyInUseError);
      
        expect(credentialRepository.findByEmail)
            .toHaveBeenCalledWith('elton@example.com');
        
        expect(executeTransaction).not.toHaveBeenCalled();
        expect(provisionPersonalContext.provision).not.toHaveBeenCalled();
        expect(credentialRepository.save).not.toHaveBeenCalled();
        expect(sessionRepository.save).not.toHaveBeenCalled();
        expect(passwordHasher.hash).not.toHaveBeenCalled();
        expect(sessionTokenGenerator.generate).not.toHaveBeenCalled();
    })
})