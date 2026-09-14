import { Check, Column, Entity, Index, PrimaryColumn } from "typeorm";

@Entity({ name: 'spaces' })
@Check(
    'CHK_spaces_type',
    `"type" IN ('PERSONAL', 'SHARED')`,
)
@Check(
    'CHK_spaces_status',
    `"status" IN ('ACTIVE', 'CLOSING', 'CLOSED')`,
  )
@Check(
    'CHK_spaces_personal_rules',
    `"type" <> 'PERSONAL' OR ("personal_owner_person_id" IS NOT NULL AND "status" = 'ACTIVE')`,
)
@Index(
    'UQ_spaces_personal_owner',
    ['personalOwnerPersonId'],
    {
      unique: true,
      where: `"type" = 'PERSONAL'`,
    },
)
export class SpaceOrmEntity {
    @PrimaryColumn({type: 'uuid'})
    id!: string

    @Column({ type: 'varchar', length: 30 })
    type!: string;

    @Column({ type: 'varchar', length: 30})
    status!: string;

    @Column({
        name: 'personal_owner_person_id',
        type: 'uuid',
        nullable: true,
      })
    personalOwnerPersonId!: string | null;
    
    @Column({ type: 'integer', default: 1})
    version!: number;
    
    @Column({ name: 'created_at', type: 'timestamptz'})
    createdAt: Date;

    @Column({ name: 'updated_at', type: 'timestamptz' })
    updatedAt!: Date;
}