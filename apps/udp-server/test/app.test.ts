import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { UDPServer } from '../src/app.ts';
import { serve, sleep, udp } from "bun";


let client: udp.ConnectedSocket<'uint8array'>;
let server: UDPServer;

global.logger = console;

beforeAll(async () => {
    server = await UDPServer.setup();
    client = await Bun.udpSocket<'uint8array'>({
        connect: {
            port: server.port,
            hostname: server.address.address,
        },
        socket: {
            drain(socket) {
                console.error("client drain");
            },
        }
    });
});


afterAll(async () => {
    server.close();
    client.close();
})

describe("UDP Server Test", () => {
    test("Client Bindig", () => {

        // expect(server.address.address).toBe(client.remoteAddress.address);
        expect(server.address.port).toBe(client.remoteAddress.port);
        expect(server.closed).toBe(false);
        expect(client.closed).toBe(false);
    });
    test("PING", async () => {
        expect(client.send(Buffer.from('FAD40E000000000022060200FF020100AAF28D230100DA1A2DDF', 'hex'))).toBe(true);
        await sleep(200);
        expect(server.parsedData.length).toBe(1);
        expect(server.parsedData[0]).toBeDefined();
        expect(server.parsedData[0].magic_header, "Wrong Magic_Header").toBe(true);
        expect(server.parsedData[0].magic_footer, "Wrong Magic_Footer").toBe(true);
        expect(server.parsedData[0].constructor.name, `Unknwon Varian 0x${server.parsedData[0].msg_id.toString(16)}`).not.toBe('BeSmartFrame');
    });
});