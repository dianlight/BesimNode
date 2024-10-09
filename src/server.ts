import { app_bootstrap }  from './app.js';
import { Command } from 'commander';
import path from 'path';
import { fileURLToPath } from 'url';
import { pino } from 'pino'
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
  .option('-d, --debug', 'output extra debugging')
  .option('-s, --small', 'small pizza size')
  .option('-p, --pizza-type <type>', 'flavour of pizza');

program.parse(process.argv);

global.console.log = (...args) => logger.info(args);
global.console.error = (...args) => logger.error(args);

logger.error("Test");

const options = program.opts();
if (options.debug) logger.debug(options);
logger.info('pizza details:');
if (options.small) logger.info('- small pizza size');
if (options.pizzaType) logger.info(`- ${options.pizzaType}`);

try {
  const { url } = await app_bootstrap();
  logger.info(`server started at ${url}`);
} catch (e) {
  console.error(e);
}
