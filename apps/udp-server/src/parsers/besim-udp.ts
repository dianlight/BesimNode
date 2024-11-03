import colorize, { hex } from "@visulima/colorize";
import { crc16xmodem } from "node-crc";
import { BeSmartFrame } from "./besmart-frame.js"
import { BitstreamReader } from "@astronautlabs/bitstream";


export enum BESIM_COMMANDS {
    SET_MODE = 0x02,

    // 0x03    Unknown (from test probe: deviceid) (invalid)
    // 0x04    Unknown(from test probe: deviceid)(invalid)
    // 0x05    Unknown(from test probe: deviceid)(invalid)
    // 0x06    Unknown(from test probe: deviceid)(invalid)
    // 0x07    Unknown(from test probe: deviceid)(invalid)
    // 0x08    Unknown(from test probe: deviceid)(invalid)
    // 0x09    Unknown(from test probe: deviceid)(invalid)

    // PROGRAM = 0x0A

    SET_T3 = 0x0B,
    SET_T2 = 0x0C,
    SET_T1 = 0x0D,

    // 0x0e    Unknown(from test probe: deviceid, roomid)(invalid)
    // 0x0f    Unknown(from test probe: deviceid, long message with lots of 0x0  followed by lots of 0xff) Could this be OpenTherm parameters ?
    // 0x10    Unknown(from test probe: deviceid)(invalid)
    UNKNOWN_0x11 = 0x11,   // Unknown(from test probe: deviceid, byte = 0xff)

    SET_ADVANCE = 0x12,

    // 0x13    Unknown(from test probe: deviceid)(invalid)
    // 0x14    Unknown(from test probe: deviceid, 4 bytes = 0x0)

    SWVERSION = 0x15,

    SET_CURVE = 0x16,

    SET_MIN_HEAT_SETP = 0x17,
    SET_MAX_HEAT_SETP = 0x18,

    SET_UNITS = 0x19,

    SET_SEASON = 0x1A,

    SET_SENSOR_INFLUENCE = 0x1B,

    // 0x1c    Unknown(from test probe: deviceid, roomid, byte = 85)

    REFRESH = 0x1D,

    // 0x1e    Unknown(from test probe: deviceid)(invalid)
    // 0x1f    Unknown(from test probe: deviceid)(invalid)

    OUTSIDE_TEMP = 0x20,

    // 0x21    Unknown(from test probe: deviceid)(invalid)

    PING = 0x22,

    // 0x23    Unknown(from test probe: deviceid)(invalid)

    STATUS = 0x24,

    // 0x25    Unknown(from test probe: deviceid, byte = 0x1)
    // 0x26    Unknown(from test probe: deviceid)(invalid)
    // 0x27    Unknown(from test probe: deviceid)(invalid)
    // 0x28    Unknown(from test probe: deviceid)(invalid)

    DEVICE_TIME = 0x29,

    PROG_END = 0x2A,

    GET_PROG = 0x2B,

    // 0x2c    Unknown(from test probe: deviceid, short = 0x1c2)
    // 0x2d    Unknown(from test probe: deviceid)(invalid)
    // 0x2e    Unknown(from test probe: deviceid)(invalid)
    // 0x30    Unknown(from test probe: deviceid)(invalid)
}


export interface IBeSimMessageHeader {
    cseq: number,
    unk1: number
    unk2: number
}

/*
const messageHeader_4 = new Parser() // 4
    .endianness("little")
    .uint8("cseq")
    .uint8("unk1", { assert: 0x00 })
    .uint16le("unk2")


const messageDeviceHeader_8 = new Parser()
    .endianness("little")
    .nest({
        type: messageHeader_4
    })
    .uint32le("deviceId") // 8
*/
export interface IBeSimRoomMessageHeader extends IBeSimDeviceMessageHeader {
    room: number
}
/*
const messageRoomHeader_12 = new Parser()
    .endianness("little")
    .nest({
        type: messageDeviceHeader_8
    })
    .uint32le("room") // 16


const UnknownMessageIgnore = new Parser()
    .nest({
        type: messageDeviceHeader_8
    })
    .uint8("data")
*/

export enum ROOM_HEATING_CODE {
    HEATING = 0x8E,
    NOT_HEATING = 0x83
}

export enum DEGREE_UNIT {
    C = 0,
    F = 1
}

