import { DataSource } from 'typeorm';

export const connectionSource = new DataSource({
  migrationsTableName: 'migrations',
  type: 'postgres',
  host: 'localhost',
  port: 5433,
  username: 'postgres',
  password: 'postgres',
  database: 'accounting',
  logging: false,
  synchronize: false,
  entities: [],
  migrations: ['lib/database/migrations/**/*.ts'],
  subscribers: [],
});
