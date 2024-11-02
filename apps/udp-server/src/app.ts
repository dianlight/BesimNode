import { sleep, udp } from 'bun';
import { parseBinary } from './parsers/besim-udp.js';
import { BeSmartFrame } from './parsers/besmart-frame.js';
import { crc16xmodem } from 'node-crc';

export class UDPServer implements udp.SocketHandler<'uint8array'> {
  public parsedData: BeSmartFrame[] = new Array<BeSmartFrame>();

  public static async setup(port?: number) {
    const instance = new UDPServer();
    await Bun.udpSocket({
      binaryType: 'uint8array',
      port: port ?? NaN,
      socket: {
        data: instance.data.bind(instance),
        error: instance.error.bind(instance),
        drain: instance.drain.bind(instance),
      }
    }).then((socket) => {
      logger.info(`Server listening ${socket.address.address}:${socket.port}`);
      instance.socket = socket;
    });
    return instance;
  }

  private socket!: udp.Socket<'uint8array'>;

  data(socket: udp.ConnectedSocket<'uint8array'>, data: Uint8Array, port: number, address: string): void | Promise<void> {
    logger.debug(`message from ${socket.address.address}:${socket.port}`, data)
    try {
      const result = parseBinary(data);
      const payload_buf = Buffer.from(result.serialize().subarray(8, 8 + result.payload_length));
      const crc16 = crc16xmodem(payload_buf).readUInt16BE();
      if (crc16 != result.crc16) console.warn(`Wrong crc16 for payload`, result)
      else this.parsedData.push(result);
    } catch (e) {
      logger.error(e);
    }
  }

  error(socket: udp.Socket<'uint8array'>, error: Error): void | Promise<void> {
    logger.error(error);
  }

  drain(socket: udp.Socket<'uint8array'>): void | Promise<void> {
    logger.error("drain");
  }

  close() {
    return this.socket.close();
  }
  get closed() {
    return this.socket.closed;
  }

  get port() {
    return this.socket.port;
  };

  get address() {
    return this.socket.address;
  };


}