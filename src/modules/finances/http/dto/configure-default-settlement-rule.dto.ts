import { Type } from 'class-transformer';
import {
    Equals,
    IsDefined,
    IsInt,
    IsObject,
    IsUUID,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';
export class SettlementRuleDto {
    @Equals('MONTHLY_DAY', { message: 'Informe o tipo MONTHLY_DAY.' })
    kind!: 'MONTHLY_DAY';
    @IsInt({ message: 'O dia do acerto deve ser um número inteiro.' })
    @Min(1, { message: 'O dia do acerto deve ser entre 1 e 31.' })
    @Max(31, { message: 'O dia do acerto deve ser entre 1 e 31.' })
    dayOfMonth!: number;
}
export class ConfigureDefaultSettlementRuleDto {
    @IsInt({ message: 'Informe uma versão inteira válida.' })
    @Min(0, { message: 'A versão deve ser maior ou igual a zero.' })
    @Max(Number.MAX_SAFE_INTEGER, {
        message: 'Informe uma versão inteira segura.',
    })
    expectedVersion!: number;
    @IsDefined({ message: 'Informe a regra de acerto.' })
    @IsObject({ message: 'Informe uma regra de acerto válida.' })
    @ValidateNested({ message: 'Informe uma regra de acerto válida.' })
    @Type(() => SettlementRuleDto)
    rule!: SettlementRuleDto;
}
export class SettlementRuleParamsDto {
    @IsUUID('all', { message: 'Informe um espaço válido.' }) spaceId!: string;
}
