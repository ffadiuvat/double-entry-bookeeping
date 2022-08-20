import { DataSource } from "typeorm";

export class BackendService {
  private static instance: BackendService
  public dataSource: DataSource | undefined;
  constructor(){}

  public static getInstance(){
    if(!BackendService.instance) {
      BackendService.instance = new BackendService();
    }
    return BackendService.instance;
  }
}