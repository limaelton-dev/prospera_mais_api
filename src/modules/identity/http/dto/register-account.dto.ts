import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterAccountDto {
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString()
    @MinLength(2)
    @MaxLength(80)
    displayName: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    @MaxLength(128)
    password: string;
}