export interface IBeSimStatusMessage extends IBeSimDeviceMessageHeader {
    rooms: [
        {
            room: number,
            heating: ROOM_HEATING_CODE,
            unk9: number,
            mode: number,
            temp: number,
            set_temp: number,
            t3: number,
            t2: number,
            t1: number,
            max_setpoint: number,
            min_setpoint: number,
            unk1: boolean,
            advence: boolean,
            unit: DEGREE_UNIT,
            sensor_influence: number,
            unk2: boolean,
            winter: boolean,
            cmd_is_issue: boolean,
            boost: boolean,
            unk3: boolean,
            unk13: number
            temp_curve: number
            heating_setpoint: number
        }
    ],
    unkot0: boolean,
    unkot1: boolean,
    unkot2: boolean,
    unkot3: boolean,
    unkot4: boolean,
    boiler_heating: boolean,
    dhw_mode: boolean,
    unkot7: boolean,
    otFlags2: number,

    otUnk1: number,
    otUnk2: number,
    tFLO: number,
    otUnk4: number,
    tdH: number,
    tESt: number,
    otUnk7: number,
    otUnk8: number,
    otUnk9: number,
    otUnk10: number,

    wifi_signal: number,
    unk16: number,
    unk17: number,
    unk18: number,
    unk19: number,
    unk20: number,

}

/*
const StatusMsg = new Parser()
    .endianness("little")
    .nest({
        type: messageDeviceHeader_8
    })
    .array("rooms", {
        length: 8,
        type: new Parser()
            .uint32le("room")
            .uint8("heating") // 0x8F=yes 0x83=no
            //.uint8("byte3")
            .bit4("unk9")
            .bit4("mode")
            .int16le("temp")
            .int16le("set_temp")
            .int16le("t3")
            .int16le("t2")
            .int16le("t1")
            .int16le("max_setpoint")
            .int16le("min_setpoint")
            //.uint8("byte3")
            .bit1("unk1")
            .bit1("advance")
            .bit1("unit")
            .bit4("sensor_influence")
            .bit1("unk2")
            //.unit4("byte4")
            .bit1("winter")
            .bit1("cmd_is_issue")
            .bit1("boost")
            .bit5("unk3")
            .uint16le("unk13")
            .uint8("temp_curve")
            .uint8("heating_setpoint")
    }
    )
    // OpenTherm
    //.unit8("otFlags1")
    .bit1("unkot0")
    .bit1("unkot1")
    .bit1("unkot2")
    .bit1("unkot3")
    .bit1("unkot4")
    .bit1("boiler_heating")
    .bit1("dhw_mode")
    .bit1("unkot7")
    .uint8("otFlags2")

    .int16("otUnk1")
    .int16("otUnk2")
    .int16("tFLO")
    .int16("otUnk4")
    .int16("tdH")
    .int16("tESt")
    .int16("otUnk7")
    .int16("otUnk8")
    .int16("otUnk9")
    .int16("otUnk10")

    .uint8("wifi_signal")
    .uint8("unk16")
    .uint16("unk17")
    .uint16("unk18")
    .uint16("unk19")
    .uint16("unk20")
*/






