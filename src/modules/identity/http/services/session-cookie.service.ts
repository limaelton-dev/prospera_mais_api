import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Response } from 'express';

@Injectable()
export class SessionCookieService {
    private readonly cookieName: string;
    private readonly cookieOptions: CookieOptions;
    private readonly maxAge: number;

    constructor(configService: ConfigService) {
        const isProduction =
            configService.getOrThrow<string>('NODE_ENV') === 'production';

        const sessionTtlSeconds = configService.getOrThrow<number>(
            'SESSION_TTL_SECONDS',
        );

        this.cookieName = isProduction ? '__Host-session' : 'session';

        this.cookieOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            path: '/',
        };

        this.maxAge = sessionTtlSeconds * 1000;
    }

    set(response: Response, sessionToken: string): void {
        response.cookie(this.cookieName, sessionToken, {
            ...this.cookieOptions,
            maxAge: this.maxAge,
        });
    }

    clear(response: Response): void {
        response.clearCookie(this.cookieName, this.cookieOptions);
    }
}
