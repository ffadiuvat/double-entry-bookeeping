import { DataSource } from 'typeorm';

export const connectionSource = new DataSource({
  migrationsTableName: 'migrations',
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'accounting',
  logging: false,
  synchronize: false,
  entities: [],
  migrations: ['libs/database/migrations/**/*.ts'],
  subscribers: [],
});
