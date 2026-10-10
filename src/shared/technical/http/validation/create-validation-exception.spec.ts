import { describe, expect, it } from 'vitest';
import { createValidationException } from './create-validation-exception.js';
describe('createValidationException', () => {
    it('preserva campos simples e achata filhos com caminhos e mensagens', () => {
        const response = createValidationException([
            {
                property: 'expectedVersion',
                constraints: {
                    min: 'A versão deve ser maior ou igual a zero.',
                },
            },
            {
                property: 'rule',
                children: [
                    {
                        property: 'dayOfMonth',
                        constraints: {
                            min: 'O dia do acerto deve ser entre 1 e 31.',
                        },
                    },
                ],
            },
        ]).getResponse();
        expect(response).toEqual({
            code: 'VALIDATION_ERROR',
            message: 'Verifique os dados informados.',
            details: {
                fields: [
                    {
                        field: 'expectedVersion',
                        messages: ['A versão deve ser maior ou igual a zero.'],
                    },
                    {
                        field: 'rule.dayOfMonth',
                        messages: ['O dia do acerto deve ser entre 1 e 31.'],
                    },
                ],
            },
        });
    });
    it('localiza rejeição de campos desconhecidos', () => {
        expect(
            createValidationException([
                {
                    property: 'rule',
                    children: [
                        {
                            property: 'actorId',
                            constraints: {
                                whitelistValidation:
                                    'property actorId should not exist',
                            },
                        },
                    ],
                },
            ]).getResponse(),
        ).toMatchObject({
            details: {
                fields: [
                    {
                        field: 'rule.actorId',
                        messages: ['Este campo não é permitido.'],
                    },
                ],
            },
        });
    });
});
