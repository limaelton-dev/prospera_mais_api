import 'reflect-metadata';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host.js';

import { PersonId } from '../../../spaces/domain/person/person-id.js';
import { SessionService } from '../../application/services/session.service.js';
import { UnauthenticatedError } from '../../application/errors/unauthenticated.error.js';
import type { AuthenticatedActor } from '../../application/models/authenticated-actor.js';
import type { SessionRepository } from '../../application/ports/private/session.repository.js';
import type { SessionTokenGenerator } from '../../application/ports/private/session-token-generator.js';
import type { AuthenticatedRequest } from '../types/authenticated-request.js';
import { Public } from '../decorators/public.decorator.js';
import { SessionAuthGuard } from './session-auth.guard.js';

class TestController {
    protectedRoute() {}

    @Public()
    publicRoute() {}
}

@Public()
class PublicController {
    route() {}
}

function createTestContext(environment = 'test') {
    const actor: AuthenticatedActor = {
        personId: PersonId.create(),
        sessionId: 'current-session-id',
    };

    const request: Pick<AuthenticatedRequest, 'cookies' | 'actor'> = {
        cookies: {
            session: 'local-token',
            '__Host-session': 'production-token',
        },
    };

    const sessionService = new SessionService(
        {
            save: vi.fn<SessionRepository['save']>(),
            findByTokenHash: vi.fn<SessionRepository['findByTokenHash']>(),
            deleteById: vi.fn<SessionRepository['deleteById']>(),
        },
        {
            generate: vi.fn<SessionTokenGenerator['generate']>(),
            hash: vi.fn<SessionTokenGenerator['hash']>(),
        },
    );

    const authenticate = vi
        .spyOn(sessionService, 'authenticate')
        .mockResolvedValue(actor);

    const guard = new SessionAuthGuard(
        new Reflector(),
        sessionService,
        new ConfigService({ NODE_ENV: environment }),
    );

    const executionContext = new ExecutionContextHost(
        [request],
        TestController,
        TestController.prototype.protectedRoute,
    );

    return { guard, request, actor, authenticate, executionContext };
}

describe('SessionAuthGuard e Public', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it.each([
        { environment: 'development', token: 'local-token' },
        { environment: 'test', token: 'local-token' },
        { environment: 'production', token: 'production-token' },
    ])(
        'autentica com o cookie correto em $environment',
        async ({ environment, token }) => {
            const context = createTestContext(environment);

            await expect(
                context.guard.canActivate(context.executionContext),
            ).resolves.toBe(true);

            expect(context.authenticate).toHaveBeenCalledExactlyOnceWith(token);
            expect(context.request.actor).toBe(context.actor);
        },
    );

    it('libera um método público sem autenticar a sessão', async () => {
        const context = createTestContext();
        const executionContext = new ExecutionContextHost(
            [context.request],
            TestController,
            TestController.prototype.publicRoute,
        );

        await expect(context.guard.canActivate(executionContext)).resolves.toBe(
            true,
        );

        expect(context.authenticate).not.toHaveBeenCalled();
        expect(context.request.actor).toBeUndefined();
    });

    it('libera um controller público sem autenticar a sessão', async () => {
        const context = createTestContext();
        const executionContext = new ExecutionContextHost(
            [context.request],
            PublicController,
            PublicController.prototype.route,
        );

        await expect(context.guard.canActivate(executionContext)).resolves.toBe(
            true,
        );

        expect(context.authenticate).not.toHaveBeenCalled();
        expect(context.request.actor).toBeUndefined();
    });

    it('delega ao serviço a rejeição de uma requisição sem cookies', async () => {
        const context = createTestContext();
        delete context.request.cookies;

        const error = new UnauthenticatedError();
        context.authenticate.mockRejectedValue(error);

        await expect(
            context.guard.canActivate(context.executionContext),
        ).rejects.toBe(error);

        expect(context.authenticate).toHaveBeenCalledExactlyOnceWith(undefined);
        expect(context.request.actor).toBeUndefined();
    });

    it('não usa o cookie local como alternativa em produção', async () => {
        const context = createTestContext('production');
        context.request.cookies = { session: 'local-token' };

        const error = new UnauthenticatedError();
        context.authenticate.mockRejectedValue(error);

        await expect(
            context.guard.canActivate(context.executionContext),
        ).rejects.toBe(error);

        expect(context.authenticate).toHaveBeenCalledExactlyOnceWith(undefined);
        expect(context.request.actor).toBeUndefined();
    });

    it.each([
        { label: 'sessão inválida', error: new UnauthenticatedError() },
        { label: 'falha técnica', error: new Error('Banco indisponível') },
    ])('propaga $label sem atribuir um ator', async ({ error }) => {
        const context = createTestContext();
        context.authenticate.mockRejectedValue(error);

        await expect(
            context.guard.canActivate(context.executionContext),
        ).rejects.toBe(error);

        expect(context.request.actor).toBeUndefined();
    });
});
