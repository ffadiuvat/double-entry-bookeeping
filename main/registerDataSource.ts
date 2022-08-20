import { BackendService } from '../app/backend';
import { DBConnection } from '../lib/database/connection';

const registerDataSource = async () => {
  const backendService = BackendService.getInstance();
  const dbConnection = new DBConnection({
    type: 'postgres',
    host: 'localhost',
    port: 5433,
    username: 'postgres',
    password: 'postgres',
    database: 'accounting',
  })
  await dbConnection.initialize();
  backendService.dataSource = dbConnection.getDataSource();
}
export default registerDataSource;