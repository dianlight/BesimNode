import { BitstreamElement, Field, Marker, VariantMarker, ReservedLow, Variant, FieldRef, DeserializeOptions } from '@astronautlabs/bitstream';
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


export class BeSmartFrame extends BitstreamElement {
    @Field(16, { boolean: { true: 0xfad4, mode: 'false-unless' } }) magic_header!: boolean;
    @Field(16, { number: { byteOrder: "little-endian", format: 'unsigned' }/*, writtenValue: i => i.measure('$startOfPayload', '$endOfPayload')*/ }) payload_length!: number;
    @Field(32, { number: { byteOrder: "little-endian", format: 'unsigned' } }) sequence!: number;
    @Marker() $startOfPayload!: any;
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
    @Marker() $startOfMessage!: any;
    //@Field(i => i.msg_length * 8) message: Buffer;
    @Field(8) cseq!: number;
    @Field(8) unk1!: number;  //", { assert: 0x00 })
    @Field(16, { number: { byteOrder: "little-endian", format: 'unsigned' } }) unk2!: number;
    @Field(32, { number: { byteOrder: "little-endian", format: 'unsigned' } }) device_id!: number;
    @VariantMarker() $variant!: any;
    @Marker() $endOfMessage!: any;
    @Marker() $endOfPayload!: any;
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
        const payload_buf = Buffer.from(obj.serialize().subarray(8, 8 + obj.payload_length));
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
    @Field(13, { presentWhen: i => i.is_response }) version!: string;
}

@Variant(i => i.msg_id === BESMART_CMD.STATUS)
export class StatusMessage extends BeSmartFrame {
    @Field(32, { presentWhen: i => !i.is_response, number: { byteOrder: "little-endian", format: 'unsigned' } }) lastseen!: number;
}

@Variant(i => i.msg_id === BESMART_CMD.PROG_END)
export class ProgramEndMessage extends BeSmartFrame {
    @Field(32, { number: { byteOrder: "little-endian", format: 'unsigned' } }) room!: number;

    @Field(8, { number: { format: 'unsigned' } }) prgend_unk1!: number; /*{ assert: 0x0A14 }*/
    @Field(8, { number: { format: 'unsigned' } }) prgend_unk2!: number;
}
