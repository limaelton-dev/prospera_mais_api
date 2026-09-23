import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';
import { CsrfService } from './csrf.service.js';

function createContext(
    environment = 'test',
    initialCookies: Record<string, unknown> = {},
) {
    const service = new CsrfService(
        new ConfigService({
            NODE_ENV: environment,
            CSRF_SECRET: 'secret-used-only-in-csrf-tests',
        }),
    );

    const cookies = { ...initialCookies };
    const request = { cookies } as Request;

    const cookie = vi.fn(
        (_name: string, _value: unknown, _options?: CookieOptions): Response =>
            response,
    );

    const response = { cookie } as unknown as Response;

    return { service, cookies, request, response, cookie };
}

const environments = [
    { environment: 'development', prefix: '', secure: false },
    { environment: 'test', prefix: '', secure: false },
    { environment: 'production', prefix: '__Host-', secure: true },
];

describe('CsrfService: geração e cookies', () => {
    it.each(environments)(
        'emite os cookies corretos em $environment',
        ({ environment, prefix, secure }) => {
            const context = createContext(environment);

            const token = context.service.generateToken(
                context.request,
                context.response,
            );

            const options = {
                httpOnly: true,
                secure,
                sameSite: 'lax',
                path: '/',
            };

            expect(token).toEqual(expect.any(String));
            expect(token.length).toBeGreaterThan(0);

            expect(context.cookie.mock.calls).toEqual([
                [
                    `${prefix}csrf-context`,
                    expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
                    options,
                ],
                [`${prefix}csrf`, token, options],
            ]);
        },
    );

    it('reutiliza o contexto e o token válidos', () => {
        const first = createContext();
        const token = first.service.generateToken(first.request, first.response);
        const contextId = first.cookies['csrf-context'];

        const second = createContext('test', {
            'csrf-context': contextId,
            csrf: token,
        });

        const reusedToken = second.service.generateToken(
            second.request,
            second.response,
        );

        expect(reusedToken).toBe(token);
        expect(second.cookies['csrf-context']).toBe(contextId);
        expect(second.cookie).toHaveBeenCalledTimes(1);
        expect(second.cookie.mock.calls[0]?.[0]).toBe('csrf');
    });

    it.each(environments)(
        'preserva a sessão e dispensa contexto anônimo em $environment',
        ({ environment, prefix }) => {
            const sessionCookie = `${prefix}session`;

            const context = createContext(environment, {
                [sessionCookie]: 'authenticated-session-token',
            });

            const token = context.service.generateToken(
                context.request,
                context.response,
            );

            expect(context.cookies[sessionCookie]).toBe(
                'authenticated-session-token',
            );

            expect(context.cookies[`${prefix}csrf-context`]).toBeUndefined();
            expect(context.cookie).toHaveBeenCalledTimes(1);
            expect(context.cookie.mock.calls[0]?.[0]).toBe(`${prefix}csrf`);
            expect(context.cookie.mock.calls[0]?.[1]).toBe(token);
        },
    );

    it.each([
        { label: 'texto inválido', value: 'invalid-token' },
        { label: 'número', value: 123 },
        { label: 'objeto', value: { unexpected: true } },
    ])('substitui cookie CSRF com $label', ({ value }) => {
        const context = createContext('test', {
            'csrf-context': 'existing-anonymous-context',
            csrf: value,
        });

        const token = context.service.generateToken(
            context.request,
            context.response,
        );

        expect(token).toEqual(expect.any(String));
        expect(token.length).toBeGreaterThan(0);
        expect(token).not.toEqual(value);

        expect(context.cookies['csrf-context']).toBe(
            'existing-anonymous-context',
        );

        expect(context.cookie).toHaveBeenCalledTimes(1);
        expect(context.cookie.mock.calls[0]?.[1]).toBe(token);
    });

    it('gera contextos e tokens diferentes para visitantes distintos', () => {
        const first = createContext();
        const second = createContext();

        const firstToken = first.service.generateToken(
            first.request,
            first.response,
        );

        const secondToken = second.service.generateToken(
            second.request,
            second.response,
        );

        expect(first.cookies['csrf-context']).not.toBe(
            second.cookies['csrf-context'],
        );

        expect(firstToken).not.toBe(secondToken);
    });
});

