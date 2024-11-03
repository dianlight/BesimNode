import "reflect-metadata";
import { DataHook, ErrorHook, UDPServer } from './app.js';
import { Command, Option } from 'commander';
import path from 'path';
import { fileURLToPath } from 'url';
import { pino } from 'pino'
import { initORM } from 'common';
import project from '../package.json';
import { Resolver } from 'node:dns';
import { UDPPassiveProxy } from "./passive_proxy.js";
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

program.version(project.version, '-v, --vers', 'output the current version');

program
  .option('-d, --debug', 'output extra debugging', false)
  .option('-f, --db <db>', 'db to use', process.cwd() + '/sqldata.db')
  .option('-p, --port <port>', 'port to listen on', parseInt, 6199)
  .addOption(new Option('-m, --proxy-mode <proxy mode>', 'proxy functionality mode\n' +
    'passive: act as trasparent proxy on upstream server and only record messages\n' +
    'none: act as the could server and ignore upstream server ** Not yer implemented **\n' +
    'active: act as the cloud server and register a new device on cloud to allow the user of mobile app ** Not yer implemented **\n'
  ).choices(['none', 'passive', 'active']).default('passive'))
  .option('--upstream <upstream>', 'upstream server to use for resolve upstream server', 'api.besmart-home.com')
  .option('--dns <dns>', 'upstream DNS to use for resolve upstream server', '8.8.8.8');

program.parse(process.argv);

global.console.log = (...args) => logger.info(args);
global.console.error = (...args) => logger.error(args);

//logger.error("Test");
const options = program.opts();
//console.log(options);
if (['none', 'active'].indexOf(options.proxyMode) !== -1) {
  logger.error('proxy mode: none and active not yet implemented!');
  process.exit(1);
}

if (options.debug) logger.debug(options);

const db = await initORM(options.db);

// None: none, Passive: passive, Active: active
// Passive: act as trasparent proxy on upstream server and only record messages. Unknown messages are logged and resended.
// None: act as the could server and ignore upstream server ** Not yer implemented **
// Active: act as the cloud server and register a new device on cloud to allow the user of mobile app ** Not yer implemented **

let hook: DataHook | undefined;
let errorHook: ErrorHook | undefined;

if (['passive', 'active'].indexOf(options.proxyMode) !== -1) {
  logger.info('proxy details:');
  logger.info(`- proxy mode: ${options.proxyMode}`);
  logger.info(`- upstream server: ${options.upstream}`);
  logger.info(`- DNS server: ${options.dns}`);

  const resolver = new Resolver();
  resolver.setServers([options.dns]);
  resolver.resolve4(options.upstream, (err, address) => {
    if (err) {
      logger.error(err);
      process.exit(1);
    }
    logger.info(`Upstream server address: ${address}`);
  });
  hook = (await UDPPassiveProxy.setup(options.upstream, options.port)).dataHook;
  errorHook = (await UDPPassiveProxy.setup(options.upstream, options.port)).errorHook;
}


try {
  const server = UDPServer.setup(options.port, hook, errorHook, db);
} catch (e) {
  logger.error(e);
}
