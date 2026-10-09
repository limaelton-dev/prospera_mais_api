import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { isUUID } from 'class-validator';
import type { Request } from 'express';

import { createValidationException } from './validation/create-validation-exception.js';

export const IdempotencyKey = createParamDecorator<void, string>(
    (_data: void, context: ExecutionContext): string => {
        const request = context.switchToHttp().getRequest<Request>();
        const value = request.headers['idempotency-key'];

        if (typeof value !== 'string' || !isUUID(value, 'all')) {
            throw createValidationException([
                {
                    property: 'Idempotency-Key',
                    constraints: {
                        isUuid: 'Informe uma chave Idempotency-Key UUID válida.',
                    },
                },
            ]);
        }

        return value.toLowerCase();
    },
);
