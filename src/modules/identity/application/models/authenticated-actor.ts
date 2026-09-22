import { type PersonId } from "../../../spaces/domain/person/person-id.js"

export type AuthenticatedActor = {
    personId: PersonId,
    sessionId: string,
}
