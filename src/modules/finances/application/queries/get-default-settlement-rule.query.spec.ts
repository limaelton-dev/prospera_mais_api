import { describe, it, expect, vi } from 'vitest';
import { GetDefaultSettlementRuleQuery } from './get-default-settlement-rule.query.js';
import { PersonId } from '../../../spaces/domain/person/person-id.js';
import { SpaceId } from '../../../spaces/domain/space/space-id.js';
import { SpacesDomainError } from '../../../spaces/domain/errors/spaces-domain.error.js';
import { DefaultSettlementRule } from '../../domain/default-settlement-rule/default-settlement-rule.js';
import { SettlementRule } from '../../domain/settlement-rule/settlement-rule.js';
describe('GetDefaultSettlementRuleQuery — acesso entre autorização e leitura', () => {
    it('não revela regra quando acesso é perdido durante a leitura', async () => {
        const actor = PersonId.create(),
            space = SpaceId.create();
        const access = {
            assertCanRead: vi
                .fn()
                .mockResolvedValueOnce({
                    spaceId: space.value,
                    type: 'SHARED',
                    status: 'ACTIVE',
                    actorMemberId: 'member',
                })
                .mockRejectedValueOnce(
                    new SpacesDomainError('SPACE_NOT_FOUND'),
                ),
            assertCanWrite: vi.fn(),
        };
        const repository = {
            find: vi.fn().mockResolvedValue(
                DefaultSettlementRule.create(
                    space.value,
                    SettlementRule.from({
                        kind: 'MONTHLY_DAY',
                        dayOfMonth: 10,
                    }),
                    new Date(),
                ),
            ),
            save: vi.fn(),
        };
        await expect(
            new GetDefaultSettlementRuleQuery(access, repository).execute(
                actor,
                space,
            ),
        ).rejects.toMatchObject({ code: 'SPACE_NOT_FOUND' });
        expect(access.assertCanRead).toHaveBeenCalledTimes(2);
        expect(repository.save).not.toHaveBeenCalled();
    });
});
