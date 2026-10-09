import { Transform } from 'class-transformer';
import { IsString, ValidateBy } from 'class-validator';

export class CreateSharedSpaceDto {
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString()
    @ValidateBy({
        name: 'isSpaceName',
        validator: {
            validate(value: unknown): boolean {
                if (
                    typeof value !== 'string' ||
                    value.length < 1 ||
                    value.length > 80
                ) {
                    return false;
                }

                return Array.from(value).every((character) => {
                    const code = character.charCodeAt(0);

                    return code > 31 && (code < 127 || code > 159);
                });
            },
            defaultMessage: () =>
                'O nome deve ter de 1 a 80 unidades UTF-16 e não pode conter caracteres de controle.',
        },
    })
    name!: string;
}
