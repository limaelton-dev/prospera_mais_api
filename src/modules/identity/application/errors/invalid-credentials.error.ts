export class InvalidCredentialsError extends Error {
    readonly code = 'INVALID_CREDENTIALS';

    constructor() {
        super('E-mail ou senha inválidos.');
        this.name = 'InvalidCredentialsError';
    }
}
