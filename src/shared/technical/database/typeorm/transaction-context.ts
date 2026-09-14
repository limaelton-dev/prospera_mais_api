import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "node:async_hooks";
import { EntityManager } from "typeorm";

@Injectable()
export class TransactionContext {
    private readonly storage = new AsyncLocalStorage<EntityManager>();

    run<T>(
        entityManager: EntityManager,
        work: () => Promise<T>
    ): Promise<T> {
        return this.storage.run(entityManager, work);
    }

    getEntityManager(): EntityManager | undefined {
        return this.storage.getStore();
    }
}