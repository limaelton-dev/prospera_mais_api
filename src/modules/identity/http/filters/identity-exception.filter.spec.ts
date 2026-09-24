import 'reflect-metadata';
import {
    ForbiddenException,
    HttpException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host.js';
import { ThrottlerException } from '@nestjs/throttler';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EmailAlreadyInUseError } from '../../application/errors/email-already-in-use.error.js';
import { InvalidCredentialsError } from '../../application/errors/invalid-credentials.error.js';
import { UnauthenticatedError } from '../../application/errors/unauthenticated.error.js';
import { createValidationException } from '../../../../shared/technical/http/validation/create-validation-exception.js';
import { IdentityExceptionFilter } from './identity-exception.filter.js';

function execute(exception: unknown, headersSent = false) {
    const headers = new Map<string, string>([['Retry-After', '60']]);
    const response = {
        headersSent,
        setHeader: vi.fn((name: string, value: string) => {
            headers.set(name, value);
        }),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
        end: vi.fn(),
    };

    const host = new ExecutionContextHost([{}, response]);
    new IdentityExceptionFilter().catch(exception, host);

    return { response, headers };
}

afterEach(() => vi.restoreAllMocks());

describe('IdentityExceptionFilter', () => {
    it.each([
        [new EmailAlreadyInUseError(), 409],
        [new InvalidCredentialsError(), 401],
        [new UnauthenticatedError(), 401],
    ] as const)('mapeia %s para %i', (error, status) => {
        const { response, headers } = execute(error);

        expect(response.status).toHaveBeenCalledWith(status);
        expect(response.json).toHaveBeenCalledWith({
            code: error.code,
            message: error.message,
            details: {},
        });
        expect(headers.get('Cache-Control')).toBe('no-store');
    });

    it('mapeia o erro de CSRF', () => {
        const error = Object.assign(new Error('mensagem da biblioteca'), {
            code: 'INVALID_CSRF_TOKEN',
            statusCode: 403,
        });
        const { response } = execute(error);

        expect(response.status).toHaveBeenCalledWith(403);
        expect(response.json).toHaveBeenCalledWith({
            code: 'INVALID_CSRF_TOKEN',
            message: 'Não foi possível validar esta solicitação. Atualize a página e tente novamente.',
            details: {},
        });
    });

    it('preserva Retry-After ao mapear o limitador', () => {
        const { response, headers } = execute(new ThrottlerException());

        expect(response.status).toHaveBeenCalledWith(429);
        expect(response.json).toHaveBeenCalledWith({
            code: 'TOO_MANY_REQUESTS',
            message: 'Muitas tentativas. Tente novamente em alguns instantes.',
            details: {},
        });
        expect(headers.get('Retry-After')).toBe('60');
    });

    it('preserva os detalhes seguros da validação', () => {
        const error = createValidationException([{
            property: 'email',
            constraints: { isEmail: 'email must be an email' },
            target: { password: 'segredo' },
            value: 'entrada privada',
        }]);
        const { response } = execute(error);

        expect(response.status).toHaveBeenCalledWith(400);
        expect(response.json).toHaveBeenCalledWith({
            code: 'VALIDATION_ERROR',
            message: 'Verifique os dados informados.',
            details: {
                fields: [{
                    field: 'email',
                    messages: ['email must be an email'],
                }],
            },
        });
    });

    it.each([
        [new ForbiddenException('detalhe privado'), 403],
        [new NotFoundException('rota interna'), 404],
        [Object.assign(new Error('JSON inválido'), { statusCode: 400 }), 400],
        [Object.assign(new Error('body privado'), { statusCode: 413 }), 413],
    ] as const)('normaliza outros erros HTTP: %s', (error, status) => {
        const { response, headers } = execute(error);

        expect(response.status).toHaveBeenCalledWith(status);
        expect(response.json).toHaveBeenCalledWith({
            code: 'HTTP_ERROR',
            message: 'Não foi possível processar esta solicitação.',
            details: {},
        });
        expect(headers.get('Cache-Control')).toBe('no-store');
    });

    it.each([
        [new Error('senha do banco'), 500],
        [null, 500],
        [Object.assign(new Error('status inválido'), { statusCode: 200 }), 500],
        [new HttpException('serviço privado', 503), 503],
    ] as const)('oculta detalhes de falhas internas: %s', (error, status) => {
        const log = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
        const { response, headers } = execute(error);

        expect(response.status).toHaveBeenCalledWith(status);
        expect(response.json).toHaveBeenCalledWith({
            code: 'INTERNAL_ERROR',
            message: 'Ocorreu um erro interno. Tente novamente mais tarde.',
            details: {},
        });
        expect(log).toHaveBeenCalledWith(error);
        expect(headers.get('Cache-Control')).toBe('no-store');
    });

    it('não tenta escrever novamente após enviar os headers', () => {
        const { response } = execute(new NotFoundException(), true);

        expect(response.end).toHaveBeenCalledOnce();
        expect(response.setHeader).not.toHaveBeenCalled();
        expect(response.status).not.toHaveBeenCalled();
        expect(response.json).not.toHaveBeenCalled();
    });
});