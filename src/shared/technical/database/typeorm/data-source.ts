import 'dotenv/config';

import { join } from 'node:path';
import { DataSource } from 'typeorm';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

export default new DataSource({
  type: 'postgres',
  url: databaseUrl,
  synchronize: false,
  migrationsRun: false,
  entities: [join(import.meta.dirname, '../../../../modules/**/*.orm-entity{.ts,.js}')],

  migrations: [join(import.meta.dirname, 'migrations/*{.ts,.js}')],
});
