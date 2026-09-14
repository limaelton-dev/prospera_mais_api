import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './shared/technical/database/database.module.js';
import { envSchema } from './config/env.schema.js';
import { SpaceModule } from './modules/spaces/space.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: envSchema,
    }),
    DatabaseModule,
    SpaceModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
