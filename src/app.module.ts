import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './shared/technical/database/database.module.js';
import { envSchema } from './config/env.schema.js';
import { SpacesModule } from './modules/spaces/spaces.module.js';
import { IdentityModule } from './modules/identity/identity.module.js';

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
    providers: [],
})
export class AppModule {}
