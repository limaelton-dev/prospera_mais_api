import type { HttpErrorMapper } from '../../../../shared/technical/http/api-exception.filter.js';

import { EmailAlreadyInUseError } from '../../application/errors/email-already-in-use.error.js';
import { InvalidCredentialsError } from '../../application/errors/invalid-credentials.error.js';
import { UnauthenticatedError } from '../../application/errors/unauthenticated.error.js';

export const mapIdentityError: HttpErrorMapper = (exception) => {
    if (exception instanceof EmailAlreadyInUseError) {
        return {
            status: 409,
            body: {
                code: exception.code,
                message: exception.message,
                details: {},
            },
        };
    }

    if (
        exception instanceof InvalidCredentialsError ||
        exception instanceof UnauthenticatedError
    ) {
        return {
            status: 401,
            body: {
                code: exception.code,
                message: exception.message,
                details: {},
            },
        };
    }

    return null;
};
