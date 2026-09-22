export type AuthenticatedContext = {
    person: {
        id: string;
        displayName: string;
        email: string;
    }
    personSpace: {
        id: string;
        type: 'PERSONAL';
        label: 'Meu espaço';
    }
}