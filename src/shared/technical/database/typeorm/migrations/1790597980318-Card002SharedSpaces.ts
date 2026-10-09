import { MigrationInterface, QueryRunner } from 'typeorm';

export class Card002SharedSpaces1790597980318 implements MigrationInterface {
    name = 'Card002SharedSpaces1790597980318';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "space_command_receipts" ("actor_id" uuid NOT NULL, "operation" character varying(32) NOT NULL, "key" uuid NOT NULL, "request_hash" bytea NOT NULL, "result_space_id" uuid NOT NULL, "result_invitation_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "CHK_space_command_receipts_hash" CHECK (octet_length("request_hash") = 32), CONSTRAINT "CHK_space_command_receipts_operation" CHECK ("operation" IN ('CREATE_SPACE', 'ISSUE_INVITATION', 'REPLACE_INVITATION')), CONSTRAINT "PK_space_command_receipts" PRIMARY KEY ("actor_id", "operation", "key"))`,
        );
        await queryRunner.query(`CREATE TABLE "space_invitations" ("id" uuid NOT NULL, "space_id" uuid NOT NULL, "invited_by_person_id" uuid NOT NULL, "token_hash" bytea NOT NULL, "status" character varying(16) NOT NULL, "issued_at" TIMESTAMP WITH TIME ZONE NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "resolved_at" TIMESTAMP WITH TIME ZONE, "cancellation_reason" character varying(16), "replaced_by_invitation_id" uuid, CONSTRAINT "UQ_space_invitations_id_space" UNIQUE ("id", "space_id"), CONSTRAINT "CHK_space_invitations_replacement" CHECK ((
        "status" = 'CANCELLED'
        AND "cancellation_reason" IS NOT NULL
        AND "cancellation_reason" = 'REPLACED'
        AND "replaced_by_invitation_id" IS NOT NULL
        AND "replaced_by_invitation_id" <> "id"
    ) OR (
        "status" <> 'CANCELLED'
        AND "cancellation_reason" IS NULL
        AND "replaced_by_invitation_id" IS NULL
    )), CONSTRAINT "CHK_space_invitations_resolution" CHECK (("status" = 'PENDING' AND "resolved_at" IS NULL)
    OR ("status" <> 'PENDING' AND "resolved_at" IS NOT NULL)), CONSTRAINT "CHK_space_invitations_dates" CHECK ("expires_at" > "issued_at"
    AND ("resolved_at" IS NULL OR "resolved_at" >= "issued_at")), CONSTRAINT "CHK_space_invitations_hash" CHECK (octet_length("token_hash") = 32), CONSTRAINT "CHK_space_invitations_status" CHECK ("status" IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED')), CONSTRAINT "PK_4be9882bffb82c0ee4486363703" PRIMARY KEY ("id"))`);
        await queryRunner.query(
            `CREATE INDEX "IDX_space_invitations_history" ON "space_invitations"  ("space_id", "issued_at", "id") `,
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "UQ_space_invitations_token_hash" ON "space_invitations"  ("token_hash") `,
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "UQ_space_invitations_pending" ON "space_invitations"  ("space_id") WHERE "status" = 'PENDING'`,
        );
        await queryRunner.query(
            `CREATE TABLE "space_members" ("id" uuid NOT NULL, "space_id" uuid NOT NULL, "person_id" uuid NOT NULL, "status" character varying(16) NOT NULL, "slot" smallint NOT NULL, "joined_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "CHK_space_members_slot" CHECK ("slot" IN (1, 2)), CONSTRAINT "CHK_space_members_status" CHECK ("status" = 'ACTIVE'), CONSTRAINT "PK_5aaa6440d7f1e8b8c051df43d5e" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "UQ_space_members_active_slot" ON "space_members"  ("space_id", "slot") WHERE "status" = 'ACTIVE'`,
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "UQ_space_members_active_person" ON "space_members"  ("space_id", "person_id") WHERE "status" = 'ACTIVE'`,
        );
        await queryRunner.query(
            `ALTER TABLE "spaces" ADD "name" character varying(80)`,
        );
        await queryRunner.query(
            `ALTER TABLE "spaces" ADD "created_by_person_id" uuid`,
        );
        await queryRunner.query(
            `ALTER TABLE "spaces" ADD CONSTRAINT "CHK_spaces_version" CHECK ("version" >= 1)`,
        );
        await queryRunner.query(`ALTER TABLE "spaces" ADD CONSTRAINT "CHK_spaces_variant" CHECK ((
        "type" = 'PERSONAL'
        AND "personal_owner_person_id" IS NOT NULL
        AND "status" = 'ACTIVE'
        AND "name" IS NULL
        AND "created_by_person_id" IS NULL
    ) OR (
        "type" = 'SHARED'
        AND "personal_owner_person_id" IS NULL
        AND "name" IS NOT NULL
        AND length(btrim("name")) > 0
        AND "created_by_person_id" IS NOT NULL
    ))`);
        await queryRunner.query(
            `ALTER TABLE "space_command_receipts" ADD CONSTRAINT "FK_space_command_receipts_actor" FOREIGN KEY ("actor_id") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "space_command_receipts" ADD CONSTRAINT "FK_space_command_receipts_result" FOREIGN KEY ("result_invitation_id", "result_space_id") REFERENCES "space_invitations"("id","space_id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "space_invitations" ADD CONSTRAINT "FK_space_invitations_space" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "space_invitations" ADD CONSTRAINT "FK_space_invitations_issuer" FOREIGN KEY ("invited_by_person_id") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "space_invitations" ADD CONSTRAINT "FK_space_invitations_replacement" FOREIGN KEY ("replaced_by_invitation_id", "space_id") REFERENCES "space_invitations"("id","space_id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY DEFERRED`,
        );
        await queryRunner.query(
            `ALTER TABLE "space_members" ADD CONSTRAINT "FK_space_members_space" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "space_members" ADD CONSTRAINT "FK_space_members_person" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "spaces" ADD CONSTRAINT "FK_spaces_creator" FOREIGN KEY ("created_by_person_id") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "spaces" DROP CONSTRAINT "FK_spaces_creator"`,
        );
        await queryRunner.query(
            `ALTER TABLE "space_members" DROP CONSTRAINT "FK_space_members_person"`,
        );
        await queryRunner.query(
            `ALTER TABLE "space_members" DROP CONSTRAINT "FK_space_members_space"`,
        );
        await queryRunner.query(
            `ALTER TABLE "space_invitations" DROP CONSTRAINT "FK_space_invitations_replacement"`,
        );
        await queryRunner.query(
            `ALTER TABLE "space_invitations" DROP CONSTRAINT "FK_space_invitations_issuer"`,
        );
        await queryRunner.query(
            `ALTER TABLE "space_invitations" DROP CONSTRAINT "FK_space_invitations_space"`,
        );
        await queryRunner.query(
            `ALTER TABLE "space_command_receipts" DROP CONSTRAINT "FK_space_command_receipts_result"`,
        );
        await queryRunner.query(
            `ALTER TABLE "space_command_receipts" DROP CONSTRAINT "FK_space_command_receipts_actor"`,
        );
        await queryRunner.query(
            `ALTER TABLE "spaces" DROP CONSTRAINT "CHK_spaces_variant"`,
        );
        await queryRunner.query(
            `ALTER TABLE "spaces" DROP CONSTRAINT "CHK_spaces_version"`,
        );
        await queryRunner.query(
            `ALTER TABLE "spaces" DROP COLUMN "created_by_person_id"`,
        );
        await queryRunner.query(`ALTER TABLE "spaces" DROP COLUMN "name"`);
        await queryRunner.query(
            `DROP INDEX "public"."UQ_space_members_active_person"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."UQ_space_members_active_slot"`,
        );
        await queryRunner.query(`DROP TABLE "space_members"`);
        await queryRunner.query(
            `DROP INDEX "public"."UQ_space_invitations_pending"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."UQ_space_invitations_token_hash"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_space_invitations_history"`,
        );
        await queryRunner.query(`DROP TABLE "space_invitations"`);
        await queryRunner.query(`DROP TABLE "space_command_receipts"`);
    }
}