/*
const BeSmartPayload = new Parser()
    .endianness("little")
    .uint8("msgId")
    .bit1("response")
    .bit1("write")
    .bit1("valid")
    .bit1("downlink")
    .bit1("bit4", { assert: 0x0 })
    .bit1("sync_lost")
    .bit1("uplink")
    .bit1("bit7", { assert: 0x0 })

    .uint16le("meg_length")
    //    .buffer("message",{ length: function () { return this.meg_length+8; }})
    .saveOffset("startOfMessage")
    .choice({
        tag: 'meg_length',
        choices: {
            0x00: new Parser()
                .nest('message', {
                    type: messageDeviceHeader_8
                })
        },
        defaultChoice: new Parser()
            .choice("message", {
                tag: "msgId",
                length: function () { return this.meg_length + 8; },
                choices: {
                    //             0x02: new Parser() // _SetModeMsg, //   SET_MODE
                    //             .endianness("little")
                    //             .nest({
                    //                 type: messageDeviceHeader_8
                    //             })
                    //             .uint8("mode"), //  0=auto 1=manual 2=holiday 3=party 4=off 5=dhw
                    0x0A: new Parser() //   PROGRAM ( 1/day )
                        .endianness("little")
                        .nest({
                            type: messageRoomHeader_12
                        })
                        .uint16le("day")
                        .array("hours", {
                            type: "uint8",
                            length: 24
                        }),
                    0x0B: new Parser() // _SetT3Msg, //   SET_T3
                        .endianness("little")
                        .nest({
                            type: messageRoomHeader_12
                        })
                        .uint16("value", {
                            formatter: function (temp) {
                                return temp / 10;
                            }
                        }), //  °C * 10
                    0x0C: new Parser() // _SetT2Msg, //   SET_T2
                        .endianness("little")
                        .nest({
                            type: messageRoomHeader_12
                        })
                        .uint16("value", {
                            formatter: function (temp) {
                                return temp / 10;
                            }
                        }), // °C * 10
                    0x0D: new Parser() // _SetT1Msg, //   SET_T1
                        .endianness("little")
                        .nest({
                            type: messageRoomHeader_12
                        })
                        .uint16("value", {
                            formatter: function (temp) {
                                return temp / 10;
                            }
                        }), // °C * 10
                    0x11: UnknownMessageIgnore,
                    // //            0x12: _AdvanceMsg, //   ADVANCE 
                    0x15: new Parser() //   SW_VERSION
                        .endianness("little")
                        .nest({
                            type: messageDeviceHeader_8
                        })
                        .string("version", { length: 13, stripNull: true }),
                    //             0x16: new Parser() // _SetCurvaOTHMsg, //   SET_CURVE ( OpenTherm - °C * 10)
                    //             .endianness("little")
                    //             .nest({
                    //                 type: messageDeviceHeader_8
                    //             })
                    //             .uint8("curve"), 
                    //             0x17: new Parser() //_SetMinHeatSetPointOTHMsg, //   SET_MIN_HEAT_SETP  ( Ophenterm )
                    //             .endianness("little")
                    //             .nest({
                    //                 type: messageDeviceHeader_8
                    //             })
                    //             .uint16("oth_set_min_setpoint"), 
                    //             0x18: new Parser() //_SetMaxHeatSetPointOTHMsg, //  SET_MAX_HEAT_SETP  ( Ophenterm )
                    //             .endianness("little")
                    //             .nest({
                    //                 type: messageDeviceHeader_8
                    //             })
                    //             .uint16("oth_set_max_setpoint"), 
                    //             0x19: new Parser() //_SetUnitMsg, //   SET_UNITS (0=°C 1=°F)
                    //             .endianness("little")
                    //             .nest({
                    //                 type: messageDeviceHeader_8
                    //             })
                    //             .uint8("unit"), //  (0=°C 1=°F)
                    //             0x1A: new Parser() //_SetSeasonMsg, //   SET_SEASON (1 = Winter)
                    //             .endianness("little")
                    //             .nest({
                    //                 type: messageDeviceHeader_8
                    //             })
                    //             .uint8("season"), // (1 = Winter)
                    //             0x1B: new Parser() //_SetSensorInfluenceOTHMsg, //   SET_SEMSPR_INFLUENCE ( Opentherm )
                    //             .endianness("little")
                    //             .nest({
                    //                 type: messageDeviceHeader_8
                    //             })
                    //             .uint8("oth_sensor_influence"), 
                    //             0x1D: new Parser() // RefreshMsg, //   REFRESH ?
                    //             .nest({
                    //                 type: messageDeviceHeader_8
                    //             })    
                    //             .uint32le("unk3")  // ????? optional?
                    //             ,            
                    //             0x20: new Parser()
                    //             .endianness("little")
                    //             .nest({
                    //                 type: messageDeviceHeader_8
                    //             })
                    //             .uint8("val") // 0=no 1=boiler ext tempp 2= web external temp
                    //             , //   OUTSIDE_TEMP  0=none, 1=boiler, 2= web
                    0x22: new Parser() //PingMsg, //   PING
                        .nest({
                            type: messageDeviceHeader_8
                        })
                        .uint16le("unk3",/* { assert: 0xF43C } * /) // Constants send_PING
                    ,
                    //            0x24: StatusMsg, //    STATUS
                    0x24: new Parser() //   STATUS (Short?) - Downlink 1
                        .choice({
                            tag: function () { return this.$parent.downlink; },
                            choices: {
                                0x00: StatusMsg,
                                0x01: new Parser()
                                    .nest({
                                        type: messageDeviceHeader_8
                                    })
                                    .uint32le("lastseen"), // timestamp?
                            }
                        }),
                    0x29: new Parser() //   DEVICE_TIME
                        .nest({
                            type: messageDeviceHeader_8
                        })
                        .choice({
                            tag: function () { return this.$parent.meg_length; },
                            choices: {
                                1: new Parser()
                                    .uint8("val"), // 0=no dst 1=dst
                                //    .uint8("unk3")
                                //    .uint16le("unk4"),
                                4: new Parser()
                                    .uint8("val") // 0=no dst 1=dst
                                    .uint8("unk3")
                                    .uint16le("unk4"),
                                6: new Parser()
                                    .uint8("val") // 0=no dst 1=dst
                                    .uint8("unk3")
                                    .uint16le("unk4")
                                    .uint16le("unk5"),
                                8: new Parser()
                                    .uint8("val") // 0=no dst 1=dst
                                    .uint8("unk3")
                                    .uint16le("unk4")
                                    .uint32le("unk5"), // ? Time
                                13: new Parser()
                                    .uint8("val") // 0=no dst 1=dst
                                    .uint8("unk3")
                                    .uint16le("unk4")
                                    .uint32le("unk5") // ? Time
                                    .uint8("unk6")
                                    .uint32le("unk7"),
                                30: new Parser()
                                    .uint8("val") // 0=no dst 1=dst
                                    .uint8("unk3")
                                    .uint16le("unk4")
                                    .uint32le("unk5")  // ? Time
                                    .uint32le("unk6")
                                    .uint32le("unk7")
                                    .uint32le("unk8")
                                    .uint32le("unk9")
                                    .uint32le("unk10")
                                    .uint16le("unk11"),
                            }
                        }),
                    0x2A: new Parser() //   PROGRAM_END
                        .endianness("little")
                        .nest({
                            type: messageRoomHeader_12
                        })
                        .uint8("unk3", { assert: 0x14 }) // Send 
                        .uint8("unk3", /*{ assert: 0x0A14 }* /), // Send 
                    0x2B: new Parser()  //GetProgramMsg, //   GET_PROGRAM
                        .nest({
                            type: messageRoomHeader_12
                        })
                        .uint32le("unk3", { assert: 0x800FE0 }) // send_Get_prog
                },
                defaultChoice: new Parser()
                    .nest({
                        type: messageDeviceHeader_8
                    })
            })
    })
    .saveOffset("endOfMessage")
    .buffer("unknown_remain", {
        length: function () {
            return this.startOfMessage + this.meg_length + 8 - this.endOfMessage;
        }
    })
    */
