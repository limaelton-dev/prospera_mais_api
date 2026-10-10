import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '../../shared/technical/database/database.module.js';
import { SpacesModule } from '../spaces/spaces.module.js';
import { DEFAULT_SETTLEMENT_RULE_REPOSITORY } from './application/ports/private/default-settlement-rule.repository.js';
import { FINANCES_COMMAND_RECEIPTS } from './application/ports/private/finances-command-receipts.js';
import { ConfigureDefaultSettlementRuleHandler } from './application/handlers/configure-default-settlement-rule.handler.js';
import { GetDefaultSettlementRuleQuery } from './application/queries/get-default-settlement-rule.query.js';
import { DefaultSettlementRuleController } from './http/controllers/default-settlement-rule.controller.js';
import { DefaultSettlementRuleOrmEntity } from './infrastructure/typeorm/entities/default-settlement-rule.orm-entity.js';
import { DefaultSettlementRuleChangeOrmEntity } from './infrastructure/typeorm/entities/default-settlement-rule-change.orm-entity.js';
import { FinancesCommandReceiptOrmEntity } from './infrastructure/typeorm/entities/finances-command-receipt.orm-entity.js';
import { TypeOrmDefaultSettlementRuleRepository } from './infrastructure/typeorm/repositories/typeorm-default-settlement-rule.repository.js';
import { TypeOrmFinancesCommandReceipts } from './infrastructure/typeorm/repositories/typeorm-finances-command-receipts.js';
@Module({
    imports: [
        DatabaseModule,
        SpacesModule,
        TypeOrmModule.forFeature([
            DefaultSettlementRuleOrmEntity,
            DefaultSettlementRuleChangeOrmEntity,
            FinancesCommandReceiptOrmEntity,
        ]),
    ],
    controllers: [DefaultSettlementRuleController],
    providers: [
        ConfigureDefaultSettlementRuleHandler,
        GetDefaultSettlementRuleQuery,
        {
            provide: DEFAULT_SETTLEMENT_RULE_REPOSITORY,
            useClass: TypeOrmDefaultSettlementRuleRepository,
        },
        {
            provide: FINANCES_COMMAND_RECEIPTS,
            useClass: TypeOrmFinancesCommandReceipts,
        },
    ],
})
export class FinancesModule {}
