import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

function fields(
    errors: ValidationError[],
    prefix = '',
): { field: string; messages: string[] }[] {
    return errors.flatMap((error) => {
        const field = prefix ? prefix + '.' + error.property : error.property;
        const messages = Object.entries(error.constraints ?? {}).map(
            ([code, message]) =>
                code === 'whitelistValidation'
                    ? 'Este campo não é permitido.'
                    : message,
        );
        return [
            ...(messages.length ? [{ field, messages }] : []),
            ...fields(error.children ?? [], field),
        ];
    });
}
export function createValidationException(
    errors: ValidationError[],
): BadRequestException {
    return new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Verifique os dados informados.',
        details: {
            fields: fields(errors),
        },
    });
}
