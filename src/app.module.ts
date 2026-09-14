import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './shared/technical/database/database.module.js';
import { envSchema } from './config/env.schema.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: envSchema,
    }),
    DatabaseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
