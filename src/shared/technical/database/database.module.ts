import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionContext } from './typeorm/transaction-context.js';
import { EntityManagerProvider } from './typeorm/entity-manager.provider.js';
import { TypeOrmUnitOfWork } from './typeorm/typeorm-unit-of-work.js';
import { UNIT_OF_WORK } from '../../application/unit-of-work.js';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        url: configService.getOrThrow<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: false,
        logging:
          configService.get<string>('NODE_ENV') === 'development'
            ? ['error', 'warn']
            : ['error'],
      }),
    }),
  ],

  providers: [
    TransactionContext,
    EntityManagerProvider,
    TypeOrmUnitOfWork,

    {
      provide: UNIT_OF_WORK,
      useExisting: TypeOrmUnitOfWork
    }
  ],

  exports: [
    UNIT_OF_WORK,
    EntityManagerProvider,
  ]
})
export class DatabaseModule {}
