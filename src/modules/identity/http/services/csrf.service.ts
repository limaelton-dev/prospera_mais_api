import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { doubleCsrf, type DoubleCsrfUtilities } from 'csrf-csrf';
import { CookieOptions, Request, RequestHandler, Response } from "express";
import { randomBytes } from "node:crypto";

@Injectable()
export class CsrfService {
    private readonly csrf: DoubleCsrfUtilities;
    private readonly sessionCookieName: string;
    private readonly contextCookieName: string;
    private readonly tokenCookieName: string;
    private readonly cookieOptions: CookieOptions;

    constructor(configService: ConfigService) {
        const isProduction =
            configService.getOrThrow<string>('NODE_ENV') === 'production';
        
        const secret = configService.getOrThrow<string>('CSRF_SECRET');

        this.sessionCookieName = isProduction ? '__Host-session' : 'session';

        this.contextCookieName = isProduction
            ? '__Host-csrf-context'
            : 'csrf-context';
        
        this.tokenCookieName = isProduction ? '__Host-csrf' : 'csrf';

        this.cookieOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax",
            path: '/',
        };

        this.csrf = doubleCsrf({
            getSecret: () => secret,
            getSessionIdentifier: (request) =>
                this.getSessionIdentifier(request),
            cookieName: this.tokenCookieName,
            cookieOptions: this.cookieOptions,
            ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
            getCsrfTokenFromRequest: (request) => {
                const token = request.headers['x-csrf-token'];

                return typeof token === 'string' ? token : undefined;
            },
            errorConfig: {
                statusCode: 403,
                code: 'INVALID_CSRF_TOKEN',
                message:
                    'Não foi possível validar esta solicitação. Atualize a página e tente novamente.',
            },
        });
    }

    get protection(): RequestHandler {
        return this.csrf.doubleCsrfProtection;
    }

    generateToken(request: Request, response: Response): string {
        request.cookies ??= {};

        const sessionToken = this.readCookie(request, this.sessionCookieName);
        const contextId = this.readCookie(request, this.contextCookieName);

        if(!sessionToken && !contextId) {
            const newContextId = randomBytes(32).toString('base64url');

            response.cookie(
                this.contextCookieName,
                newContextId,
                this.cookieOptions,
            );

            request.cookies[this.contextCookieName] = newContextId;
        }

        if(typeof request.cookies[this.tokenCookieName] !== 'string') {
            delete request.cookies[this.tokenCookieName];
        }

        return this.csrf.generateCsrfToken(request, response);
    }

    private getSessionIdentifier(request: Request): string {
        const sessionToken = this.readCookie(request, this.sessionCookieName);

        if(sessionToken) {
            return `session:${sessionToken}`;
        }

        const contextId = this.readCookie(request, this.contextCookieName);

        if(!contextId) {
            throw this.csrf.invalidCsrfTokenError;
        }

        return `anonymous:${contextId}`;
    }
    
    private readCookie(request: Request, name: string): string | undefined {
        const value: unknown = request.cookies?.[name];
        return typeof value === 'string' && value.length > 0 
            ? value
            : undefined;
    }
}