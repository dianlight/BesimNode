import { fastify } from 'fastify';
import fastifyJWT from '@fastify/jwt';
import fastifySwagger from '@fastify/swagger';
import { bootstrap } from 'fastify-decorators';
import fastifySwaggerUI from '@fastify/swagger-ui';
import { NotFoundError, RequestContext } from '@mikro-orm/sqlite';
import { initORM } from './db.js';
import { registerUserRoutes } from './modules/user/routes.js';
import { registerArticleRoutes } from './modules/article/routes.js';
import { AuthError } from './modules/common/utils.js';

export async function app_bootstrap(port = 3001, migrate = true) {

  logger.info("Starting webserver");

  const db = await initORM({
    debug: true
   // logger: msg => logger.log(msg),
  });


  if (migrate) {
    // sync the schema
    await db.orm.migrator.up();
  }

  const app = fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
      // options: {
      //    translateTime: 'HH:MM:ss Z',
      //    ignore: 'pid,hostname',
      //  },
      },
    }
  });

  // register JWT plugin
  app.register(fastifyJWT, {
    secret: process.env.JWT_SECRET ?? '12345678', // fallback for testing
  });


  // register request context hook
  app.addHook('onRequest', (request, reply, done) => {
    RequestContext.create(db.em, done);
  });

  // register auth hook after the ORM one to use the context
  app.addHook('onRequest', async request => {
    try {
      const ret = await request.jwtVerify<{ id: number }>();
      request.user = await db.user.findOneOrFail(ret.id);
    } catch (e) {
      app.log.error(e);
      // ignore token errors, we validate the request.user exists only where needed
    }
  });

  // register global error handler to process 404 errors from `findOneOrFail` calls
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AuthError) {
      return reply.status(401).send({ error: error.message });
    }

    if (error instanceof NotFoundError) {
      return reply.status(404).send({ error: error.message });
    }

    app.log.error(error);
    reply.status(500).send({ error: error.message });
  });

  // shut down the connection when closing the app
  app.addHook('onClose', async () => {
    await db.orm.close();
  });


  // Swagger
  await app.register(fastifySwagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Test swagger',
        description: 'Testing the Fastify swagger API',
        version: '0.1.0'
      },
//      servers: [
//        {
//          url: 'http://localhost:3000',
//          description: 'Development server'
//        }
//      ],
      // tags: [
      //   { name: 'user', description: 'User related end-points' },
      //   { name: 'code', description: 'Code related end-points' }
      // ],
      // components: {
      //   securitySchemes: {
      //     apiKey: {
      //       type: 'apiKey',
      //       name: 'apiKey',
      //       in: 'header'
      //     }
      //   }
      // },
      // externalDocs: {
      //   url: 'https://swagger.io',
      //   description: 'Find more info here'
      // }
    }
  });

  await app.register(fastifySwaggerUI, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false
    },
    uiHooks: {
      onRequest: function (request, reply, next) { next() },
      preHandler: function (request, reply, next) { next() }
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, request, reply) => { return swaggerObject },
    transformSpecificationClone: true
  })

  app.register(registerUserRoutes, { prefix: 'user' });
  app.register(registerArticleRoutes, { prefix: 'article' });

  // Register handlers auto-bootstrap
  app.register(bootstrap, {
    // Specify directory with our controllers
    directory: new URL(`controllers`, import.meta.url),

    // Specify mask to match only our controllers
    mask: /\.controller\./,
  });  
  
  await app.ready()
  app.swagger()

  const url = await app.listen({ port });

  return { app, url };
}
