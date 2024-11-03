import { sleep, udp } from 'bun';
import { parseBinary } from './parsers/besim-udp.js';
import { BeSmartFrame } from './parsers/besmart-frame.js';
import { crc16xmodem } from 'node-crc';


export type DataHook = (socket: udp.ConnectedSocket<'uint8array'>, data: BeSmartFrame) => void;
export type ErrorHook = (socket: udp.ConnectedSocket<'uint8array'>, err: Error, data: Uint8Array) => void;

export class UDPServer implements udp.SocketHandler<'uint8array'> {
  public parsedData: BeSmartFrame[] = new Array<BeSmartFrame>();
  private hook?: DataHook | undefined;
  private errorHook?: ErrorHook | undefined;

  public static async setup(port?: number, hook?: DataHook, errorHook?: ErrorHook): Promise<UDPServer> {
    const instance = new UDPServer();
    instance.hook = hook;
    instance.errorHook = errorHook;
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
      instance.serverSocket = socket;
    });
    return instance;
  }

  private serverSocket!: udp.Socket<'uint8array'>;

  data(socket: udp.ConnectedSocket<'uint8array'>, data: Uint8Array, port: number, address: string): void | Promise<void> {
    logger.debug(`message from ${socket.address.address}:${socket.port}`, data)
    try {
      const result = parseBinary(data);
      const payload_buf = Buffer.from(result.serialize().subarray(8, 8 + result.payload_length));
      const crc16 = crc16xmodem(payload_buf).readUInt16BE();
      if (crc16 != result.crc16) {
        console.error(`Wrong crc16 for payload`, result)
        throw new Error(`Wrong crc16 for payload ${result}`)
      } else {
        this.parsedData.push(result);
        if (this.hook) this.hook(socket, result);
      }
    } catch (e: Error | any) {
      if (this.errorHook) this.errorHook(socket, e, data);
      logger.error(e);
    }
  }

  error(socket: udp.Socket<'uint8array'>, error: Error): void | Promise<void> {
    logger.error(error);
  }

  drain(socket: udp.Socket<'uint8array'>): void | Promise<void> {
    logger.debug("server drain");
  }

  close() {
    return this.serverSocket.close();
  }
  get closed() {
    return this.serverSocket.closed;
  }

  get port() {
    return this.serverSocket.port;
  };

  get address() {
    return this.serverSocket.address;
  };


}