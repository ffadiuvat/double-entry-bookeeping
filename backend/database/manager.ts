import { constants } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { DatabaseDemuxBase, DatabaseMethod } from 'utils/db/types';
import { getSchemas } from '../../schemas';
import { databaseMethodSet } from '../helpers';
import patches from '../patches';
import { BespokeQueries } from './bespoke';
import DatabaseCore from './core';
import { runPatches } from './runPatch';
import { BespokeFunction, Patch } from './types';

export class DatabaseManager extends DatabaseDemuxBase {
  db?: DatabaseCore;

  get #isInitialized(): boolean {
    return this.db !== undefined && this.db.knex !== undefined;
  }

  getSchemaMap() {
    return this.db?.schemaMap ?? {};
  }

  async createNewDatabase(dbPath: string, countryCode: string) {
    await this.#unlinkIfExists(dbPath);
    return await this.connectToDatabase(dbPath, countryCode);
  }

  async connectToDatabase(dbPath: string, countryCode?: string) {
    countryCode = await this._connect(dbPath, countryCode);
    await this.#migrate();
    return countryCode;
  }

  async _connect(dbPath: string, countryCode?: string) {
    countryCode ??= await DatabaseCore.getCountryCode(dbPath);
    this.db = new DatabaseCore(dbPath);
    await this.db.connect();
    const schemaMap = getSchemas(countryCode);
    this.db.setSchemaMap(schemaMap);
    return countryCode;
  }

  async #migrate(): Promise<void> {
    if (!this.#isInitialized) {
      return;
    }

    const isFirstRun = await this.#getIsFirstRun();
    if (isFirstRun) {
      await this.db!.migrate();
    }

    /**
     * This needs to be supplimented with transactions
     * TODO: Add transactions in core.ts
     */
    const dbPath = this.db!.dbPath;
    const copyPath = await this.#makeTempCopy();

    try {
      await this.#runPatchesAndMigrate();
    } catch (err) {
      console.error(err);
      await this.db!.close();
      copyPath && (await fs.copyFile(copyPath, dbPath));
      throw err;
    } finally {
      copyPath && (await fs.unlink(copyPath));
    }
  }

  async #runPatchesAndMigrate() {
    const patchesToExecute = await this.#getPatchesToExecute();

    patchesToExecute.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    const preMigrationPatches = patchesToExecute.filter(
      (p) => p.patch.beforeMigrate
    );
    const postMigrationPatches = patchesToExecute.filter(
      (p) => !p.patch.beforeMigrate
    );

    await runPatches(preMigrationPatches, this);
    await this.db!.migrate();
    await runPatches(postMigrationPatches, this);
  }

  async #getPatchesToExecute(): Promise<Patch[]> {
    if (this.db === undefined) {
      return [];
    }

    const query: { name: string }[] = await this.db.knex!('PatchRun').select(
      'name'
    );
    const executedPatches = query.map((q) => q.name);
    return patches.filter((p) => !executedPatches.includes(p.name));
  }

  async call(method: DatabaseMethod, ...args: unknown[]) {
    if (!this.#isInitialized) {
      return;
    }

    if (!databaseMethodSet.has(method)) {
      return;
    }

    // @ts-ignore
    const response = await this.db[method](...args);
    if (method === 'close') {
      delete this.db;
    }

    return response;
  }

  async callBespoke(method: string, ...args: unknown[]): Promise<unknown> {
    if (!this.#isInitialized) {
      return;
    }

    if (!BespokeQueries.hasOwnProperty(method)) {
      return;
    }

    // @ts-ignore
    const queryFunction: BespokeFunction = BespokeQueries[method];
    return await queryFunction(this.db!, ...args);
  }

  async #unlinkIfExists(dbPath: string) {
    const exists = await fs
      .access(dbPath, constants.W_OK)
      .then(() => true)
      .catch(() => false);

    if (exists) {
      fs.unlink(dbPath);
    }
  }

  async #getIsFirstRun(): Promise<boolean> {
    if (!this.#isInitialized) {
      return true;
    }

    const tableList: unknown[] = await this.db!.knex!.raw(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );
    return tableList.length === 0;
  }

  async #makeTempCopy() {
    const src = this.db!.dbPath;
    if (src === ':memory:') {
      return null;
    }

    const dir = path.parse(src).dir;
    const dest = path.join(dir, '__premigratory_temp.db');
    await fs.copyFile(src, dest);
    return dest;
  }
}

export default new DatabaseManager();