//    .seek(function() {
//        console.log(this.startOfMessage,this.meg_length+8,this.endOfMessage);
//        console.log(this.startOfMessage+this.meg_length+8-this.endOfMessage);
//        return this.startOfMessage+this.meg_length+8-this.endOfMessage;
//    })




/*
export interface IBeSmartFrame {
    magic_header: number,
    payload_length: number,
    sequence: number,
    startOfPayload: number,
    payload: IBeSimDevicePayload | IBeSimStatusPayload | IBeSimPingPayload
    endOfPayload: number
    crc16: number,
    magic_footer: number
}
    */

export interface IBeSmartPayload<T extends IBeSimDeviceMessageHeader | IBeSimStatusMessage | IBeSimPingMessage> {
    msgId: BESIM_COMMANDS,
    response: boolean,
    write: boolean,
    valid: boolean,
    downlink: boolean,
    sync_lost: boolean,
    uplink: boolean,
    meg_length: number,
    startOfMessage: number,
    message: T,
    endOfMessage: number,
    unknown_remain: Buffer
}

export interface IBeSimDevicePayload extends IBeSmartPayload<IBeSimDeviceMessageHeader> {
    msgId: BESIM_COMMANDS.DEVICE_TIME
}

export interface IBeSimStatusPayload extends IBeSmartPayload<IBeSimStatusMessage> {
    msdId: BESIM_COMMANDS.STATUS
}

export interface IBeSimPingPayload extends IBeSmartPayload<IBeSimPingMessage> {
    msdId: BESIM_COMMANDS.PING
}

export interface IBeSimDeviceMessageHeader extends IBeSimMessageHeader {
    deviceId: number
}

export interface IBeSimPingMessage extends IBeSimDeviceMessageHeader {
    unk3: number
}

