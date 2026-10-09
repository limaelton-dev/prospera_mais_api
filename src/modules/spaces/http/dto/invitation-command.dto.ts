import { IsInt, Max, Min } from 'class-validator';

export class InvitationCommandDto {
    @IsInt()
    @Min(1)
    @Max(Number.MAX_SAFE_INTEGER)
    expectedVersion!: number;
}
