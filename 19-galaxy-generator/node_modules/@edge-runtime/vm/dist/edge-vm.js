"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EdgeVM = void 0;
const buffer_1 = require("buffer");
const require_1 = require("./require");
const vm_1 = require("./vm");
const vm_2 = require("vm");
/**
 * An implementation of a VM that pre-loads on its context Edge Primitives.
 * The context can be extended from its constructor.
 */
class EdgeVM extends vm_1.VM {
    constructor(options = {}) {
        super({
            ...options,
            extend: (context) => {
                return options.extend
                    ? options.extend(addPrimitives(context))
                    : addPrimitives(context);
            },
        });
    }
}
exports.EdgeVM = EdgeVM;
function addPrimitives(context) {
    defineProperty(context, 'self', { enumerable: true, value: context });
    defineProperty(context, 'globalThis', { value: context });
    defineProperty(context, 'Symbol', { value: Symbol });
    defineProperty(context, 'clearInterval', { value: clearInterval });
    defineProperty(context, 'clearTimeout', { value: clearTimeout });
    defineProperty(context, 'setInterval', { value: setInterval });
    defineProperty(context, 'setTimeout', { value: setTimeout });
    defineProperty(context, 'EdgeRuntime', { value: 'edge-runtime' });
    // Console
    defineProperties(context, {
        exports: (0, require_1.requireWithCache)({
            context,
            path: require.resolve('@edge-runtime/primitives/console'),
            scopedContext: { console },
        }),
        nonenumerable: ['console'],
    });
    const encodings = (0, require_1.requireWithCache)({
        context,
        path: require.resolve('@edge-runtime/primitives/encoding'),
        scopedContext: { Buffer: buffer_1.Buffer, global: {} },
    });
    // Encoding APIs
    defineProperties(context, {
        exports: encodings,
        nonenumerable: ['atob', 'btoa', 'TextEncoder', 'TextDecoder'],
    });
    const streams = (0, require_1.requireWithCache)({
        path: require.resolve('@edge-runtime/primitives/streams'),
        context,
    });
    // Streams
    defineProperties(context, {
        exports: streams,
        nonenumerable: [
            'ReadableStream',
            'ReadableStreamBYOBReader',
            'ReadableStreamDefaultReader',
            'TransformStream',
            'WritableStream',
            'WritableStreamDefaultWriter',
        ],
    });
    const abort = (0, require_1.requireWithCache)({
        context,
        path: require.resolve('@edge-runtime/primitives/abort-controller'),
    });
    // AbortController
    defineProperties(context, {
        exports: abort,
        nonenumerable: ['AbortController', 'AbortSignal', 'DOMException'],
    });
    // URL
    defineProperties(context, {
        exports: (0, require_1.requireWithCache)({
            cache: new Map([['punycode', { exports: require('punycode') }]]),
            context,
            path: require.resolve('@edge-runtime/primitives/url'),
            scopedContext: {
                TextEncoder: encodings.TextEncoder,
                TextDecoder: encodings.TextDecoder,
            },
        }),
        nonenumerable: ['URL', 'URLSearchParams', 'URLPattern'],
    });
    const blob = (0, require_1.requireWithCache)({
        context,
        path: require.resolve('@edge-runtime/primitives/blob'),
    });
    // Blob
    defineProperties(context, {
        exports: blob,
        nonenumerable: ['Blob'],
    });
    const webFetch = (0, require_1.requireWithCache)({
        context,
        cache: new Map([
            ['abort-controller', { exports: abort }],
            ['assert', { exports: require('assert') }],
            ['buffer', { exports: require('buffer') }],
            ['events', { exports: require('events') }],
            ['http', { exports: require('http') }],
            ['net', { exports: require('net') }],
            ['perf_hooks', { exports: require('perf_hooks') }],
            ['querystring', { exports: require('querystring') }],
            ['stream', { exports: require('stream') }],
            ['tls', { exports: require('tls') }],
            ['util', { exports: require('util') }],
            ['zlib', { exports: require('zlib') }],
            [
                require.resolve('@edge-runtime/primitives/streams'),
                { exports: streams },
            ],
            [require.resolve('@edge-runtime/primitives/blob'), { exports: blob }],
        ]),
        path: require.resolve('@edge-runtime/primitives/fetch'),
        scopedContext: {
            Uint8Array: createUint8ArrayForContext(context),
            Buffer: buffer_1.Buffer,
            global: {},
            queueMicrotask,
            setImmediate,
            clearImmediate,
        },
    });
    // Fetch APIs
    defineProperties(context, {
        exports: webFetch,
        nonenumerable: [
            'fetch',
            'File',
            'FormData',
            'Headers',
            'Request',
            'Response',
        ],
    });
    // Cache
    defineProperties(context, {
        exports: (0, require_1.requireWithCache)({
            cache: new Map([
                [
                    require.resolve('@edge-runtime/primitives/fetch'),
                    { exports: webFetch },
                ],
            ]),
            context,
            path: require.resolve('@edge-runtime/primitives/cache'),
            scopedContext: { global: {} },
        }),
        enumerable: ['caches'],
        nonenumerable: ['Cache', 'CacheStorage'],
    });
    // Crypto
    defineProperties(context, {
        exports: (0, require_1.requireWithCache)({
            context,
            cache: new Map([
                ['crypto', { exports: require('crypto') }],
                ['process', { exports: require('process') }],
            ]),
            path: require.resolve('@edge-runtime/primitives/crypto'),
            scopedContext: {
                Buffer: buffer_1.Buffer,
                Uint8Array: createUint8ArrayForContext(context),
            },
        }),
        enumerable: ['crypto'],
        nonenumerable: ['Crypto', 'CryptoKey', 'SubtleCrypto'],
    });
    // Events
    defineProperties(context, {
        exports: (0, require_1.requireWithCache)({
            context,
            path: require.resolve('@edge-runtime/primitives/events'),
        }),
        nonenumerable: [
            'Event',
            'EventTarget',
            'FetchEvent',
            'PromiseRejectionEvent',
        ],
    });
    // Structured Clone
    defineProperties(context, {
        exports: (0, require_1.requireWithCache)({
            context,
            path: require.resolve('@edge-runtime/primitives/structured-clone'),
        }),
        nonenumerable: ['structuredClone'],
    });
    return context;
}
function defineProperty(obj, prop, attrs) {
    var _a, _b, _c;
    Object.defineProperty(obj, prop, {
        configurable: (_a = attrs.configurable) !== null && _a !== void 0 ? _a : false,
        enumerable: (_b = attrs.enumerable) !== null && _b !== void 0 ? _b : false,
        value: attrs.value,
        writable: (_c = attrs.writable) !== null && _c !== void 0 ? _c : true,
    });
}
function defineProperties(context, options) {
    var _a, _b;
    for (const property of (_a = options.enumerable) !== null && _a !== void 0 ? _a : []) {
        if (!options.exports[property]) {
            throw new Error(`Attempt to export a nullable value for "${property}"`);
        }
        defineProperty(context, property, {
            enumerable: true,
            value: options.exports[property],
        });
    }
    for (const property of (_b = options.nonenumerable) !== null && _b !== void 0 ? _b : []) {
        if (!options.exports[property]) {
            throw new Error(`Attempt to export a nullable value for "${property}"`);
        }
        defineProperty(context, property, {
            value: options.exports[property],
        });
    }
}
function createUint8ArrayForContext(context) {
    return new Proxy((0, vm_2.runInContext)('Uint8Array', context), {
        // on every construction (new Uint8Array(...))
        construct(target, args) {
            // construct it
            const value = new target(...args);
            // if this is not a buffer
            if (!(args[0] instanceof buffer_1.Buffer)) {
                // return what we just constructed
                return value;
            }
            // if it is a buffer, then we spread the binary data into an array,
            // and build the Uint8Array from that
            return new target([...value]);
        },
    });
}
//# sourceMappingURL=edge-vm.js.map