/*
const BeSmartFrame = new Parser()
    .endianness("little")
    .useContextVars()
    .uint16le("magic_header", { assert: 0xd4fa })
    .uint16le("payload_length")
    .uint32le("sequence")
    .buffer("payload_buf", { length: "payload_length" })
    .seek(function () {
        //   console.log("Seek", - this.payload_length)
        return -this.payload_length;
    })
    .saveOffset("startOfPayload")
    .nest("payload", {
        length: "payload_length",
        type: BeSmartPayload
    })
    .saveOffset("endOfPayload", {
        assert: function (enop) {
            if ((enop - this.payload_length) == this.startOfPayload) {
                return true;
            }
            console.log("Check position", enop, this.payload_length, this.startOfPayload)
            return false;
        }
    })
    .uint16le("crc16", {
        assert: function (hexcrc) {
            if (crc16xmodem(this.payload_buf).readUInt16BE() == hexcrc) {
                return true
            } else {
                console.log("Payload", this.payload_buf.toString("hex"), "Payload CRC16", hexcrc.toString(16), " CALC", crc16xmodem(this.payload_buf).readUInt16BE().toString(16));
                return false;
            }
        }
    })
    .uint16le("magic_footer",/*{ assert:0xdf2d }* /);
*/

export function parseBinary(binary: Uint8Array): BeSmartFrame {
    let message = BeSmartFrame.deserialize(binary);
    //   if (!message.magic_header) throw new Error("Wrong Magic Header")
    //   if (!message.magic_footer) throw new Error("Wrong Magic Footer")
    return message;
}

export function colorHexPayload(payload: string): string {
    payload = payload.toUpperCase();

    let message = payload.substring(8);
    message =
        colorize.redBright(message.substring(0, 2)) + // cseq
        "|" + colorize.gray(message.substring(2, 4)) + // unk1
        "|" + colorize.gray(message.substring(4, 8)) + // unk2
        "|" + colorize.bgBlueBright(message.substring(8, 16)) + // deviceId
        "|" + message.substring(16).padEnd(2);

    payload =
        colorize.blue(payload.substring(0, 2)) + // MsgId
        "|" + colorize.gray(payload.substring(2, 4)) + // Flags
        "|" + colorize.yellow(payload.substring(4, 8)) + // MessageLenght
        "|" + colorize.italic(message); // Message 

    //console.log(hexdata, hexdata.length);
    return "|" + colorize.bold(payload); // Payload
}


export function colorHex(hexdata: string, header = true): string {

    hexdata = hexdata.toUpperCase();

    let message = hexdata.substring(16 + 8, hexdata.length - 8);
    const message_h = "sq|  |    | device |dt"
    message =
        colorize.redBright(message.substring(0, 2)) + // cseq
        "|" + colorize.gray(message.substring(2, 4)) + // unk1
        "|" + colorize.gray(message.substring(4, 8)) + // unk2
        "|" + colorize.bgBlueBright(message.substring(8, 16)) + // deviceId
        "|" + message.substring(16).padEnd(2);

    let payload = hexdata.substring(16, hexdata.length - 8);
    const payload_h = "id|fl| ml |"
    payload =
        colorize.blue(payload.substring(0, 2)) + // MsgId
        "|" + colorize.gray(payload.substring(2, 4)) + // Flags
        "|" + colorize.yellow(payload.substring(4, 8)) + // MessageLenght
        "|" + colorize.italic(message); // Message 

    //console.log(hexdata, hexdata.length);
    return (header ? "\n| mg | pl | sequen |" + (" payload".padEnd(hexdata.length - 1 - 16)) + "|crc |mgk |\n" +
        "| mg | pl | sequen |" + (payload_h + " message").padEnd(hexdata.length - 1 - 16) + "|crc |mgk |\n" +
        "| mg | pl | sequen |" + (payload_h + message_h).padEnd(hexdata.length - 1 - 16) + "|crc |mgk |\n" : "\n") +
        "|" + colorize.red(hexdata.substring(0, 4)) +// Magic
        "|" + colorize.yellow(hexdata.substring(4, 8)) + // Payload Lenght
        "|" + colorize.white(hexdata.substring(8, 16)) + // sequence
        "|" + colorize.bold(payload) + // Payload
        "|" + colorize.green(hexdata.substring(hexdata.length - 8, hexdata.length - 4)) + // CRC
        "|" + colorize.red(hexdata.substring(hexdata.length - 4)) +
        "|";
}





