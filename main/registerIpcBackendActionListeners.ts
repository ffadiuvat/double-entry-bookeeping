import { ipcMain } from 'electron';
import { BackendService } from '../app/backend';

export default function registerIpcBackendAction(){
  const backendService = BackendService.getInstance();

  ipcMain.handle('check-postgres', () => {
    console.log(backendService.dataSource);
  })
}