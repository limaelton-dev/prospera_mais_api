export class EmailAlreadyInUseError extends Error {
    readonly code = 'EMAIL_ALREADY_IN_USE';

    constructor() {
        super('Já existe uma conta com este e-mail.');
        this.name = 'EmailAlreadyInUseError';
    }
}