describe('CsrfService: proteção das requisições', () => {
    function createProtectedContext(
        environment = 'test',
        initialCookies: Record<string, unknown> = {},
    ) {
        const context = createContext(environment, initialCookies);

        const token = context.service.generateToken(
            context.request,
            context.response,
        );

        const cookieName =
            environment === 'production' ? '__Host-csrf' : 'csrf';

        // Simula o navegador devolvendo o cookie e o header.
        context.cookies[cookieName] = token;
        context.request.method = 'POST';
        context.request.headers = { 'x-csrf-token': token };

        return { ...context, token };
    }

    function protect(context: ReturnType<typeof createContext>) {
        const next = vi.fn();

        context.service.protection(
            context.request,
            context.response,
            next,
        );

        return next;
    }

    const invalidCsrf = expect.objectContaining({
        statusCode: 403,
        code: 'INVALID_CSRF_TOKEN',
        message:
            'Não foi possível validar esta solicitação. Atualize a página e tente novamente.',
    });

    it.each(['GET', 'HEAD', 'OPTIONS'])(
        'libera %s sem token',
        (method) => {
            const context = createContext();
            context.request.method = method;
            context.request.headers = {};

            expect(protect(context)).toHaveBeenCalledExactlyOnceWith();
        },
    );

    it.each(['POST', 'PUT', 'PATCH', 'DELETE'])(
        'rejeita %s sem o header CSRF',
        (method) => {
            const context = createProtectedContext();
            context.request.method = method;
            delete context.request.headers['x-csrf-token'];

            expect(protect(context)).toHaveBeenCalledExactlyOnceWith(
                invalidCsrf,
            );
        },
    );

    it.each(environments)(
        'aceita token anônimo válido em $environment',
        ({ environment }) => {
            const context = createProtectedContext(environment);

            expect(protect(context)).toHaveBeenCalledExactlyOnceWith();
        },
    );

    it.each(environments)(
        'aceita token vinculado à sessão em $environment',
        ({ environment, prefix }) => {
            const context = createProtectedContext(environment, {
                [`${prefix}session`]: 'authenticated-session',
            });

            expect(protect(context)).toHaveBeenCalledExactlyOnceWith();
        },
    );

    it.each([
        { label: 'incorreto', value: 'wrong-token' },
        { label: 'com múltiplos valores', value: ['first', 'second'] },
    ])('rejeita header $label', ({ value }) => {
        const context = createProtectedContext();

        Object.assign(context.request.headers, {
            'x-csrf-token': value,
        });

        expect(protect(context)).toHaveBeenCalledExactlyOnceWith(
            invalidCsrf,
        );
    });

    it('rejeita token no corpo ou na query sem o header', () => {
        const context = createProtectedContext();
        context.request.headers = {};
        context.request.body = { csrfToken: context.token };
        context.request.query = { csrfToken: context.token };

        expect(protect(context)).toHaveBeenCalledExactlyOnceWith(
            invalidCsrf,
        );
    });

    it('rejeita header válido sem o cookie CSRF', () => {
        const context = createProtectedContext();
        delete context.cookies.csrf;

        expect(protect(context)).toHaveBeenCalledExactlyOnceWith(
            invalidCsrf,
        );
    });

    it('rejeita cookie e header iguais quando a assinatura foi adulterada', () => {
        const context = createProtectedContext();

        const forgedToken =
            (context.token.startsWith('0') ? '1' : '0') +
            context.token.slice(1);

        context.cookies.csrf = forgedToken;
        context.request.headers['x-csrf-token'] = forgedToken;

        expect(protect(context)).toHaveBeenCalledExactlyOnceWith(
            invalidCsrf,
        );
    });

    it('rejeita token emitido para outro contexto anônimo', () => {
        const context = createProtectedContext();
        context.cookies['csrf-context'] = 'another-anonymous-context';

        expect(protect(context)).toHaveBeenCalledExactlyOnceWith(
            invalidCsrf,
        );
    });

    it('lança o erro CSRF quando o identificador anônimo desaparece', () => {
        const context = createProtectedContext();
        delete context.cookies['csrf-context'];

        expect(() => protect(context)).toThrow(invalidCsrf);
    });

    it.each([
        {
            label: 'login',
            before: undefined,
            after: 'session-b',
        },
        {
            label: 'troca de sessão',
            before: 'session-a',
            after: 'session-b',
        },
        {
            label: 'logout',
            before: 'session-a',
            after: undefined,
        },
    ])('exige novo token após $label', ({ before, after }) => {
        const context = createProtectedContext('test', {
            'csrf-context': 'anonymous-context',
            session: before,
        });

        if (after === undefined) {
            delete context.cookies.session;
        } else {
            context.cookies.session = after;
        }

        expect(protect(context)).toHaveBeenCalledExactlyOnceWith(
            invalidCsrf,
        );

        const newToken = context.service.generateToken(
            context.request,
            context.response,
        );

        expect(newToken).not.toBe(context.token);

        context.cookies.csrf = newToken;
        context.request.headers['x-csrf-token'] = newToken;

        expect(protect(context)).toHaveBeenCalledExactlyOnceWith();
    });
});