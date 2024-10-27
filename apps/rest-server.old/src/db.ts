import { AppDataSource, DataSource } from 'common';

let cache: DataSource;

export async function initORM(/*options?: Options*/): Promise<DataSource> {
  if (cache) {
    return cache;
  }

  cache = await AppDataSource.initialize();
  return cache;
}
