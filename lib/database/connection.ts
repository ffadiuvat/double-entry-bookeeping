import { DataSource, DataSourceOptions } from 'typeorm';
export class DBConnection {
  private dataSource: DataSource;
  constructor(opts: DataSourceOptions){
    this.dataSource = new DataSource(opts);
  }

  async initialize(){
    await this.dataSource.initialize();
  }

  public getDataSource(): DataSource{
    return this.dataSource;
  }
}