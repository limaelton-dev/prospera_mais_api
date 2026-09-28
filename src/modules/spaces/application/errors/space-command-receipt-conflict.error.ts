export class SpaceCommandReceiptConflictError extends Error {
    constructor() {
        super('Another transaction has recorded this command.');
        this.name = 'SpaceCommandReceiptConflictError';
    }
}
