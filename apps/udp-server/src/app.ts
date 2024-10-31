import dgram from 'node:dgram';

export async function app_bootstrap(port = 3001, migrate = true): Promise<dgram.Socket> {
  return new Promise<dgram.Socket>((resolve) => {
    const controller = new AbortController();
    const { signal } = controller;

    const server = dgram.createSocket({ type: 'udp4', signal });

    server.on('listening', () => {
      const address = server.address();
      logger.info(`server listening ${address.address}:${address.port}`);
    });


    resolve(server);

    return server;
  }).then((server) => {
    server.bind(port);
    return server;
  })
}
