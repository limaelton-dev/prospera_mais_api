import {
    Catch,
    HttpStatus,
    type ArgumentsHost,
} from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { ThrottlerException } from '@nestjs/throttler';
import type { Response } from 'express';

import { EmailAlreadyInUseError } from '../../application/errors/email-already-in-use.error.js';
import { InvalidCredentialsError } from '../../application/errors/invalid-credentials.error.js';
import { UnauthenticatedError } from '../../application/errors/unauthenticated.error.js';

@Catch()
export class IdentityExceptionFilter extends BaseExceptionFilter<unknown> {
    constructor(httpAdapterHost: HttpAdapterHost) {
        super(httpAdapterHost.httpAdapter);
    }

    catch(exception: unknown, host: ArgumentsHost): void {
        const response = host.switchToHttp().getResponse<Response>();

        if (response.headersSent) {
            super.catch(exception, host);
            return;
        }

        response.setHeader('Cache-Control', 'no-store');

        if (
            exception instanceof EmailAlreadyInUseError ||
            exception instanceof InvalidCredentialsError ||
            exception instanceof UnauthenticatedError
        ) {
            const status =
                exception instanceof EmailAlreadyInUseError
                    ? HttpStatus.CONFLICT
                    : HttpStatus.UNAUTHORIZED;

            this.sendError(
                response,
                status,
                exception.code,
                exception.message,
            );
            return;
        }

        if (
            exception instanceof Error &&
            'code' in exception &&
            exception.code === 'INVALID_CSRF_TOKEN' &&
            'statusCode' in exception &&
            exception.statusCode === HttpStatus.FORBIDDEN
        ) {
            this.sendError(
                response,
                HttpStatus.FORBIDDEN,
                'INVALID_CSRF_TOKEN',
                'Não foi possível validar esta solicitação. Atualize a página e tente novamente.',
            );
            return;
        }

        if (exception instanceof ThrottlerException) {
            this.sendError(
                response,
                HttpStatus.TOO_MANY_REQUESTS,
                'TOO_MANY_REQUESTS',
                'Muitas tentativas. Tente novamente em alguns instantes.',
            );
            return;
        }

        super.catch(exception, host);
    }

    private sendError(
        response: Response,
        status: number,
        code: string,
        message: string,
    ): void {
        response.status(status).json({
            code,
            message,
            details: {},
        });
    }
}