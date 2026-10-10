import type { MigrationInterface, QueryRunner } from 'typeorm';
export class ConfigureDefaultSettlementRule1791590400000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE default_settlement_rules (
space_id uuid CONSTRAINT "PK_default_settlement_rules" PRIMARY KEY REFERENCES spaces(id) ON DELETE RESTRICT,
kind varchar NOT NULL CHECK(kind='MONTHLY_DAY'), day_of_month smallint NOT NULL CHECK(day_of_month BETWEEN 1 AND 31),
version integer NOT NULL CHECK(version>0), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL)`);
        await queryRunner.query(`CREATE TABLE default_settlement_rule_changes (
space_id uuid NOT NULL REFERENCES default_settlement_rules(space_id) ON DELETE RESTRICT, version integer NOT NULL CHECK(version>0), actor_person_id uuid NOT NULL REFERENCES persons(id) ON DELETE RESTRICT,
previous_kind varchar, previous_day_of_month smallint,
kind varchar NOT NULL CHECK(kind='MONTHLY_DAY'), day_of_month smallint NOT NULL CHECK(day_of_month BETWEEN 1 AND 31), occurred_at timestamptz NOT NULL,
CONSTRAINT "PK_default_settlement_rule_changes" PRIMARY KEY(space_id,version),
CHECK ((previous_kind IS NULL AND previous_day_of_month IS NULL) OR (previous_kind IS NOT NULL AND previous_day_of_month IS NOT NULL AND previous_kind='MONTHLY_DAY' AND previous_day_of_month BETWEEN 1 AND 31)),
CHECK ((version=1 AND previous_kind IS NULL) OR (version>1 AND previous_kind IS NOT NULL)))`);
        await queryRunner.query(`CREATE TABLE finances_command_receipts (
actor_id uuid NOT NULL REFERENCES persons(id) ON DELETE RESTRICT, operation varchar NOT NULL CHECK(operation='CONFIGURE_DEFAULT_SETTLEMENT_RULE'), key uuid NOT NULL,
request_hash bytea NOT NULL CHECK(octet_length(request_hash)=32),status varchar NOT NULL CHECK(status='COMPLETED'),
result_space_id uuid NOT NULL,result_version integer NOT NULL CHECK(result_version>0),changed boolean NOT NULL,created_at timestamptz NOT NULL,
CONSTRAINT "PK_finances_command_receipts" PRIMARY KEY(actor_id,operation,key),
FOREIGN KEY(result_space_id,result_version) REFERENCES default_settlement_rule_changes(space_id,version) ON DELETE RESTRICT)`);
    }
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE finances_command_receipts');
        await queryRunner.query('DROP TABLE default_settlement_rule_changes');
        await queryRunner.query('DROP TABLE default_settlement_rules');
    }
}
