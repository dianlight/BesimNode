import "reflect-metadata";
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { UDPServer } from '../src/app.ts';
import { serve, sleep, udp } from "bun";
import { BeSmartFrame, DeviceTimeMessage, GetProgramMessage, PingMessage, ProgramEndMessage, ProgramMessage, StatusMessage_r, StatusMessage_w, Unknown11Message, VersionMessage } from "../src/parsers/besmart-frame.ts";


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

beforeEach(async () => {
    server.parsedData = [];
})


afterAll(async () => {
    server.close();
    client.close();
})

describe("UDP Server Test", () => {
    test("Client Bindig", () => {
        expect(server.address.port).toBe(client.remoteAddress.port);
        expect(server.closed).toBe(false);
        expect(client.closed).toBe(false);
    });
    for (let [index, message] of [
        'FAD40E000000000022060200FF020100AAF28D230100DA1A2DDF',
        'FAD40E000000000022060200FF020100AAF28D230100DA1A2DDF',
        'FAD40E000000000022060200FF020400AAF28D23010064522DDF',
        'FAD40E000000000022060200FF020600AAF28D230100C2DD2DDF',
    ].entries()) {
        test(`PING case ${index + 1}`, async () => {
            expect(client.send(Buffer.from(message, 'hex'))).toBe(true);
            await sleep(1);
            expect(server.parsedData.length).toBe(1);
            expect(server.parsedData[0]).toBeDefined();
            expect(server.parsedData[0].magic_header, "Wrong Magic_Header").toBe(true);
            expect(server.parsedData[0].magic_footer, "Wrong Magic_Footer").toBe(true);
            expect(server.parsedData[0].constructor.name, `Unknwon Varian 0x${server.parsedData[0].msg_id.toString(16)}`).toBe(PingMessage.name);
        });
    }
    for (let [index, message] of [
        'FAD40C00FFFFFFFF150C000007000000AAF28D230A7B2DDF',
        'FAD419000300000015460D00FF040100AAF28D2330363534393138303131313032EC2F2DDF',
        'FAD419000400000015460D00FF020000AAF28D2330363534393138303131313032594C2DDF',
        'FAD419000500000015460D00FF020000AAF28D2330363534393138303131313032594C2DDF',
    ].entries()) {
        test(`VERSION case ${index + 1}`, async () => {
            expect(client.send(Buffer.from(message, 'hex'))).toBe(true);
            await sleep(1);
            expect(server.parsedData.length).toBe(1);
            expect(server.parsedData[0]).toBeDefined();
            expect(server.parsedData[0].magic_header, "Wrong Magic_Header").toBe(true);
            expect(server.parsedData[0].magic_footer, "Wrong Magic_Footer").toBe(true);
            expect(server.parsedData[0].constructor.name, `Unknwon Varian 0x${server.parsedData[0].msg_id.toString(16)}`).toBe(VersionMessage.name);
        });
    }
    test("PROGRAM_END", async () => {
        expect(client.send(Buffer.from('FAD41200A00100002A460600FF020100AAF28D23A6274304140A94D92DDF', 'hex'))).toBe(true);
        await sleep(1);
        expect(server.parsedData.length).toBe(1);
        expect(server.parsedData[0]).toBeDefined();
        expect(server.parsedData[0].magic_header, "Wrong Magic_Header").toBe(true);
        expect(server.parsedData[0].magic_footer, "Wrong Magic_Footer").toBe(true);
        expect(server.parsedData[0].constructor.name, `Unknwon Varian 0x${server.parsedData[0].msg_id.toString(16)}`).toBe(ProgramEndMessage.name);
    });
    test("STATUS READ", async () => {
        expect(client.send(Buffer.from('FAD41000FFFFFFFF240F0400FF000000AAF28D23009B366633562DDF', 'hex'))).toBe(true);
        await sleep(1);
        expect(server.parsedData.length).toBe(1);
        expect(server.parsedData[0]).toBeDefined();
        expect(server.parsedData[0].magic_header, "Wrong Magic_Header").toBe(true);
        expect(server.parsedData[0].magic_footer, "Wrong Magic_Footer").toBe(true);
        expect(server.parsedData[0].constructor.name, `Unknwon Varian 0x${server.parsedData[0].msg_id.toString(16)}`).toBe(StatusMessage_r.name);
    });
    test("STATUS WRITE", async () => {
        expect(client.send(Buffer.from('FAD4FC005C4A00002446F000FF020400AAF28D23A62743048302EC00B400D000CA00B400BC026C02508100000C05615004088302E600BA00BC00BA008C0020032C01505100000C05FFFFFFFF00000000000000000000000000000000010000000000FFFFFFFF00000000000000000000000000000000010000000000FFFFFFFF00000000000000000000000000000000010000000000FFFFFFFF00000000000000000000000000000000010000000000FFFFFFFF00000000000000000000000000000000010000000000FFFFFFFF0000000000000000000000000000000001000000000085623F0005004E01320008010000D0020900000000003407140A0000F401000068B52DDF', 'hex'))).toBe(true);
        await sleep(1);
        expect(server.parsedData.length).toBe(1);
        expect(server.parsedData[0]).toBeDefined();
        expect(server.parsedData[0].magic_header, "Wrong Magic_Header").toBe(true);
        expect(server.parsedData[0].magic_footer, "Wrong Magic_Footer").toBe(true);
        expect(server.parsedData[0].constructor.name, `Unknwon Varian 0x${server.parsedData[0].msg_id.toString(16)}`).toBe(StatusMessage_w.name);
    });
    for (let [index, message] of [
        'FAD42A001A0600000A461E00FF020400AAF28D23A627430400000000000000001121221111111111111111111111111111001C812DDF',
        'FAD42A001A0600000A461E00FF020400AAF28D23A6274304010000000000001122121100000010111111111111111111110059572DDF',
        'FAD42A001A0600000A461E00FF020400AAF28D23A627430405000000000000112212110000001011111111111111111111009FC62DDF',
        'FAD42A001A0600000A461E00FF020400AAF28D23A6274304060000000000000011212211111111111111111111111111110039582DDF',
        'FAD42A001A0600000A461E00FF020600AAF28D23A6274304020000000000001122121100000010111111111111111111110059E12DDF',
        'FAD42A001A0700000A461E00FF020000AAF28D23A627430406000000000000001121221111111111111111111111111111003DFD2DDF',
        'FAD42A00160000000A461E00FF020400AAF28D23000000000300000000000000000000000000000000000000000000000000B0CF2DDF'
    ].entries()) {
        test(`PROGRAM case ${index + 1}`, async () => {
            expect(client.send(Buffer.from(message, 'hex'))).toBe(true);
            await sleep(1);
            expect(server.parsedData.length).toBe(1);
            expect(server.parsedData[0]).toBeDefined();
            expect(server.parsedData[0].magic_header, "Wrong Magic_Header").toBe(true);
            expect(server.parsedData[0].magic_footer, "Wrong Magic_Footer").toBe(true);
            //  console.log(server.parsedData[0].constructor.name, `Unknwon Varian 0x${server.parsedData[0].msg_id.toString(16)}`);
            expect(server.parsedData[0].constructor.name, `Unknwon Varian 0x${server.parsedData[0].msg_id.toString(16)}`).toBe(ProgramMessage.name);
        });
    }
    for (let [index, message] of [
        'FAD41400FFFFFFFF2B0C0800A9000000AAF28D2361500408E00F80000CD12DDF',
        'FAD41400FFFFFFFF2B0C0800AD000000AAF28D23A6274304E00F8000C8292DDF',
        'FAD41400FFFFFFFF2B0C0800AE000000AAF28D2361500408E00F800093B92DDF',
        'FAD41400FFFFFFFF2B0C0800B2000000AAF28D23A6274304E00F8000D8732DDF',
        'FAD41400FFFFFFFF2B0C0800B3000000AAF28D2361500408E00F8000EAA32DDF',
    ].entries()) {
        test(`GET PROGRAM  case ${index + 1}`, async () => {
            expect(client.send(Buffer.from(message, 'hex'))).toBe(true);
            await sleep(1);
            expect(server.parsedData.length).toBe(1);
            expect(server.parsedData[0]).toBeDefined();
            expect(server.parsedData[0].magic_header, "Wrong Magic_Header").toBe(true);
            expect(server.parsedData[0].magic_footer, "Wrong Magic_Footer").toBe(true);
            //  console.log(server.parsedData[0].constructor.name, `Unknwon Varian 0x${server.parsedData[0].msg_id.toString(16)}`);
            expect(server.parsedData[0].constructor.name, `Unknwon Varian 0x${server.parsedData[0].msg_id.toString(16)}`).toBe(GetProgramMessage.name);
        });
    }
    for (let [index, message] of [
        'FAD41000FFFFFFFF290F0400FF000000AAF28D23BF1A6F6632F22DDF',
        'FAD41000FFFFFFFF290F0400FF000000AAF28D23BF1A72661D872DDF',
        'FAD41000FFFFFFFF290F0400FF000000AAF28D23BF1A7F6641F12DDF',
    ].entries()) {
        test(`DEVICE TIME  case ${index + 1}`, async () => {
            expect(client.send(Buffer.from(message, 'hex'))).toBe(true);
            await sleep(1);
            expect(server.parsedData.length).toBe(1);
            expect(server.parsedData[0]).toBeDefined();
            expect(server.parsedData[0].magic_header, "Wrong Magic_Header").toBe(true);
            expect(server.parsedData[0].magic_footer, "Wrong Magic_Footer").toBe(true);
            //  console.log(server.parsedData[0].constructor.name, `Unknwon Varian 0x${server.parsedData[0].msg_id.toString(16)}`);
            expect(server.parsedData[0].constructor.name, `Unknwon Varian 0x${server.parsedData[0].msg_id.toString(16)}`).toBe(DeviceTimeMessage.name);
        });
    }
    for (let [index, message] of [
        'FAD40D00FFFFFFFF110E01000A000000AAF28D2301E0502DDF',
        'FAD40D00FFFFFFFF110E01000B000000AAF28D2301C3BB2DDF',
        'FAD40D00FFFFFFFF110E01000C000000AAF28D2301680A2DDF',
        'FAD40D00FFFFFFFF110E01000D000000AAF28D23014BE12DDF',
        'FAD40D00FFFFFFFF110E01000E000000AAF28D23010FCC2DDF',
    ].entries()) {
        test(`Unknown 11  case ${index + 1}`, async () => {
            expect(client.send(Buffer.from(message, 'hex'))).toBe(true);
            await sleep(1);
            expect(server.parsedData.length).toBe(1);
            expect(server.parsedData[0]).toBeDefined();
            expect(server.parsedData[0].magic_header, "Wrong Magic_Header").toBe(true);
            expect(server.parsedData[0].magic_footer, "Wrong Magic_Footer").toBe(true);
            //  console.log(server.parsedData[0].constructor.name, `Unknwon Varian 0x${server.parsedData[0].msg_id.toString(16)}`);
            expect(server.parsedData[0].constructor.name, `Unknwon Varian 0x${server.parsedData[0].msg_id.toString(16)}`).toBe(Unknown11Message.name);
        });
    }
    test.skip(`?`, async () => {
        expect(client.send(Buffer.from('FAD40E000000000022060200FF020100AAF28D230100DA1A2DDF', 'hex'))).toBe(true);
        await sleep(1);
        expect(server.parsedData.length).toBe(1);
        expect(server.parsedData[0]).toBeDefined();
        expect(server.parsedData[0].magic_header, "Wrong Magic_Header").toBe(true);
        expect(server.parsedData[0].magic_footer, "Wrong Magic_Footer").toBe(true);
        //  console.log(server.parsedData[0].constructor.name, `Unknwon Varian 0x${server.parsedData[0].msg_id.toString(16)}`);
        expect(server.parsedData[0].constructor.name, `Unknwon Varian 0x${server.parsedData[0].msg_id.toString(16)}`).toBe(VersionMessage.name);
    });
});