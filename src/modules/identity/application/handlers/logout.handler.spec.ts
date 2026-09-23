import { describe, expect, it, vi } from 'vitest';
import { LogoutHandler } from './logout.handler.js';
import type { SessionRepository } from '../ports/private/session.repository.js';

function createTestContext() {
    const sessionRepository = {
        save: vi.fn<SessionRepository['save']>(),
        findByTokenHash: vi.fn<SessionRepository['findByTokenHash']>(),
        deleteById: vi
            .fn<SessionRepository['deleteById']>()
            .mockResolvedValue(undefined),
    } satisfies SessionRepository;

    const handler = new LogoutHandler(sessionRepository);

    return { handler, sessionRepository };
}

describe('LogoutHandler', () => {
    it('revoga somente a sessão informada', async () => {
        const context = createTestContext();

        await expect(
            context.handler.execute('current-session-id'),
        ).resolves.toBeUndefined();

        expect(context.sessionRepository.deleteById)
            .toHaveBeenCalledExactlyOnceWith('current-session-id');
    });

    it('propaga a falha ao revogar a sessão', async () => {
        const context = createTestContext();
        const error = new Error('Falha ao excluir sessão');

        context.sessionRepository.deleteById.mockRejectedValue(error);

        await expect(
            context.handler.execute('current-session-id'),
        ).rejects.toBe(error);
    });
});