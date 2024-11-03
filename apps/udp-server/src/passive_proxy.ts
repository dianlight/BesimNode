import { udp } from "bun";
import { DataHook, ErrorHook } from "./app.js";
import { BeSmartFrame } from "./parsers/besmart-frame.js";


export class UDPPassiveProxy {
    private upstream!: udp.ConnectedSocket<'uint8array'>;
    private downstream!: udp.ConnectedSocket<'uint8array'>;

    public static async setup(upstreamAddress: string, upstreamPort: number): Promise<UDPPassiveProxy> {
        const instance = new UDPPassiveProxy();
        instance.upstream = await Bun.udpSocket<'uint8array'>({
            connect: {
                port: upstreamPort,
                hostname: upstreamAddress,
            },
            socket: {
                drain(socket) {
                    logger.debug("upstream client drain");
                },
            }
        });

        return instance;
    }

    public dataHook: DataHook = async (socket: udp.ConnectedSocket<'uint8array'>, data: BeSmartFrame) => {
        try {
            if (socket.address.address === this.upstream.address.address) {
                this.downstream.send(data.serialize());
            } else if (this.downstream && socket.address.address === this.downstream.address.address) {
                this.upstream.send(data.serialize());
            } else {
                console.info(`Initialize Downstream Server ${socket.address.address}:${socket.port}`);
                this.downstream = await Bun.udpSocket<'uint8array'>({
                    connect: {
                        port: socket.port,
                        hostname: socket.address.address,
                    },
                    socket: {
                        drain(socket) {
                            logger.debug("downstream client drain");
                        },
                    }
                });
                this.upstream.send(data.serialize());
            }
        } catch (e) {
            logger.error(e);
        }
    };

    public errorHook: ErrorHook = async (socket: udp.ConnectedSocket<'uint8array'>, error: Error, data: Uint8Array) => {
        try {
            if (socket.address.address === this.upstream.address.address) {
                this.downstream.send(data);
            } else if (this.downstream && socket.address.address === this.downstream.address.address) {
                this.upstream.send(data);
            } else {
                logger.info(`Initialize Downstream Server ${socket.address.address}:${socket.port}`);
                this.downstream = await Bun.udpSocket<'uint8array'>({
                    connect: {
                        port: socket.port,
                        hostname: socket.address.address,
                    },
                    socket: {
                        drain(socket) {
                            logger.debug("downstream client drain");
                        },
                    }
                });
                this.upstream.send(data);
            }
        } catch (e) {
            logger.error(e);
        }
    };
}