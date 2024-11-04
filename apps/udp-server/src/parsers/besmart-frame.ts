import { BitstreamElement, Field, Marker, VariantMarker, Variant, FieldRef, DeserializeOptions } from '@astronautlabs/bitstream';
import { crc16xmodem } from 'node-crc';

export enum BESMART_CMD {
    SET_MODE = 0x02,

    // 0x03    Unknown (from test probe: deviceid) (invalid)
    // 0x04    Unknown(from test probe: deviceid)(invalid)
    // 0x05    Unknown(from test probe: deviceid)(invalid)
    // 0x06    Unknown(from test probe: deviceid)(invalid)
    // 0x07    Unknown(from test probe: deviceid)(invalid)
    // 0x08    Unknown(from test probe: deviceid)(invalid)
    // 0x09    Unknown(from test probe: deviceid)(invalid)

    PROGRAM = 0x0A,

    SET_T3 = 0x0B,
    SET_T2 = 0x0C,
    SET_T1 = 0x0D,

    // 0x0e    Unknown(from test probe: deviceid, roomid)(invalid)
    // 0x0f    Unknown(from test probe: deviceid, long message with lots of 0x0  followed by lots of 0xff) Could this be OpenTherm parameters ?
    UNKNOWN_0x10 = 0x10,   // Unknown(from test probe: deviceid)(invalid)
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


export class BeSmartFrame extends BitstreamElement {
    @Field(16, { boolean: { true: 0xfad4, mode: 'false-unless' } }) magic_header!: boolean;
    @Field(16, { number: { byteOrder: "little-endian", format: 'unsigned' }/*, writtenValue: i => i.measure('$startOfPayload', '$endOfPayload')*/ }) payload_length!: number;
    @Field(32, { number: { byteOrder: "little-endian", format: 'unsigned' } }) sequence!: number;
    @Field(0, { isIgnored: true }) /*@Marker()*/ $startOfPayload!: any;
    //  @Field(i => i.payload_length * 8, { serializer: new BufferNullSerializer() }) payload: Buffer;
    @Field(8) msg_id!: number;
    @Field(1) is_response!: boolean;
    @Field(1) is_write!: boolean;
    @Field(1) is_valid!: boolean;
    @Field(1) is_downlink!: boolean;
    @Field(1) bit4!: boolean;
    @Field(1) sync_is_lost!: boolean;
    @Field(1) is_uplink!: boolean;
    @Field(1) bit7!: boolean;
    @Field(16, { number: { byteOrder: "little-endian", format: 'unsigned' } }) msg_length!: number
    @Field(8) cseq!: number;
    @Field(8) unk1!: number;  //", { assert: 0x00 })
    @Field(16, { number: { byteOrder: "little-endian", format: 'unsigned' } }) unk2!: number;
    @Field(32, { number: { byteOrder: "little-endian", format: 'unsigned' } }) device_id!: number;
    @Field(0, { isIgnored: true }) /*@Marker()*/ $startOfMessage!: any;
    @VariantMarker() $variant!: any;
    @Field(0, { isIgnored: true }) /*@Marker()*/ $endOfKnownVariant!: any;
    @Field({ array: { type: Number, elementLength: 8, count: (i) => (i.msg_length * 8 - i.measure('$startOfMessage', '$endOfKnownVariant')) / 8 } }) unknown_part!: number[];
    @Field(0, { isIgnored: true }) /*@Marker()*/ $endOfMessage!: any;
    @Field(0, { isIgnored: true }) /*@Marker()*/ $endOfPayload!: any;
    @Field(16, { number: { byteOrder: "little-endian", format: 'unsigned'/*, writtenValue: i => crc16xmodem(i.serialize(payload_buf)).readUInt16BE() */ } }) crc16!: number;
    @Field(16, { boolean: { true: 0x2ddf, mode: 'false-unless' } }) magic_footer!: boolean;

    /**
     * computeAndSerialize. Compute deived fields and serializze all fields or a subset of fields into a buffer.
     * @param fromRef The first field that should be serialized. If not specified, serialization begins at the start of
     *                  the element
     * @param toRef The last field that should be serialized. If not specified, serialization continues until the end of
     *                  the element
     * @param autoPad When true and the bitsize of a field is not a multiple of 8, the final byte will
     *                  contain zeros up to the next byte. When false (default), serialize() will throw
     *                  if the size is not a multiple of 8.
     */
    computeAndSerialize(fromRef?: FieldRef<this>, toRef?: FieldRef<this>, autoPad?: boolean): Uint8Array {
        // Compute!
        const payload_buf = Buffer.from(this.serialize().subarray(8, 8 + this.payload_length));
        this.crc16 = crc16xmodem(payload_buf).readUInt16BE();
        return super.serialize(fromRef, toRef, autoPad);
    }

