import { UDPServer } from './app.js';
import { Command } from 'commander';
import path from 'path';
import { fileURLToPath } from 'url';
import { pino } from 'pino'
import { initORM } from 'common';
//import PinoPretty from 'pino-pretty';


const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory
global.logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    }
  }
})

const program = new Command();

program
  .option('-d, --debug', 'output extra debugging', false)
  .option('-f --db <db>', 'db to use', process.cwd() + '/sqldata.db')
  .option('-p, --port <port>', 'port to listen on', parseInt, 3001);

program.parse(process.argv);

global.console.log = (...args) => logger.info(args);
global.console.error = (...args) => logger.error(args);

//logger.error("Test");

const options = program.opts();
if (options.debug) logger.debug(options);

initORM(options.db);

try {
  const server = UDPServer.setup(options.port);
} catch (e) {
  logger.error(e);
}
