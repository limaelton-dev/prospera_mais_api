import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './shared/technical/database/database.module.js';
import { envSchema } from './config/env.schema.js';
import { SpacesModule } from './modules/spaces/spaces.module.js';
import { IdentityModule } from './modules/identity/identity.module.js';
import { APP_FILTER } from '@nestjs/core';
import { ApiExceptionFilter } from './shared/technical/http/api-exception.filter.js';
import { mapIdentityError } from './modules/identity/http/filters/identity-error.mapper.js';
import { mapSpacesError } from './modules/spaces/http/filters/spaces-error.mapper.js';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            cache: true,
            validationSchema: envSchema,
        }),
        DatabaseModule,
        SpacesModule,
        IdentityModule,
    ],
    controllers: [],
    providers: [
        {
            provide: APP_FILTER,
            useFactory: () =>
                new ApiExceptionFilter([mapIdentityError, mapSpacesError]),
        },
    ],
})
export class AppModule {}
