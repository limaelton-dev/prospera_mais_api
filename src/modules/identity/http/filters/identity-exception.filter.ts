import {
    BadRequestException,
    Catch,
    HttpException,
    Logger,
    type ArgumentsHost,
    type ExceptionFilter,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import type { Response } from 'express';

import { EmailAlreadyInUseError } from '../../application/errors/email-already-in-use.error.js';
import { InvalidCredentialsError } from '../../application/errors/invalid-credentials.error.js';
import { UnauthenticatedError } from '../../application/errors/unauthenticated.error.js';

type ErrorBody = {
    code: string;
    message: string;
    details: object;
};

type ErrorResponse = {
    status: number;
    body: ErrorBody;
};

@Catch()
export class IdentityExceptionFilter implements ExceptionFilter<unknown> {
    private readonly logger = new Logger(IdentityExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const response = host.switchToHttp().getResponse<Response>();

        if (response.headersSent) {
            response.end();
            return;
        }

        const { status, body } = this.mapError(exception);

        if (status >= 500) {
            this.logger.error(exception);
        }

        response.setHeader('Cache-Control', 'no-store');
        response.status(status).json(body);
    }

    private mapError(exception: unknown): ErrorResponse {
        if (exception instanceof EmailAlreadyInUseError) {
            return this.error(409, exception.code, exception.message);
        }

        if (exception instanceof InvalidCredentialsError) {
            return this.error(401, exception.code, exception.message);
        }

        if (exception instanceof UnauthenticatedError) {
            return this.error(401, exception.code, exception.message);
        }

        if (this.isCsrfError(exception)) {
            return this.error(
                403,
                'INVALID_CSRF_TOKEN',
                'Não foi possível validar esta solicitação. Atualize a página e tente novamente.',
            );
        }

        if (exception instanceof ThrottlerException) {
            return this.error(
                429,
                'TOO_MANY_REQUESTS',
                'Muitas tentativas. Tente novamente em alguns instantes.',
            );
        }

        if (exception instanceof BadRequestException) {
            const body = exception.getResponse();

            if (this.isValidationBody(body)) {
                return { status: 400, body };
            }
        }

        const status = this.getHttpStatus(exception);

        if (status >= 500) {
            return this.error(
                status,
                'INTERNAL_ERROR',
                'Ocorreu um erro interno. Tente novamente mais tarde.',
            );
        }

        return this.error(
            status,
            'HTTP_ERROR',
            'Não foi possível processar esta solicitação.',
        );
    }

    private isCsrfError(exception: unknown): boolean {
        return (
            exception instanceof Error &&
            'code' in exception &&
            exception.code === 'INVALID_CSRF_TOKEN' &&
            'statusCode' in exception &&
            exception.statusCode === 403
        );
    }

    private isValidationBody(body: unknown): body is ErrorBody {
        return (
            typeof body === 'object' &&
            body !== null &&
            'code' in body &&
            body.code === 'VALIDATION_ERROR' &&
            'message' in body &&
            typeof body.message === 'string' &&
            'details' in body &&
            typeof body.details === 'object' &&
            body.details !== null
        );
    }

    private getHttpStatus(exception: unknown): number {
        if (exception instanceof HttpException) {
            return exception.getStatus();
        }

        if (exception instanceof Error && 'statusCode' in exception) {
            const status = exception.statusCode;

            if (
                typeof status === 'number' &&
                Number.isInteger(status) &&
                status >= 400 &&
                status <= 599
            ) {
                return status;
            }
        }

        return 500;
    }

    private error(
        status: number,
        code: string,
        message: string,
    ): ErrorResponse {
        return { status, body: { code, message, details: {} } };
    }
}
