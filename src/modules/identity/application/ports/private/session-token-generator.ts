export interface GeneratedSessionToken {
    token: string;
    tokenHash: Buffer;
}

export const SESSION_TOKEN_GENERATOR = Symbol('SESSION_TOKEN_GENERATOR');

export interface SessionTokenGenerator {
    generate(): GeneratedSessionToken;

    hash(token: string): Buffer;
}