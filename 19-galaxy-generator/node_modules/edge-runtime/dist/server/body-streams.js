"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consumeUint8ArrayReadableStream = exports.getClonableBodyStream = void 0;
const stream_1 = require("stream");
/**
 * An interface that encapsulates body stream cloning
 * of an incoming request.
 */
function getClonableBodyStream(incomingMessage, KUint8Array, KTransformStream) {
    let bufferedBodyStream = null;
    return {
        /**
         * Replaces the original request body if necessary.
         * This is done because once we read the body from the original request,
         * we can't read it again.
         */
        finalize() {
            if (bufferedBodyStream) {
                replaceRequestBody(incomingMessage, bodyStreamToNodeStream(bufferedBodyStream));
            }
        },
        /**
         * Clones the body stream
         * to pass into a middleware
         */
        cloneBodyStream() {
            const originalStream = bufferedBodyStream !== null && bufferedBodyStream !== void 0 ? bufferedBodyStream : requestToBodyStream(incomingMessage, KUint8Array, KTransformStream);
            const [stream1, stream2] = originalStream.tee();
            bufferedBodyStream = stream1;
            return stream2;
        },
    };
}
exports.getClonableBodyStream = getClonableBodyStream;
/**
 * Creates a ReadableStream from a Node.js HTTP request
 */
function requestToBodyStream(request, KUint8Array, KTransformStream) {
    const transform = new KTransformStream({
        start(controller) {
            request.on('data', (chunk) => controller.enqueue(new KUint8Array([...new Uint8Array(chunk)])));
            request.on('end', () => controller.terminate());
            request.on('error', (err) => controller.error(err));
        },
    });
    return transform.readable;
}
function bodyStreamToNodeStream(bodyStream) {
    const reader = bodyStream.getReader();
    return stream_1.Readable.from((async function* () {
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                return;
            }
            yield value;
        }
    })());
}
function replaceRequestBody(base, stream) {
    for (const key in stream) {
        let v = stream[key];
        if (typeof v === 'function') {
            v = v.bind(stream);
        }
        base[key] = v;
    }
    return base;
}
/**
 * Creates an async iterator from a ReadableStream that ensures that every
 * emitted chunk is a `Uint8Array`. If there is some invalid chunk it will
 * throw.
 */
async function* consumeUint8ArrayReadableStream(body) {
    var _a;
    const reader = body === null || body === void 0 ? void 0 : body.getReader();
    if (reader) {
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                return;
            }
            if (((_a = value === null || value === void 0 ? void 0 : value.constructor) === null || _a === void 0 ? void 0 : _a.name) !== 'Uint8Array') {
                throw new TypeError('This ReadableStream did not return bytes.');
            }
            yield value;
        }
    }
}
exports.consumeUint8ArrayReadableStream = consumeUint8ArrayReadableStream;
//# sourceMappingURL=body-streams.js.map