import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

export function createValidationException(
    errors: ValidationError[],
): BadRequestException {
    return new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Verifique os dados informados.',
        details: {
            fields: errors.map((error) => ({
                field: error.property,
                messages: Object.values(error.constraints ?? {}),
            })),
        },
    });
}