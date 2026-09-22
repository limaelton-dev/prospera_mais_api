import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { TransactionContext } from './transaction-context.js';

@Injectable()
export class EntityManagerProvider {
    constructor(
        private readonly dataSource: DataSource,
        private readonly transactionContext: TransactionContext,
    ) {}

    get(): EntityManager {
        return (
            this.transactionContext.getEntityManager() ??
            this.dataSource.manager
        );
    }
}
