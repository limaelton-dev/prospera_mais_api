import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from "@nestjs/common";
import { EmailAlreadyInUseError } from "../../application/errors/email-already-in-use.error.js";
import { InvalidCredentialsError } from "../../application/errors/invalid-credentials.error.js";
import { UnauthenticatedError } from "../../application/errors/unauthenticated.error.js";
import { Response } from "express";

type IdentityError = 
    | EmailAlreadyInUseError
    | InvalidCredentialsError
    | UnauthenticatedError;

@Catch(
    EmailAlreadyInUseError,
    InvalidCredentialsError,
    UnauthenticatedError,
)
export class IdentityExceptionFilter implements ExceptionFilter<IdentityError>
{
    catch(exception: IdentityError, host: ArgumentsHost) {
        const response = host.switchToHttp().getResponse<Response>();

        const status = 
            exception instanceof EmailAlreadyInUseError
                ? HttpStatus.CONFLICT
                : HttpStatus.UNAUTHORIZED;

        response.status(status).json({
            code: exception.code,
            message: exception.message,
            details: {},
        });
    }
}