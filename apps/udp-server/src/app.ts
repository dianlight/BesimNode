import { udp } from 'bun';
import { parseBinary } from './parsers/besim-udp.js';
import { BeSmartFrame, DeviceTimeMessage, GetProgramMessage, StatusMessage, Unknown10Message, Unknown11Message } from './parsers/besmart-frame.js';
import { crc16xmodem } from 'node-crc';
import onChange, { ApplyData } from 'on-change';
import { is } from "typia";
import { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { devices } from 'common';
import { eq } from "drizzle-orm";
import { rooms } from 'common';


export type DataHook = (socket: udp.ConnectedSocket<'uint8array'>, data: BeSmartFrame) => void;
export type ErrorHook = (socket: udp.ConnectedSocket<'uint8array'>, err: Error, data: Uint8Array) => void;

export class UDPServer implements udp.SocketHandler<'uint8array'> {
  #parsedData: BeSmartFrame[] = onChange(new Array<BeSmartFrame>(), (path, value, previousValue, applyData) => this.onChange(path, value as BeSmartFrame, previousValue as BeSmartFrame, applyData));
  private hook?: DataHook | undefined;
  private errorHook?: ErrorHook | undefined;
  private db?: BunSQLiteDatabase | undefined;

  public static async setup(port?: number, hook?: DataHook, errorHook?: ErrorHook, db?: BunSQLiteDatabase): Promise<UDPServer> {
    const instance = new UDPServer();
    instance.hook = hook;
    instance.errorHook = errorHook;
    instance.db = db;
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
    //logger.debug(`message from ${socket.address.address}:${socket.port}`, data)
    try {
      const result = parseBinary(data);

      if (!result.magic_header) {
        throw new Error(`Wrong Magic Header for payload ${result}`)
      }
      if (!result.magic_footer) {
        throw new Error(`Wrong Magic Footer for payload ${result}`)
      }

      const payload_buf = Buffer.from(data.subarray(8, 8 + result.payload_length));
      const crc16 = crc16xmodem(payload_buf).readUInt16BE();
      if (crc16 != result.crc16) {
        throw new Error(`Wrong crc16 for payload ${crc16}!=${result.crc16} \n${result}`)
      } else {
        this.#parsedData.push(result);
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

  get parsedData() {
    return this.#parsedData;
  }


  private onChange(
    path: string,
    value: BeSmartFrame,
    previousValue: BeSmartFrame,
    applyData: ApplyData
  ): void {
    //	console.log('Object changed:', ++index);
    if (!this.db) return;

    const device = this.db.insert(devices).values(value).onConflictDoUpdate({ target: devices.device_id, set: value }).returning();

    if (applyData.name === 'push') {
      if (is<StatusMessage>(value)) {
        logger.debug('StatusMessage', value);
        for (const room of value.rooms) {
          const room_w = this.db.insert(rooms).values(room).onConflictDoUpdate({ target: rooms.room_id, set: { device_id: value.device_id, ...room } }).returning();
        }
      } else if (is<DeviceTimeMessage>(value)) {
        logger.debug('DeviceTimeMessage', value);
      } else if (is<Unknown10Message>(value)) {
        logger.debug('Unknown10Message', value);
      } else if (is<Unknown11Message>(value)) {
        logger.debug('Unknown11Message', value);
      }
    }

    if (applyData.name !== 'push' && applyData.name !== 'pop') {
      logger.debug('this:', this);
      logger.debug('path:', path);
      logger.debug('value:', value);
      logger.debug('previousValue:', previousValue);
      logger.debug('applyData:', applyData);
    }
  }
}