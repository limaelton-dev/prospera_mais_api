export type FinancesErrorCode =
    | 'VALIDATION_ERROR'
    | 'SHARED_SPACE_REQUIRED'
    | 'CONCURRENT_MODIFICATION'
    | 'IDEMPOTENCY_KEY_REUSED';
const messages: Record<FinancesErrorCode, string> = {
    VALIDATION_ERROR: 'Informe uma regra e uma data válidas.',
    SHARED_SPACE_REQUIRED:
        'A regra de acerto se aplica somente a espaços compartilhados.',
    CONCURRENT_MODIFICATION:
        'A regra foi alterada. Atualize os dados e confirme novamente.',
    IDEMPOTENCY_KEY_REUSED: 'Esta chave já foi usada para outra solicitação.',
};
export class FinancesError extends Error {
    constructor(public readonly code: FinancesErrorCode) {
        super(messages[code]);
    }
}
