import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterAccountDto {
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