import { describe, expect, it } from 'vitest';
import { Person } from './person.js';
import { PersonId } from './person-id.js';

describe('Person', () => {
    it('cria uma pessoa e remove somente os espaços externos', () => {
        const id = PersonId.create();
        const person = Person.create(id, '  Elton  Lima  ');

        expect(person.id).toBe(id);
        expect(person.displayName).toBe('Elton  Lima');
        expect(person.version).toBe(1);
        expect(person.createdAt).toBeInstanceOf(Date);
    });

    it.each(['', ' ', 'A', ' A ', 'A'.repeat(81)])(
        'rejeita nome inválido: %j',
        (name) => {
            expect(() => Person.create(PersonId.create(), name)).toThrow();
        },
    );

    it.each([2, 80])('aceita nome com %i caracteres', (length) => {
        const name = 'A'.repeat(length);
        expect(Person.create(PersonId.create(), name).displayName).toBe(name);
    });
});
