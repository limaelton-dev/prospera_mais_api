import { MigrationInterface, QueryRunner } from 'typeorm';

export class Card003InvitationResponses1791585518092 implements MigrationInterface {
    name = 'Card003InvitationResponses1791585518092';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "space_command_receipts" DROP CONSTRAINT "CHK_space_command_receipts_operation"`,
        );
        await queryRunner.query(
            `ALTER TABLE "space_command_receipts" ADD CONSTRAINT "CHK_space_command_receipts_operation" CHECK ("operation" IN ('CREATE_SPACE', 'ISSUE_INVITATION', 'REPLACE_INVITATION', 'RESPOND_INVITATION'))`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "space_command_receipts" DROP CONSTRAINT "CHK_space_command_receipts_operation"`,
        );
        await queryRunner.query(
            `ALTER TABLE "space_command_receipts" ADD CONSTRAINT "CHK_space_command_receipts_operation" CHECK ("operation" IN ('CREATE_SPACE', 'ISSUE_INVITATION', 'REPLACE_INVITATION'))`,
        );
    }
}
