export class IdempotencyKeyReusedError extends Error {
    readonly code = 'IDEMPOTENCY_KEY_REUSED';

    constructor() {
        super('Esta chave já foi utilizada com outra entrada.');
        this.name = 'IdempotencyKeyReusedError';
    }
}
