/*eslint-disable block-scoped-var, no-redeclare, no-control-regex, no-prototype-builtins*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const twirper = $root.twirper = (() => {

    /**
     * Namespace twirper.
     * @exports twirper
     * @namespace
     */
    const twirper = {};

    twirper.Twirper = (function() {

        /**
         * Constructs a new Twirper service.
         * @memberof twirper
         * @classdesc Represents a Twirper
         * @extends $protobuf.rpc.Service
         * @constructor
         * @param {$protobuf.RPCImpl} rpcImpl RPC implementation
         * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
         * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
         */
        function Twirper(rpcImpl, requestDelimited, responseDelimited) {
            $protobuf.rpc.Service.call(this, rpcImpl, requestDelimited, responseDelimited);
        }

        (Twirper.prototype = Object.create($protobuf.rpc.Service.prototype)).constructor = Twirper;

        /**
         * Creates new Twirper service using the specified rpc implementation.
         * @function create
         * @memberof twirper.Twirper
         * @static
         * @param {$protobuf.RPCImpl} rpcImpl RPC implementation
         * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
         * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
         * @returns {Twirper} RPC service. Useful where requests and/or responses are streamed.
         */
        Twirper.create = function create(rpcImpl, requestDelimited, responseDelimited) {
            return new this(rpcImpl, requestDelimited, responseDelimited);
        };

        /**
         * Callback as used by {@link twirper.Twirper#Echo}.
         * @memberof twirper.Twirper
         * @typedef EchoCallback
         * @type {function}
         * @param {Error|null} error Error, if any
         * @param {twirper.EchoReq} [response] EchoReq
         */

        /**
         * Calls Echo.
         * @function Echo
         * @memberof twirper.Twirper
         * @instance
         * @param {twirper.IEchoReq} request EchoReq message or plain object
         * @param {twirper.Twirper.EchoCallback} callback Node-style callback called with the error, if any, and EchoReq
         * @returns {undefined}
         * @variation 1
         */
        Object.defineProperty(Twirper.prototype.Echo = function Echo(request, callback) {
            return this.rpcCall(Echo, $root.twirper.EchoReq, $root.twirper.EchoReq, request, callback);
        }, "name", { value: "Echo" });

        /**
         * Calls Echo.
         * @function Echo
         * @memberof twirper.Twirper
         * @instance
         * @param {twirper.IEchoReq} request EchoReq message or plain object
         * @returns {Promise<twirper.EchoReq>} Promise
         * @variation 2
         */

        return Twirper;
    })();

    twirper.EchoReq = (function() {

        /**
         * Properties of an EchoReq.
         * @memberof twirper
         * @interface IEchoReq
         * @property {string|null} [Message] EchoReq Message
         */

        /**
         * Constructs a new EchoReq.
         * @memberof twirper
         * @classdesc Represents an EchoReq.
         * @implements IEchoReq
         * @constructor
         * @param {twirper.IEchoReq=} [properties] Properties to set
         */
        function EchoReq(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * EchoReq Message.
         * @member {string} Message
         * @memberof twirper.EchoReq
         * @instance
         */
        EchoReq.prototype.Message = "";

        /**
         * Creates a new EchoReq instance using the specified properties.
         * @function create
         * @memberof twirper.EchoReq
         * @static
         * @param {twirper.IEchoReq=} [properties] Properties to set
         * @returns {twirper.EchoReq} EchoReq instance
         */
        EchoReq.create = function create(properties) {
            return new EchoReq(properties);
        };

        /**
         * Encodes the specified EchoReq message. Does not implicitly {@link twirper.EchoReq.verify|verify} messages.
         * @function encode
         * @memberof twirper.EchoReq
         * @static
         * @param {twirper.IEchoReq} message EchoReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        EchoReq.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.Message != null && message.hasOwnProperty("Message"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.Message);
            return writer;
        };

        /**
         * Encodes the specified EchoReq message, length delimited. Does not implicitly {@link twirper.EchoReq.verify|verify} messages.
         * @function encodeDelimited
         * @memberof twirper.EchoReq
         * @static
         * @param {twirper.IEchoReq} message EchoReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        EchoReq.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an EchoReq message from the specified reader or buffer.
         * @function decode
         * @memberof twirper.EchoReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {twirper.EchoReq} EchoReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        EchoReq.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.twirper.EchoReq();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.Message = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an EchoReq message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof twirper.EchoReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {twirper.EchoReq} EchoReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        EchoReq.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an EchoReq message.
         * @function verify
         * @memberof twirper.EchoReq
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        EchoReq.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.Message != null && message.hasOwnProperty("Message"))
                if (!$util.isString(message.Message))
                    return "Message: string expected";
            return null;
        };

        /**
         * Creates an EchoReq message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof twirper.EchoReq
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {twirper.EchoReq} EchoReq
         */
        EchoReq.fromObject = function fromObject(object) {
            if (object instanceof $root.twirper.EchoReq)
                return object;
            let message = new $root.twirper.EchoReq();
            if (object.Message != null)
                message.Message = String(object.Message);
            return message;
        };

        /**
         * Creates a plain object from an EchoReq message. Also converts values to other types if specified.
         * @function toObject
         * @memberof twirper.EchoReq
         * @static
         * @param {twirper.EchoReq} message EchoReq
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        EchoReq.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults)
                object.Message = "";
            if (message.Message != null && message.hasOwnProperty("Message"))
                object.Message = message.Message;
            return object;
        };

        /**
         * Converts this EchoReq to JSON.
         * @function toJSON
         * @memberof twirper.EchoReq
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        EchoReq.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return EchoReq;
    })();

    return twirper;
})();

export { $root as default };
