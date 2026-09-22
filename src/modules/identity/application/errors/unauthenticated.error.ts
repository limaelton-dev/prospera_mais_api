export class UnauthenticatedError extends Error {
    readonly code = 'UNAUTHENTICATED';

    constructor() {
        super('Sua sessão não é válida ou expirou.');
        this.name = 'UnauthenticatedError';
    }
}
