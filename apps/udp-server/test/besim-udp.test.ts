import "reflect-metadata";
import { expect, test } from 'bun:test';
import { BESIM_COMMANDS, colorHex, colorHexPayload, parseBinary } from '../src/parsers/besim-udp.js'
import { BeSmartFrame } from '../src/parsers/besmart-frame.js';
import { describe } from 'bun:test';
import LineByLine from 'line-by-line'
import { crc16xmodem } from 'node-crc';
import exp from "constants";



function linesFactory() {
    //return new LineByLine('./test/data/only_udp_dedup.txt')
    return new LineByLine('./test/data/only_one_udp.txt')
}


describe('UDP Parser', async () => {
    // Test All
    const lines = linesFactory();
    await new Promise((resolve, reject) => {
        lines.on('error', (err: any) => reject(err));
        lines.on('line', (line: any) => {
            test(`Parse ${line.toString(16)}`, async () => {
                let result: BeSmartFrame;
                try {
                    const lineData = Uint8Array.from(Buffer.from(line, "hex"));
                    result = parseBinary(lineData);
                    expect(result).toBeDefined();
                    expect(result.magic_header, "Wrong Magic_Header").toBe(true);
                    expect(result.magic_footer, "Wrong Magic_Footer").toBe(true);

                    //expect(result.serialize(), "Wrong Serialize").toEqual(lineData);

                    const payload_buf = Buffer.from(lineData.subarray(8, 8 + result.payload_length));
                    const crc16 = crc16xmodem(payload_buf).readUInt16BE();
                    // console.log("DATA", result.constructor.name, JSON.stringify(result, (key, value) => {
                    //     if (typeof value === 'number') {
                    //         return '0x' + value.toString(16).toUpperCase();
                    //     }
                    //     return value
                    // }), colorHex(line), "\n                   " + colorHexPayload(payload_buf.toString('hex')), crc16, result.crc16);
                    expect(result.crc16, "Wrong CRC16").toBe(crc16);
                    expect(result.constructor.name, `Unknwon Varian 0x${result.msg_id.toString(16)}`).not.toBe('BeSmartFrame');

                    // expect(result.payload.endOfMessage).toBe(result.endOfPayload)
                    // expect(result.payload.unknown_remain).toBeDefined()
                    // expect(result.payload.unknown_remain).toHaveLength(0)
                } catch (e) {
                    console.error(colorHex(line), result!, e);
                    lines.close();
                    throw e
                    //                    reject(e);
                }
            });
            test(`Parse and Reserialize ${line.toString(16)}`, async () => {
                let result, result2: BeSmartFrame;
                let errorMessage: string = colorHex(line) + "\n";
                try {
                    const lineData = Uint8Array.from(Buffer.from(line, "hex"));
                    result = parseBinary(lineData);
                    expect(result).toBeDefined();

                    errorMessage += colorHex(Buffer.from(result.serialize()).toString('hex'), false) + "\n";
                    const reserialized = result.serialize();
                    result2 = parseBinary(reserialized);
                    expect(reserialized, "Wrong Serialize").toEqual(lineData);

                    const payload_buf = Buffer.from(result.serialize().subarray(8, 8 + result.payload_length));
                    errorMessage += colorHexPayload(payload_buf.toString('hex')) + "\n";
                    const crc16 = crc16xmodem(payload_buf).readUInt16BE();
                    expect(result.crc16, "Wrong CRC16").toBe(crc16);
                    expect(result.constructor.name, `Unknwon Varian 0x${result.msg_id.toString(16)}`).not.toBe('BeSmartFrame');

                } catch (e) {
                    console.error(errorMessage, result!, result2!, e);
                    lines.close();
                    throw e
                }
            });

        })
        lines.on('end', () => {
            resolve(0)
        });
    })

    // Test STATUS message
    test.skip('Parse and check types', async () => {
        let lineNumber = 1;
        const lines = linesFactory();

        const resp = await new Promise((resolve, reject) => {
            lines.on('error', (err: any) => reject(err));
            lines.on('line', (line: any) => {
                // console.log(line);
                lineNumber++;
                if (lineNumber % 100000 == 0) console.log(`Done Processd ${lineNumber}`);
                let result: BeSmartFrame;
                try {
                    result = parseBinary(Uint8Array.from(Buffer.from(line, "hex")));
                    //console.log("DATA", result);
                    expect(result).toBeDefined();
                    expect(result.magic_header, "Wrong Magic_Header").toBe(true);
                    expect(result.magic_footer, "Wrong Magic_Footer").toBe(true);
                    console.log("PayLoad:", result.serialize(result.$startOfPayload, result.$endOfPayload))
                    // expect(result.payload.endOfMessage).toBe(result.endOfPayload)
                    // expect(result.payload.unknown_remain).toBeDefined()
                    // expect(result.payload.unknown_remain).toHaveLength(0)

                    // if (!result.payload.response) {
                    //     // Request
                    //     switch (result.payload.msgId) {
                    //         case BESIM_COMMANDS.PING:
                    //             if (result.payload.meg_length != 2 && result.payload.unk3 != 1) reject("PING Request Wrong!")
                    //             break;
                    //         case BESIM_COMMANDS.UNKNOWN_0x11:
                    //             if (result.payload.meg_length != 1) reject("UNKNOWN_0x11 Request Wrong!")
                    //             break;
                    //         case BESIM_COMMANDS.SWVERSION:
                    //             if (result.payload.meg_length != 0) reject("SWVERSION Request Wrong!")
                    //             break;
                    //         case BESIM_COMMANDS.REFRESH:
                    //             if (result.payload.meg_length != 0) reject("REFRESH Request Wrong!")
                    //             break;
                    //         case BESIM_COMMANDS.DEVICE_TIME:
                    //             if (result.payload.write && result.payload.meg_length != 1) reject({ error: "DEVICE_TIME(SET) Request Wrong!", result, line })
                    //             else if (!result.payload.write && result.payload.meg_length != 0) reject({ error: "DEVICE_TIME Request Wrong!", result, line })
                    //             break;
                    //         case BESIM_COMMANDS.PROG_END:
                    //             if (result.payload.write && result.payload.meg_length != 6 && result.payload.message.unk3 != 10) reject({ error: "PROG_END(SET) Request Wrong!", result, line })
                    //             break;
                    //         default:
                    //             console.log(colorHex(line));
                    //             console.log(result);
                    //             resolve(lineNumber);
                    //             lines.end();
                    //             break;
                    //     }
                    // } else {
                    //     // Response
                    //     switch (result.payload.msgId) {
                    //         case BESIM_COMMANDS.PING:
                    //             if (result.payload.meg_length != 2 && result.payload.unk3 != 62220) reject("PING Response Wrong!")
                    //             break;
                    //         case BESIM_COMMANDS.SWVERSION:
                    //             if (result.payload.meg_length != 0) reject("SWVERSION Response Wrong!")
                    //             // deco LastSeen?
                    //             break;
                    //         case BESIM_COMMANDS.STATUS:
                    //             if (result.payload.meg_length != 4) reject("STATUS Response Wrong!")
                    //             // deco LastSeen?
                    //             break;
                    //         case BESIM_COMMANDS.DEVICE_TIME:
                    //             if (result.payload.write && result.payload.meg_length != 4 && result.payload.message.unk4 != 26165) reject({ error: "DEVICE_TIME(SET) Request Wrong!", result, line })
                    //             break;
                    //         case BESIM_COMMANDS.SET_T1:
                    //         case BESIM_COMMANDS.SET_T2:
                    //         case BESIM_COMMANDS.SET_T3:
                    //             if (result.payload.write && result.payload.meg_length != 6 && result.payload.message.value > 10) reject({ error: "SET_T*(SET) Request Wrong!", result, line })
                    //             break;
                    //         default:
                    //             console.log(colorHex(line));
                    //             console.error(result);
                    //             resolve(lineNumber);
                    //             lines.end();
                    //             break;
                    //     }
                    // }
                    // //
                } catch (e) {
                    console.error(colorHex(line), result!, e);
                    reject(e);
                    lines.close();
                }
            })
            lines.on('end', () => {
                console.log(`Ending: ${lineNumber}`)
                resolve(lineNumber)
            });
        }).catch((reason) => {
            console.error(reason.error, reason.result);
            console.error(colorHex(reason.line));
        })
        //  expect(parser).toHaveReturnedTimes(lineNumber);
    })


});
