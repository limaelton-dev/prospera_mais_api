import { Entity, Column, PrimaryColumn } from 'typeorm';
@Entity('finances_command_receipts')
export class FinancesCommandReceiptOrmEntity {
    @PrimaryColumn('uuid', { name: 'actor_id' }) actorId!: string;
    @PrimaryColumn('varchar') operation!: string;
    @PrimaryColumn('uuid') key!: string;
    @Column('bytea', { name: 'request_hash' }) requestHash!: Buffer;
    @Column('varchar') status!: string;
    @Column('uuid', { name: 'result_space_id' }) resultSpaceId!: string;
    @Column('integer', { name: 'result_version' }) resultVersion!: number;
    @Column('boolean') changed!: boolean;
    @Column('timestamptz', { name: 'created_at' }) createdAt!: Date;
}
