import { app_bootstrap } from '../src/app.js';
import { initORM } from '../src/db.js';
import { TestSeeder } from '../src/seeders/TestSeeder.js';
import { pino } from 'pino'


global.logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,

    }
  }
})

export async function initTestApp(port: number) {
  // this will create all the ORM services and cache them
  const { orm } = await initORM({
    // no need for debug information, it would only pollute the logs
    debug: false,
    // we will use in-memory database, this way we can easily parallelize our tests
    dbName: ':memory:',
  });

  // create the schema so we can use the database
  await orm.schema.createSchema();
  await orm.seeder.seed(TestSeeder);

  const { app } = await app_bootstrap(port, false);

  return app;
}
