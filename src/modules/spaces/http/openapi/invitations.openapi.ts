import type {
    OpenAPIObject,
    OperationObject,
    ReferenceObject,
    ResponseObject,
    SchemaObject,
} from '@nestjs/swagger';

type Schema = SchemaObject | ReferenceObject;

const ref = (name: string): ReferenceObject => ({
    $ref: `#/components/schemas/${name}`,
});

const parameter = (name: string): ReferenceObject => ({
    $ref: `#/components/parameters/${name}`,
});

const response = (name: string): ReferenceObject => ({
    $ref: `#/components/responses/${name}`,
});

const values = (...items: string[]): SchemaObject => ({
    type: 'string',
    enum: items,
});

const object = (properties: Record<string, Schema>): SchemaObject => ({
    type: 'object',
    additionalProperties: false,
    required: Object.keys(properties),
    properties,
});

const uuid: SchemaObject = { type: 'string', format: 'uuid' };
const instant: SchemaObject = { type: 'string', format: 'date-time' };
const token: SchemaObject = {
    type: 'string',
    minLength: 43,
    maxLength: 43,
    pattern: '^[A-Za-z0-9_-]{43}$',
    writeOnly: true,
    description:
        'Token base64url recebido do fragmento do link. Preservar a string ' +
        'exata, sem trim ou mudança de caixa. Nunca usar em caminho, query, ' +
        'logs, cache persistido ou exemplos reais.',
};

const noStore = {
    'Cache-Control': {
        description: 'Não armazenar a resposta em cache.',
        schema: values('no-store'),
    },
};

function jsonResponse(schema: Schema, description: string): ResponseObject {
    return {
        description,
        headers: noStore,
        content: { 'application/json': { schema } },
    };
}

function errorResponse(...codes: string[]): ResponseObject {
    return jsonResponse(
        {
            allOf: [
                ref('ErrorResponse'),
                { type: 'object', properties: { code: values(...codes) } },
            ],
        },
        codes.join(', '),
    );
}

function invitationOperation(
    operationId: string,
    summary: string,
    body: string,
    result: string,
    isResponse: boolean,
): OperationObject {
    return {
        operationId,
        summary,
        tags: ['Spaces'],
        security: [{ sessionCookie: [] }],
        description: isResponse
            ? 'Exige sessão, CSRF e Idempotency-Key. Ator vem da sessão; ' +
              'convite e espaço são localizados pelo hash do token. ' +
              'Revalidar estado, vaga, validade e versão na transação. ' +
              'Replay do mesmo ator e entrada recupera a decisão já confirmada, ' +
              'sem repetir a escrita. A recusa não exige membership no replay. ' +
              'Não repetir automaticamente após conflito de versão. ' +
              'Limite: 10 requisições por minuto por IP nesta rota. ' +
              'CSRF pode ser recusado antes da autenticação.'
            : 'Consulta somente leitura, mesmo usando POST. Exige sessão e ' +
              'CSRF; não cria membership, recibo ou atualização de expiração. ' +
              'Token válido mostra apenas identificação mínima do convite. ' +
              'canRespond é informativo e não reserva vaga. ' +
              'Limite: 30 requisições por minuto por IP nesta rota. ' +
              'CSRF pode ser recusado antes da autenticação.',
        parameters: [
            parameter('CsrfHeader'),
            ...(isResponse ? [parameter('SpacesIdempotencyKey')] : []),
        ],
        requestBody: {
            required: true,
            content: { 'application/json': { schema: ref(body) } },
        },
        responses: {
            200: jsonResponse(ref(result), 'Operação concluída.'),
            400: errorResponse('VALIDATION_ERROR'),
            401: response('Unauthenticated'),
            403: errorResponse(
                'INVALID_CSRF_TOKEN',
                ...(isResponse ? ['INVITATION_RESPONSE_NOT_ALLOWED'] : []),
            ),
            404: errorResponse('INVITATION_UNAVAILABLE'),
            409: errorResponse(
                'SPACE_NOT_ACTIVE',
                'SPACE_MEMBER_LIMIT_REACHED',
                ...(isResponse
                    ? ['CONCURRENT_MODIFICATION', 'IDEMPOTENCY_KEY_REUSED']
                    : []),
            ),
            429: response('TooManyRequests'),
            500: errorResponse('INTERNAL_ERROR'),
            default: response('UnexpectedError'),
        },
    };
}

function resolvedInvitation(status: string): SchemaObject {
    return object({
        id: uuid,
        status: values(status),
        resolvedAt: instant,
    });
}

export const invitationsOpenApi: Pick<OpenAPIObject, 'paths' | 'components'> = {
    paths: {
        '/v2/invitations/preview': {
            post: invitationOperation(
                'getInvitationPreview',
                'Consultar a identificação mínima de um convite',
                'SpacesInvitationPreviewRequest',
                'SpacesInvitationPreviewResponse',
                false,
            ),
        },
        '/v2/invitations/respond': {
            post: invitationOperation(
                'respondToSharedSpaceInvitation',
                'Aceitar ou recusar o convite de espaço compartilhado',
                'SpacesRespondToInvitationRequest',
                'SpacesRespondToInvitationResponse',
                true,
            ),
        },
    },
    components: {
        schemas: {
            SpacesInvitationPreviewRequest: object({ token }),
            SpacesRespondToInvitationRequest: object({
                token,
                decision: values('ACCEPT', 'REJECT'),
                expectedVersion: {
                    type: 'integer',
                    minimum: 1,
                    maximum: Number.MAX_SAFE_INTEGER,
                    description:
                        'Versão obtida no preview. Em conflito, consultar ' +
                        'novamente e tomar uma nova decisão explícita.',
                },
            }),
            SpacesInvitationPreviewResponse: object({
                invitation: object({
                    id: uuid,
                    status: values('PENDING'),
                    expiresAt: {
                        ...instant,
                        description:
                            'Convite inválido quando now >= expiresAt. ' +
                            'O preview não renova sua validade.',
                    },
                }),
                space: object({
                    id: uuid,
                    label: { type: 'string' },
                    version: {
                        type: 'integer',
                        minimum: 1,
                        maximum: Number.MAX_SAFE_INTEGER,
                    },
                }),
                invitedBy: object({ displayName: { type: 'string' } }),
                canRespond: {
                    type: 'boolean',
                    description:
                        'False para criador ou membro ativo. A resposta ' +
                        'sempre revalida as regras no backend.',
                },
            }),
            SpacesRespondToInvitationResponse: {
                oneOf: [
                    object({
                        decision: values('ACCEPT'),
                        invitation: resolvedInvitation('ACCEPTED'),
                        spaceId: uuid,
                        actorMembership: ref('SpacesActorMembership'),
                        replayed: { type: 'boolean' },
                    }),
                    object({
                        decision: values('REJECT'),
                        invitation: resolvedInvitation('REJECTED'),
                        spaceId: uuid,
                        actorMembership: { type: 'null' },
                        replayed: { type: 'boolean' },
                    }),
                ],
                description:
                    'Resposta sem token, hash, link ou outro membro. ' +
                    'spaceId na recusa não concede acesso ao espaço. ' +
                    'replayed identifica a recuperação do recibo próprio.',
            },
        },
    },
};
