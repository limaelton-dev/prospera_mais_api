import { PersonId } from "../../person/person-id.js";
import { Space } from "../../space/space.js";

export const SPACE_REPOSITORY = Symbol('SPACE_REPOSITORY');

export interface SpaceRepository {
  save(space: Space): Promise<void>;

  findPersonalByOwnerPersonId(
    personId: PersonId,
  ): Promise<Space | null>;
}