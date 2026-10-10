import type { HttpErrorMapper } from '../../../../shared/technical/http/api-exception.filter.js';
import { FinancesError } from '../../domain/errors/finances.error.js';
export const mapFinancesError: HttpErrorMapper = (error) =>
    error instanceof FinancesError
        ? {
              status: error.code === 'VALIDATION_ERROR' ? 400 : 409,
              body: { code: error.code, message: error.message, details: {} },
          }
        : null;
