import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialCard0011789556956788 implements MigrationInterface {
  name = 'InitialCard0011789556956788';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
        `CREATE TABLE "auth_credentials" (
            "person_id" uuid NOT NULL, 
            "email" character varying(254) NOT NULL, 
            "password_hash" text NOT NULL, 
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, 
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, 
            CONSTRAINT "PK_080a7e7a671571ddd8cfc0c3622" PRIMARY KEY ("person_id")
        )`,
    );
    await queryRunner.query(
        `CREATE UNIQUE INDEX "UQ_auth_credentials_email" ON "auth_credentials"  ("email") `,
    );
    await queryRunner.query(
        `CREATE TABLE "auth_sessions" (
            "id" uuid NOT NULL, 
            "person_id" uuid NOT NULL, 
            "token_hash" bytea NOT NULL, 
            "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, 
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_641507381f32580e8479efc36cd" PRIMARY KEY ("id")
        )`,
    );
    await queryRunner.query(
        `CREATE INDEX "IDX_auth_sessions_expires_at" ON "auth_sessions"  ("expires_at") `,
    );
    await queryRunner.query(
        `CREATE INDEX "IDX_auth_sessions_person_id" ON "auth_sessions"  ("person_id") `,
    );
    await queryRunner.query(
        `CREATE UNIQUE INDEX "UQ_auth_sessions_token_hash" ON "auth_sessions"  ("token_hash") `,
    );
    await queryRunner.query(
        `CREATE TABLE "persons" (
            "id" uuid NOT NULL, 
            "display_name" character varying(80) NOT NULL, 
            "version" integer NOT NULL DEFAULT '1', 
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, 
            CONSTRAINT "PK_74278d8812a049233ce41440ac7" PRIMARY KEY ("id")
        )`,
    );
    await queryRunner.query(
        `CREATE TABLE "spaces" ("id" uuid NOT NULL, 
            "type" character varying(16) NOT NULL, 
            "status" character varying(16) NOT NULL, 
            "personal_owner_person_id" uuid, 
            "version" integer NOT NULL DEFAULT '1', 
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, 
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, 
            CONSTRAINT "CHK_spaces_personal_rules" 
                CHECK (
                    "type" <> 'PERSONAL' 
                    OR ("personal_owner_person_id" IS NOT NULL AND "status" = 'ACTIVE')
                ),
            CONSTRAINT "CHK_spaces_status" 
                CHECK (
                    "status" IN ('ACTIVE', 'CLOSING', 'CLOSED')
                ), 
            CONSTRAINT "CHK_spaces_type" 
                CHECK (
                    "type" IN ('PERSONAL', 'SHARED')
                ), 
            CONSTRAINT "PK_dbe542974aca57afcb60709d4c8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
        `CREATE UNIQUE INDEX "UQ_spaces_personal_owner" ON "spaces"  ("personal_owner_person_id") WHERE "type" = 'PERSONAL'`,
    );
    await queryRunner.query(
        `ALTER TABLE "auth_credentials" ADD CONSTRAINT "FK_auth_credentials_person" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
        `ALTER TABLE "auth_sessions" ADD CONSTRAINT "FK_auth_sessions_person" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
        `ALTER TABLE "spaces" ADD CONSTRAINT "FK_spaces_personal_owner" FOREIGN KEY ("personal_owner_person_id") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
        `ALTER TABLE "spaces" DROP CONSTRAINT "FK_spaces_personal_owner"`,
    );
    await queryRunner.query(
        `ALTER TABLE "auth_sessions" DROP CONSTRAINT "FK_auth_sessions_person"`,
    );
    await queryRunner.query(
        `ALTER TABLE "auth_credentials" DROP CONSTRAINT "FK_auth_credentials_person"`,
    );
    await queryRunner.query(`DROP INDEX "public"."UQ_spaces_personal_owner"`);
    await queryRunner.query(`DROP TABLE "spaces"`);
    await queryRunner.query(`DROP TABLE "persons"`);
    await queryRunner.query(
        `DROP INDEX "public"."UQ_auth_sessions_token_hash"`,
    );
    await queryRunner.query(
        `DROP INDEX "public"."IDX_auth_sessions_person_id"`,
    );
    await queryRunner.query(
        `DROP INDEX "public"."IDX_auth_sessions_expires_at"`,
    );
    await queryRunner.query(`DROP TABLE "auth_sessions"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_auth_credentials_email"`);
    await queryRunner.query(`DROP TABLE "auth_credentials"`);
  }
}
