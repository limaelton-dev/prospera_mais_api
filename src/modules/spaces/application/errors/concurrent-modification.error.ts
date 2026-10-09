export class ConcurrentModificationError extends Error {
    readonly code = 'CONCURRENT_MODIFICATION';

    constructor() {
        super('O espaço foi alterado. Atualize os dados antes de continuar.');
        this.name = 'ConcurrentModificationError';
    }
}
