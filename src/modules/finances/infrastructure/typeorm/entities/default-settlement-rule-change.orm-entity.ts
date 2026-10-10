import { Entity, Column, PrimaryColumn } from 'typeorm';
@Entity('default_settlement_rule_changes')
export class DefaultSettlementRuleChangeOrmEntity {
    @PrimaryColumn('uuid', { name: 'space_id' }) spaceId!: string;
    @PrimaryColumn('integer') version!: number;
    @Column('uuid', { name: 'actor_person_id' }) actorPersonId!: string;
    @Column('varchar', { name: 'previous_kind', nullable: true })
    previousKind!: string | null;
    @Column('smallint', { name: 'previous_day_of_month', nullable: true })
    previousDayOfMonth!: number | null;
    @Column('varchar') kind!: string;
    @Column('smallint', { name: 'day_of_month' }) dayOfMonth!: number;
    @Column('timestamptz', { name: 'occurred_at' }) occurredAt!: Date;
}
