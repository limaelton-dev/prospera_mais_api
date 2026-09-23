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