import { Body, Controller, Get, Header, Param, Put } from '@nestjs/common';
import {
    CurrentActor,
    type RequestActor,
} from '../../../../shared/technical/http/current-actor.decorator.js';
import { IdempotencyKey } from '../../../../shared/technical/http/idempotency-key.decorator.js';
import { PersonId } from '../../../spaces/domain/person/person-id.js';
import { SpaceId } from '../../../spaces/domain/space/space-id.js';
import { ConfigureDefaultSettlementRuleHandler } from '../../application/handlers/configure-default-settlement-rule.handler.js';
import { GetDefaultSettlementRuleQuery } from '../../application/queries/get-default-settlement-rule.query.js';
import {
    ConfigureDefaultSettlementRuleDto,
    SettlementRuleParamsDto,
} from '../dto/configure-default-settlement-rule.dto.js';
@Controller('spaces/:spaceId/default-settlement-rule')
export class DefaultSettlementRuleController {
    constructor(
        private readonly query: GetDefaultSettlementRuleQuery,
        private readonly handler: ConfigureDefaultSettlementRuleHandler,
    ) {}
    @Get() @Header('Cache-Control', 'no-store') get(
        @CurrentActor() actor: RequestActor,
        @Param() params: SettlementRuleParamsDto,
    ) {
        return this.query.execute(
            PersonId.from(actor.personId.value),
            SpaceId.from(params.spaceId.toLowerCase()),
        );
    }
    @Put() @Header('Cache-Control', 'no-store') put(
        @CurrentActor() actor: RequestActor,
        @Param() params: SettlementRuleParamsDto,
        @IdempotencyKey() key: string,
        @Body() input: ConfigureDefaultSettlementRuleDto,
    ) {
        return this.handler.execute({
            actorId: PersonId.from(actor.personId.value),
            spaceId: SpaceId.from(params.spaceId.toLowerCase()),
            key,
            ...input,
        });
    }
}
