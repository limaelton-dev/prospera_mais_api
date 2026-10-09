import { IsIn, IsInt, Max, Min } from 'class-validator';
import { PreviewInvitationDto } from './preview-invitation.dto.js';

export class RespondToInvitationDto extends PreviewInvitationDto {
    @IsIn(['ACCEPT', 'REJECT'])
    decision!: 'ACCEPT' | 'REJECT';

    @IsInt()
    @Min(1)
    @Max(Number.MAX_SAFE_INTEGER)
    expectedVersion!: number;
}
