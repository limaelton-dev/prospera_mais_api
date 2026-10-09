import { Transform } from 'class-transformer';
import { IsUUID } from 'class-validator';

export class SpaceParamsDto {
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.toLowerCase() : value,
    )
    @IsUUID('all')
    spaceId!: string;
}

export class ReplaceInvitationParamsDto extends SpaceParamsDto {
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.toLowerCase() : value,
    )
    @IsUUID('all')
    invitationId!: string;
}