    /**
     * Deserialize an instance of this class from the given
     * data buffer. Will consider available variants, so the
     * result could be a subclass.
     * @param data
     * @returns
     */
    static deserialize<T extends typeof BitstreamElement>(this: T, data: Uint8Array, options?: DeserializeOptions): InstanceType<T> {
        const obj = super.deserialize<typeof BeSmartFrame>(data, options);
        const payload_buf = Buffer.from(data.subarray(8, 8 + obj.payload_length));
        const crc16 = crc16xmodem(payload_buf).readUInt16BE();

        if (crc16 != obj.crc16) console.warn(`Wrong crc16 for payload`, obj)
        if (!obj.magic_header) console.warn(`Wrong MAGIC HEADER NUMBER for`, obj)
        if (!obj.magic_footer) console.warn(`Wrong MAGIC FOOTER NUMBER for`, obj)
        if (obj.constructor.name === 'BeSmartFrame') console.warn(`Uknown message 0x${obj.msg_id.toString(16)} MAGIC FOOTER NUMBER for`, obj)
        return obj as InstanceType<T>;
    }
}

@Variant(i => i.msg_id === BESMART_CMD.PING)
export class PingMessage extends BeSmartFrame {
    @Field(16, { number: { byteOrder: "little-endian", format: 'unsigned' } }) ping_unk1!: number;
}

@Variant(i => i.msg_id === BESMART_CMD.SWVERSION)
export class VersionMessage extends BeSmartFrame {
    @Field(i => i.msg_length) version!: string;
}

@Variant(i => i.msg_id === BESMART_CMD.STATUS && !i.is_write)
export class RequestStatusMessage extends BeSmartFrame {
    @Field(32, { number: { byteOrder: "little-endian", format: 'unsigned' } }) lastseen!: number;
}


export class RoomMessagePart extends BitstreamElement {
    @Field(32, { number: { byteOrder: "little-endian", format: 'unsigned' } }) room_id!: number;
    @Field(8, { boolean: { true: 0xF8, false: 0x83, mode: 'undefined' } }) is_heating!: boolean // 0x8F=yes 0x83=no
    @Field(4) room_unk1!: number
    @Field(4) mode!: number
    @Field(16, { number: { byteOrder: "little-endian", format: 'unsigned' }, transformers: { read: (v: number) => v / 10, write: (v: number) => v * 10 } }) temp!: number
    @Field(16, { number: { byteOrder: "little-endian", format: 'unsigned' }, transformers: { read: (v: number) => v / 10, write: (v: number) => v * 10 } }) set_temp!: number
    @Field(16, { number: { byteOrder: "little-endian", format: 'unsigned' }, transformers: { read: (v: number) => v / 10, write: (v: number) => v * 10 } }) t3!: number
    @Field(16, { number: { byteOrder: "little-endian", format: 'unsigned' }, transformers: { read: (v: number) => v / 10, write: (v: number) => v * 10 } }) t2!: number
    @Field(16, { number: { byteOrder: "little-endian", format: 'unsigned' }, transformers: { read: (v: number) => v / 10, write: (v: number) => v * 10 } }) t1!: number
    @Field(16, { number: { byteOrder: "little-endian", format: 'unsigned' } }) max_setpoint!: number
    @Field(16, { number: { byteOrder: "little-endian", format: 'unsigned' } }) min_setpoint!: number
    @Field(1) is_unk1!: boolean
    @Field(1) is_advance!: boolean
    @Field(1) is_unit_celsius!: boolean
    @Field(4) sensor_influence!: number
    @Field(1) is_unk2!: boolean
    @Field(1) is_winter!: boolean
    @Field(1) is_cmd_issued!: boolean
    @Field(1) is_boost!: boolean
    @Field(5) room_unk3!: number
    @Field(16, { number: { byteOrder: "little-endian", format: 'unsigned' } }) room_unk4!: number
    @Field(8) temp_curve!: number
    @Field(8) heating_setpoint!: number
}

@Variant(i => i.msg_id === BESMART_CMD.STATUS && i.is_write)
export class StatusMessage extends BeSmartFrame {

    @Field({ array: { type: RoomMessagePart, count: 8 } }) rooms!: RoomMessagePart[];

    // OpenTherm
    @Field(1) unkot0!: boolean;
    @Field(1) unkot1!: boolean;
    @Field(1) unkot2!: boolean;
    @Field(1) unkot3!: boolean;
    @Field(1) unkot4!: boolean;
    @Field(1) boiler_heating!: boolean;
    @Field(1) dhw_mode!: boolean;
    @Field(1) unkot7!: boolean;
    @Field(8, { number: { format: 'unsigned' } }) otFlags2!: number;

