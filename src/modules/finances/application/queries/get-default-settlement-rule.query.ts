import { Inject, Injectable } from '@nestjs/common';
import {
    SPACE_ACCESS_PORT,
    type SpaceAccessPort,
} from '../../../spaces/application/ports/public/space-access.port.js';
import type { PersonId } from '../../../spaces/domain/person/person-id.js';
import type { SpaceId } from '../../../spaces/domain/space/space-id.js';
import {
    DEFAULT_SETTLEMENT_RULE_REPOSITORY,
    type DefaultSettlementRuleRepository,
} from '../ports/private/default-settlement-rule.repository.js';
import { FinancesError } from '../../domain/errors/finances.error.js';
import { settlementRuleView } from '../models/settlement-rule-view.js';
@Injectable()
export class GetDefaultSettlementRuleQuery {
    constructor(
        @Inject(SPACE_ACCESS_PORT) private readonly access: SpaceAccessPort,
        @Inject(DEFAULT_SETTLEMENT_RULE_REPOSITORY)
        private readonly repository: DefaultSettlementRuleRepository,
    ) {}
    async execute(actorId: PersonId, spaceId: SpaceId) {
        const context = await this.access.assertCanRead(actorId, spaceId);
        if (context.type !== 'SHARED')
            throw new FinancesError('SHARED_SPACE_REQUIRED');
        const aggregate = await this.repository.find(spaceId.value);
        await this.access.assertCanRead(actorId, spaceId);
        return settlementRuleView(spaceId.value, aggregate);
    }
}
