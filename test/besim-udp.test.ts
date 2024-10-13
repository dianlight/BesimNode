import { expect, onTestFailed, test, vi } from 'vitest';
import { BESIM_COMMANDS, colorHex, IBeSmartFrame, parseBinary } from '../src/parsers/besim-udp.js'
import { describe } from 'vitest';
import LineByLine from 'line-by-line'


function linesFactory() {
    return new LineByLine('./test/data/only_udp_dedup.txt')
}


describe('UDP Parser', () => {
    // Test All
    test.skip('Parse collected udp messages', { timeout: Infinity }, async () => {
        const parser = vi.fn(parseBinary)
        let lineNumber = 1;
        const lines = linesFactory();
        await new Promise((resolve, reject) => {
            lines.on('error', (err) => reject(err));
            lines.on('line', (line) => {
                lineNumber++;
                if (lineNumber % 100000 == 0) console.log(`Done Processd ${lineNumber}`);
                let result: IBeSmartFrame;
                try {
                    result = parser(Buffer.from(line, "hex"));
                    //console.log("DATA", result);
                    expect(result).toBeDefined();
                    expect(result.payload.endOfMessage).toBe(result.endOfPayload)
                    expect(result.payload.unknown_remain).toBeDefined()
                    expect(result.payload.unknown_remain).toHaveLength(0)
                } catch (e) {
                    console.error(colorHex(line), result!, e);
                    reject(e);
                }
            })
            lines.on('end', () => {
                console.log(`Ending: ${lineNumber}`)
                resolve(lineNumber)
            });
        })
        expect(parser).toHaveReturnedTimes(lineNumber);
    });

    // Test STATUS message
    test('Parse and check types', { timeout: Infinity }, async () => {
        const parser = vi.fn(parseBinary)
        let lineNumber = 1;
        const lines = linesFactory();

        const resp = await new Promise((resolve, reject) => {
            lines.on('error', (err) => reject(err));
            lines.on('line', (line) => {
                // console.log(line);
                lineNumber++;
                if (lineNumber % 100000 == 0) console.log(`Done Processd ${lineNumber}`);
                let result: IBeSmartFrame;
                try {
                    result = parser(Buffer.from(line, "hex"));
                    //console.log("DATA", result);
                    expect(result).toBeDefined();
                    expect(result.payload.endOfMessage).toBe(result.endOfPayload)
                    expect(result.payload.unknown_remain).toBeDefined()
                    expect(result.payload.unknown_remain).toHaveLength(0)

                    if (!result.payload.response) {
                        // Request
                        switch (result.payload.msgId) {
                            case BESIM_COMMANDS.PING:
                                if (result.payload.meg_length != 2 && result.payload.unk3 != 1) reject("PING Request Wrong!")
                                break;
                            case BESIM_COMMANDS.UNKNOWN_0x11:
                                if (result.payload.meg_length != 1) reject("UNKNOWN_0x11 Request Wrong!")
                                break;
                            case BESIM_COMMANDS.SWVERSION:
                                if (result.payload.meg_length != 0) reject("SWVERSION Request Wrong!")
                                break;
                            case BESIM_COMMANDS.REFRESH:
                                if (result.payload.meg_length != 0) reject("REFRESH Request Wrong!")
                                break;
                            case BESIM_COMMANDS.DEVICE_TIME:
                                if (result.payload.write && result.payload.meg_length != 1) reject({ error: "DEVICE_TIME(SET) Request Wrong!", result, line })
                                else if (!result.payload.write && result.payload.meg_length != 0) reject({ error: "DEVICE_TIME Request Wrong!", result, line })
                                break;
                            case BESIM_COMMANDS.PROG_END:
                                if (result.payload.write && result.payload.meg_length != 6 && result.payload.message.unk3 != 10) reject({ error: "PROG_END(SET) Request Wrong!", result, line })
                                break;
                            default:
                                console.log(colorHex(line));
                                console.log(result);
                                resolve(lineNumber);
                                lines.end();
                                break;
                        }
                    } else {
                        // Response
                        switch (result.payload.msgId) {
                            case BESIM_COMMANDS.PING:
                                if (result.payload.meg_length != 2 && result.payload.unk3 != 62220) reject("PING Response Wrong!")
                                break;
                            case BESIM_COMMANDS.SWVERSION:
                                if (result.payload.meg_length != 0) reject("SWVERSION Response Wrong!")
                                // deco LastSeen?
                                break;
                            case BESIM_COMMANDS.STATUS:
                                if (result.payload.meg_length != 4) reject("STATUS Response Wrong!")
                                // deco LastSeen?
                                break;
                            case BESIM_COMMANDS.DEVICE_TIME:
                                if (result.payload.write && result.payload.meg_length != 4 && result.payload.message.unk4 != 26165) reject({ error: "DEVICE_TIME(SET) Request Wrong!", result, line })
                                break;
                            case BESIM_COMMANDS.SET_T1:
                            case BESIM_COMMANDS.SET_T2:
                            case BESIM_COMMANDS.SET_T3:
                                if (result.payload.write && result.payload.meg_length != 6 && result.payload.message.value > 10) reject({ error: "SET_T*(SET) Request Wrong!", result, line })
                                break;
                            default:
                                console.log(colorHex(line));
                                console.error(result);
                                resolve(lineNumber);
                                lines.end();
                                break;
                        }
                    }
                    //
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
        expect(parser).toHaveReturnedTimes(lineNumber);
    })


});