    @Field(16, { number: { byteOrder: "little-endian", format: 'signed' } }) otUnk1!: number;
    @Field(16, { number: { byteOrder: "little-endian", format: 'signed' } }) otUnk2!: number;
    @Field(16, { number: { byteOrder: "little-endian", format: 'signed' } }) tFLO!: number;
    @Field(16, { number: { byteOrder: "little-endian", format: 'signed' } }) otUnk4!: number;
    @Field(16, { number: { byteOrder: "little-endian", format: 'signed' } }) tdH!: number;
    @Field(16, { number: { byteOrder: "little-endian", format: 'signed' } }) tESt!: number;
    @Field(16, { number: { byteOrder: "little-endian", format: 'signed' } }) otUnk7!: number;
    @Field(16, { number: { byteOrder: "little-endian", format: 'signed' } }) otUnk8!: number;
    @Field(16, { number: { byteOrder: "little-endian", format: 'signed' } }) otUnk9!: number;
    @Field(16, { number: { byteOrder: "little-endian", format: 'signed' } }) otUnk10!: number;

    @Field(8, { number: { format: 'unsigned' } }) wifi_signal!: number;
    @Field(8, { number: { format: 'unsigned' } }) unk16!: number;
    @Field(16, { number: { byteOrder: "little-endian", format: 'unsigned' } }) unk17!: number;
    @Field(16, { number: { byteOrder: "little-endian", format: 'unsigned' } }) unk18!: number;
    @Field(16, { number: { byteOrder: "little-endian", format: 'unsigned' } }) unk19!: number;
    @Field(16, { number: { byteOrder: "little-endian", format: 'unsigned' } }) unk20!: number;
}

@Variant(i => i.msg_id === BESMART_CMD.GET_PROG)
export class GetProgramMessage extends BeSmartFrame {
    @Field(32, { number: { byteOrder: "little-endian", format: 'unsigned' } }) room_id!: number;

    @Field(32, { number: { byteOrder: "little-endian", format: 'unsigned' } }) get_prg_unk1!: number; /* assert: 0x800FE0 */
}

@Variant(i => i.msg_id === BESMART_CMD.PROGRAM)
export class ProgramMessage extends BeSmartFrame {
    @Field(32, { number: { byteOrder: "little-endian", format: 'unsigned' } }) room_id!: number;

    @Field(16, { number: { byteOrder: "little-endian", format: 'unsigned' } }) day!: number;

    @Field(24, { array: { type: Number, elementLength: 8 } }) hours!: number[];
}

@Variant(i => i.msg_id === BESMART_CMD.PROG_END)
export class ProgramEndMessage extends BeSmartFrame {
    @Field(32, { number: { byteOrder: "little-endian", format: 'unsigned' } }) room_id!: number;

    @Field(8, { number: { format: 'unsigned' } }) prgend_unk1!: number; /*{ assert: 0x0A14 }*/
    @Field(8, { number: { format: 'unsigned' } }) prgend_unk2!: number;
}

@Variant(i => i.msg_id === BESMART_CMD.UNKNOWN_0x10)
export class Unknown10Message extends BeSmartFrame {
    @Field(16, { number: { format: 'unsigned' } }) u10_unk1!: number;
}

@Variant(i => i.msg_id === BESMART_CMD.UNKNOWN_0x11)
export class Unknown11Message extends BeSmartFrame {
    @Field(8, { number: { format: 'unsigned' } }) u11_unk1!: number;
}

@Variant(i => i.msg_id === BESMART_CMD.DEVICE_TIME)
export class DeviceTimeMessage extends BeSmartFrame {
    @Field(8, { number: { format: 'unsigned' } }) dst!: number; /*{  // 0=no dst 1=dst }*/
    @Field(8, { number: { format: 'unsigned' } }) dt_unk2!: number;
    @Field(16, { number: { byteOrder: "little-endian", format: 'unsigned' } }) dt_unk3!: number;
}



// 6: new Parser()
//     .uint8("val") // 0=no dst 1=dst
//     .uint8("unk3")
//     .uint16le("unk4")
//     .uint16le("unk5"),
// 8: new Parser()
//     .uint8("val") // 0=no dst 1=dst
//     .uint8("unk3")
//     .uint16le("unk4")
//     .uint32le("unk5"), // ? Time
// 13: new Parser()
//     .uint8("val") // 0=no dst 1=dst
//     .uint8("unk3")
//     .uint16le("unk4")
//     .uint32le("unk5") // ? Time
//     .uint8("unk6")
//     .uint32le("unk7"),
// 30: new Parser()
//     .uint8("val") // 0=no dst 1=dst
//     .uint8("unk3")
//     .uint16le("unk4")
//     .uint32le("unk5")  // ? Time
//     .uint32le("unk6")
//     .uint32le("unk7")
//     .uint32le("unk8")
//     .uint32le("unk9")
//     .uint32le("unk10")
//     .uint16le("unk11"),

