import { describe, expect, it } from 'vitest';
import { PersonId } from '../person/person-id.js';
import { SpaceId } from './space-id.js';
import { Space, SpaceStatus, SpaceType } from './space.js';

describe('Space', () => {
    it('cria espaço pessoal ativo com titular', () => {
        const id = SpaceId.create();
        const owner = PersonId.create();
        const space = Space.createPersonal(id, owner);

        expect(space.id).toBe(id);
        expect(space.type).toBe(SpaceType.PERSONAL);
        expect(space.status).toBe(SpaceStatus.ACTIVE);
        expect(space.personalOwnerPersonId).toBe(owner);
        expect(space.version).toBe(1);
        expect(space.createdAt).toEqual(space.updatedAt);
    });

    it.each([null, undefined])('rejeita titular ausente: %s', (owner) => {
        expect(() =>
            Space.createPersonal(
                SpaceId.create(),
                owner as unknown as PersonId,
            ),
        ).toThrow('Personal space requires an owner');
    });
});
