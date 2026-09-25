import 'reflect-metadata';
import { createHash, randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import {
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { TEST_DATABASE_URL } from './setup-env.js';
import { AppModule } from '../dist/app.module.js';
import { configureApp } from '../dist/configure-app.js';
import migrationDataSource from '../dist/shared/technical/database/typeorm/data-source.js';
import { RegisterAccountHandler } from '../dist/modules/identity/application/handlers/register-account.handler.js';
import { TypeOrmCredentialRepository } from '../dist/modules/identity/infrastructure/typeorm/repositories/typeorm-credential.repository.js';
import { TypeOrmSessionRepository } from '../dist/modules/identity/infrastructure/typeorm/repositories/typeorm-session.repository.js';
import { AuthSessionOrmEntity } from '../dist/modules/identity/infrastructure/typeorm/entities/auth-session.orm-entity.js';
import { SpaceOrmEntity } from '../dist/modules/spaces/infrastructure/typeorm/entities/space.orm-entity.js';
import { PersonId } from '../dist/modules/spaces/domain/person/person-id.js';
import { EmailAlreadyInUseError } from '../dist/modules/identity/application/errors/email-already-in-use.error.js';

const account = {
    displayName: '  Elton Lima  ',
    email: 'elton@example.com',
    password: 'uma-senha-de-teste',
};

const tables = [
    'persons',
    'spaces',
    'auth_credentials',
    'auth_sessions',
] as const;

function assertTestDatabase(source: DataSource): void {
    if (
        process.env.NODE_ENV !== 'test' ||
        source.options.type !== 'postgres' ||
        source.options.url !== TEST_DATABASE_URL
    ) {
        throw new Error(
            'Operação permitida somente no PostgreSQL isolado de testes.',
        );
    }
}

describe('CARD-001 — PostgreSQL e HTTP', () => {
    let app: INestApplication<Server>;
    let db: DataSource;
    let migrations: string[];

    beforeAll(async () => {
        assertTestDatabase(migrationDataSource);
        await migrationDataSource.initialize();

        try {
            await migrationDataSource.dropDatabase();
            migrations = (await migrationDataSource.runMigrations()).map(
                (migration) => migration.name,
            );
        } finally {
            await migrationDataSource.destroy();
        }
    });

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = module.createNestApplication();
        configureApp(app);
        await app.init();

        db = app.get(DataSource);
        assertTestDatabase(db);

        await db.query(
            'TRUNCATE TABLE auth_sessions, auth_credentials, spaces, persons',
        );
    });

    afterEach(async () => {
        vi.restoreAllMocks();
        await app?.close();
    });

    async function counts(): Promise<number[]> {
        return Promise.all(
            tables.map(async (table) => {
                const rows: { total: number }[] = await db.query(
                    `SELECT count(*)::int AS total FROM "${table}"`,
                );
                return rows[0].total;
            }),
        );
    }

    function register(email = account.email) {
        return app.get(RegisterAccountHandler).execute({ ...account, email });
    }

    async function csrf(
        agent: ReturnType<typeof request.agent>,
    ): Promise<string> {
        const response = await agent
            .get('/v2/auth/csrf')
            .expect(200)
            .expect('Cache-Control', 'no-store');

        expect(response.body.csrfToken).toEqual(expect.any(String));
        return response.body.csrfToken as string;
    }

    function sessionCookie(response: request.Response): string {
        const headers: string[] = response.get('Set-Cookie') ?? [];
        const cookie = headers.find((value) => value.startsWith('session='));
        expect(cookie).toBeDefined();
        return cookie!;
    }

    it('aplica a migration real em banco vazio', async () => {
        expect(migrations).toEqual(['InitialCard0011789556956788']);
        expect(await counts()).toEqual([0, 0, 0, 0]);

        const rows = await db.query('SELECT name FROM migrations');
        expect(rows).toEqual([{ name: 'InitialCard0011789556956788' }]);
    });

    it('persiste pessoa, espaço, credencial e hash da sessão', async () => {
        const result = await register('  ELTON@EXAMPLE.COM  ');
        const credentials = app.get(TypeOrmCredentialRepository);
        const credential = await credentials.findByEmail(account.email);
        const hash = createHash('sha256').update(result.sessionToken).digest();
        const session = await app
            .get(TypeOrmSessionRepository)
            .findByTokenHash(hash);

        expect(await counts()).toEqual([1, 1, 1, 1]);
        expect(result.context.person.displayName).toBe('Elton Lima');
        expect(credential?.passwordHash).toMatch(/^\$argon2id\$/);
        expect(credential?.passwordHash).not.toBe(account.password);
        expect(session?.personId.value).toBe(result.context.person.id);
        expect(session?.tokenHash).toEqual(hash);
        expect(
            session!.expiresAt.getTime() - session!.createdAt.getTime(),
        ).toBe(604800000);
    });

    it('o banco impede e-mail duplicado e o repository traduz o conflito', async () => {
        await register();
        const second = await register('outra@example.com');
        const repository = app.get(TypeOrmCredentialRepository);
        const credential = await repository.findByEmail(account.email);

        await expect(
            repository.save({
                ...credential!,
                personId: PersonId.from(second.context.person.id),
            }),
        ).rejects.toBeInstanceOf(EmailAlreadyInUseError);
    });

    it('o banco impede dois espaços pessoais para o mesmo titular', async () => {
        const result = await register();
        const repository = db.getRepository(SpaceOrmEntity);
        const space = await repository.findOneByOrFail({
            id: result.context.personalSpace.id,
        });

        await expect(
            repository.insert({ ...space, id: randomUUID() }),
        ).rejects.toMatchObject({
            driverError: {
                code: '23505',
                constraint: 'UQ_spaces_personal_owner',
            },
        });
    });

    it('o banco impede hashes de sessão duplicados', async () => {
        const result = await register();
        const repository = db.getRepository(AuthSessionOrmEntity);
        const session = await repository.findOneByOrFail({
            personId: result.context.person.id,
        });

        await expect(
            repository.insert({ ...session, id: randomUUID() }),
        ).rejects.toMatchObject({
            driverError: {
                code: '23505',
                constraint: 'UQ_auth_sessions_token_hash',
            },
        });
    });

    it('desfaz os quatro registros quando o cadastro falha antes do commit', async () => {
        const repository = app.get(TypeOrmSessionRepository);
        const save = repository.save.bind(repository);
        const failure = new Error('Falha controlada após persistir a sessão');

        vi.spyOn(repository, 'save').mockImplementation(async (session) => {
            await save(session);
            throw failure;
        });

        await expect(register()).rejects.toBe(failure);
        expect(await counts()).toEqual([0, 0, 0, 0]);
    });

    it('o repository encontra sessão válida e ignora expirada ou inexistente', async () => {
        const result = await register();
        const hash = createHash('sha256').update(result.sessionToken).digest();
        const repository = app.get(TypeOrmSessionRepository);

        expect(await repository.findByTokenHash(hash)).not.toBeNull();
        expect(await repository.findByTokenHash(Buffer.alloc(32))).toBeNull();

        await db
            .getRepository(AuthSessionOrmEntity)
            .update(
                { personId: result.context.person.id },
                { expiresAt: new Date(0) },
            );

        expect(await repository.findByTokenHash(hash)).toBeNull();

        await request(app.getHttpServer())
            .get('/v2/auth/me')
            .set('Cookie', `session=${result.sessionToken}`)
            .expect(401)
            .expect(({ body }) => expect(body.code).toBe('UNAUTHENTICATED'));
    });

    it('emite CSRF público com cookies e sem cache', async () => {
        const response = await request(app.getHttpServer())
            .get('/v2/auth/csrf')
            .expect(200)
            .expect('Cache-Control', 'no-store');

        expect(response.body.csrfToken).toEqual(expect.any(String));
        const cookies: string[] = response.get('Set-Cookie') ?? [];
        expect(
            cookies.some((cookie) => cookie.startsWith('csrf-context=')),
        ).toBe(true);
        expect(cookies.some((cookie) => cookie.startsWith('csrf='))).toBe(true);

        for (const cookie of cookies) {
            expect(cookie).toContain('HttpOnly');
            expect(cookie).toContain('SameSite=Lax');
            expect(cookie).toContain('Path=/');
            expect(cookie).not.toContain('Secure');
            expect(cookie).not.toContain('Domain=');
        }
    });

    it.each(['register', 'login', 'logout'])(
        'rejeita POST /auth/%s sem CSRF e mantém CORS',
        async (operation) => {
            const response = await request(app.getHttpServer())
                .post(`/v2/auth/${operation}`)
                .set('Origin', 'http://localhost:3000')
                .send(account)
                .expect(403)
                .expect('Cache-Control', 'no-store')
                .expect('Access-Control-Allow-Origin', 'http://localhost:3000')
                .expect('Access-Control-Allow-Credentials', 'true');

            expect(response.body.code).toBe('INVALID_CSRF_TOKEN');
            expect(await counts()).toEqual([0, 0, 0, 0]);
        },
    );

    it('rejeita token CSRF pertencente a outro visitante', async () => {
        const first = request.agent(app.getHttpServer());
        const second = request.agent(app.getHttpServer());
        const firstToken = await csrf(first);
        await csrf(second);

        await second
            .post('/v2/auth/register')
            .set('X-CSRF-Token', firstToken)
            .send(account)
            .expect(403);
    });

    it.each([undefined, 'session=invalida'])(
        '/me exige uma sessão válida: %s',
        async (cookie) => {
            const call = request(app.getHttpServer()).get('/v2/auth/me');
            if (cookie) call.set('Cookie', cookie);

            await call
                .expect(401)
                .expect('Cache-Control', 'no-store')
                .expect(({ body }) =>
                    expect(body.code).toBe('UNAUTHENTICATED'),
                );
        },
    );

    it('cadastra, restaura contexto, faz login e revoga só a sessão atual', async () => {
        const first = request.agent(app.getHttpServer());
        const anonymousToken = await csrf(first);
        const created = await first
            .post('/v2/auth/register')
            .set('X-CSRF-Token', anonymousToken)
            .send(account)
            .expect(201)
            .expect('Cache-Control', 'no-store');

        const cookie = sessionCookie(created);
        expect(cookie).toContain('HttpOnly');
        expect(cookie).toContain('SameSite=Lax');
        expect(cookie).toContain('Path=/');
        expect(cookie).toContain('Max-Age=604800');
        expect(cookie).not.toContain('Secure');
        expect(cookie).not.toContain('Domain=');

        expect(created.body.person).toEqual({
            id: expect.any(String),
            displayName: 'Elton Lima',
            email: account.email,
        });

        expect(created.body.personalSpace).toEqual({
            id: expect.any(String),
            type: 'PERSONAL',
            label: 'Meu espaço',
        });

        expect(created.body).not.toHaveProperty('sessionToken');
        expect(await counts()).toEqual([1, 1, 1, 1]);

        await first.get('/v2/auth/me').expect(200).expect(created.body);
        await first.get('/v2/auth/me').expect(200).expect(created.body);

        const second = request.agent(app.getHttpServer());
        const loginToken = await csrf(second);
        const loggedIn = await second
            .post('/v2/auth/login')
            .set('X-CSRF-Token', loginToken)
            .send({ email: account.email, password: account.password })
            .expect(200)
            .expect(created.body);

        expect(sessionCookie(loggedIn).split(';')[0]).not.toBe(
            cookie.split(';')[0],
        );

        expect(await counts()).toEqual([1, 1, 1, 2]);

        await first
            .post('/v2/auth/logout')
            .set('X-CSRF-Token', anonymousToken)
            .expect(403);

        const logoutToken = await csrf(first);
        const loggedOut = await first
            .post('/v2/auth/logout')
            .set('X-CSRF-Token', logoutToken)
            .expect(204)
            .expect('Cache-Control', 'no-store');

        expect(loggedOut.text).toBe('');
        expect(sessionCookie(loggedOut)).toMatch(/^session=;/);
        expect(sessionCookie(loggedOut)).toContain('Expires=Thu, 01 Jan 1970');

        await first.get('/v2/auth/me').expect(401);

        await request(app.getHttpServer())
            .get('/v2/auth/me')
            .set('Cookie', cookie.split(';')[0])
            .expect(401);

        await second.get('/v2/auth/me').expect(200).expect(created.body);
        expect(await counts()).toEqual([1, 1, 1, 1]);
    });

    it.each([account.email, 'inexistente@example.com'])(
        'login retorna o mesmo erro para credenciais inválidas: %s',
        async (email) => {
            await register();
            const agent = request.agent(app.getHttpServer());
            const token = await csrf(agent);

            await agent
                .post('/v2/auth/login')
                .set('X-CSRF-Token', token)
                .send({ email, password: 'senha-incorreta' })
                .expect(401)
                .expect({
                    code: 'INVALID_CREDENTIALS',
                    message: 'E-mail ou senha inválidos.',
                    details: {},
                });
        },
    );

    it.each([
        ['admin', { ...account, admin: 'segredo-extra' }],
        ['displayName', { ...account, displayName: '   ' }],
        ['password', { ...account, password: '12345' }],
        ['email', { ...account, email: 'invalido' }],
    ])('rejeita payload inválido no campo %s', async (field, payload) => {
        const agent = request.agent(app.getHttpServer());
        const token = await csrf(agent);
        const response = await agent
            .post('/v2/auth/register')
            .set('X-CSRF-Token', token)
            .send(payload)
            .expect(400);

        expect(response.body.code).toBe('VALIDATION_ERROR');

        expect(response.body.details.fields).toEqual(
            expect.arrayContaining([expect.objectContaining({ field })]),
        );

        expect(JSON.stringify(response.body)).not.toContain('segredo-extra');
        expect(JSON.stringify(response.body)).not.toContain(account.password);
        expect(await counts()).toEqual([0, 0, 0, 0]);
    });

    it('dois cadastros concorrentes resultam em um sucesso e um conflito', async () => {
        const agents = [
            request.agent(app.getHttpServer()),
            request.agent(app.getHttpServer()),
        ];

        const tokens = await Promise.all(agents.map(csrf));

        const responses = await Promise.all(
            agents.map((agent, index) =>
                agent
                    .post('/v2/auth/register')
                    .set('X-CSRF-Token', tokens[index])
                    .send(account),
            ),
        );

        expect(responses.map((response) => response.status).sort()).toEqual([
            201, 409,
        ]);

        expect(
            responses.find((response) => response.status === 409)?.body.code,
        ).toBe('EMAIL_ALREADY_IN_USE');

        expect(await counts()).toEqual([1, 1, 1, 1]);
    });

    it.each([
        ['csrf', 60],
        ['register', 5],
        ['login', 10],
    ] as const)('aplica rate limit em %s', async (operation, limit) => {
        const agent = request.agent(app.getHttpServer());
        const token = operation === 'csrf' ? '' : await csrf(agent);

        const call = () =>
            operation === 'csrf'
                ? agent.get('/v2/auth/csrf')
                : agent
                      .post(`/v2/auth/${operation}`)
                      .set('X-CSRF-Token', token)
                      .send({});

        for (let attempt = 0; attempt < limit; attempt++) {
            await call().expect(operation === 'csrf' ? 200 : 400);
        }

        const blocked = await call().expect(429);

        expect(blocked.body.code).toBe('TOO_MANY_REQUESTS');
        expect(Number(blocked.get('Retry-After'))).toBeGreaterThan(0);
    });

    it('atende preflight CORS antes de autenticação e CSRF', async () => {
        await request(app.getHttpServer())
            .options('/v2/auth/register')
            .set('Origin', 'http://localhost:3000')
            .set('Access-Control-Request-Method', 'POST')
            .set('Access-Control-Request-Headers', 'content-type,x-csrf-token')
            .expect(204)
            .expect('Access-Control-Allow-Origin', 'http://localhost:3000')
            .expect('Access-Control-Allow-Credentials', 'true');
    });

    it('publica Swagger, JSON e YAML sem exigir sessão', async () => {
        await request(app.getHttpServer()).get('/v2/docs').expect(200);

        await request(app.getHttpServer())
            .get('/v2/openapi.yaml')
            .expect(200)
            .expect(/openapi: 3.1.0/);

        const response = await request(app.getHttpServer())
            .get('/v2/openapi.json')
            .expect(200);

        expect(response.body.openapi).toBe('3.1.0');
        expect(Object.keys(response.body.paths)).toHaveLength(5);

        expect(
            response.body.components.schemas.RegisterAccountRequest.properties
                .password.minLength,
        ).toBe(6);
    });
});
