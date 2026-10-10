import { Entity, Column, PrimaryColumn } from 'typeorm';
@Entity('default_settlement_rules')
export class DefaultSettlementRuleOrmEntity {
    @PrimaryColumn('uuid', { name: 'space_id' }) spaceId!: string;
    @Column('varchar') kind!: string;
    @Column('smallint', { name: 'day_of_month' }) dayOfMonth!: number;
    @Column('integer') version!: number;
    @Column('timestamptz', { name: 'created_at' }) createdAt!: Date;
    @Column('timestamptz', { name: 'updated_at' }) updatedAt!: Date;
}
