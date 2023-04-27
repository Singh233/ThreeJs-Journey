import type * as EdgePrimitives from '@edge-runtime/primitives';
import type { VMContext, VMOptions } from './vm';
import { VM } from './vm';
export interface EdgeVMOptions<T> {
    /**
     * Provide code generation options to the Node.js VM.
     * If you don't provide any option, code generation will be disabled.
     */
    codeGeneration?: VMOptions<T>['codeGeneration'];
    /**
     * Allows to extend the VMContext. Note that it must return a contextified
     * object so ideally it should return the same reference it receives.
     */
    extend?: (context: EdgeContext) => EdgeContext & T;
    /**
     * Provides an initial map to the require cache.
     * If none is given, it will be initialized to an empty map.
     */
    requireCache?: VMOptions<T>['requireCache'];
}
/**
 * An implementation of a VM that pre-loads on its context Edge Primitives.
 * The context can be extended from its constructor.
 */
export declare class EdgeVM<T extends EdgeContext> extends VM<T> {
    constructor(options?: EdgeVMOptions<T>);
}
export declare type EdgeContext = VMContext & {
    self: EdgeContext;
    globalThis: EdgeContext;
    AbortController: typeof EdgePrimitives.AbortController;
    AbortSignal: typeof EdgePrimitives.AbortSignal;
    atob: typeof EdgePrimitives.atob;
    Blob: typeof EdgePrimitives.Blob;
    btoa: typeof EdgePrimitives.btoa;
    Cache: typeof EdgePrimitives.Cache;
    caches: typeof EdgePrimitives.caches;
    CacheStorage: typeof EdgePrimitives.CacheStorage;
    console: typeof EdgePrimitives.console;
    createCaches: typeof EdgePrimitives.createCaches;
    crypto: typeof EdgePrimitives.crypto;
    Crypto: typeof EdgePrimitives.Crypto;
    CryptoKey: typeof EdgePrimitives.CryptoKey;
    DOMException: typeof EdgePrimitives.DOMException;
    Event: typeof EdgePrimitives.Event;
    EventTarget: typeof EdgePrimitives.EventTarget;
    fetch: typeof EdgePrimitives.fetch;
    FetchEvent: typeof EdgePrimitives.FetchEvent;
    File: typeof EdgePrimitives.File;
    FormData: typeof EdgePrimitives.FormData;
    Headers: typeof EdgePrimitives.Headers;
    PromiseRejectionEvent: typeof EdgePrimitives.PromiseRejectionEvent;
    ReadableStream: typeof EdgePrimitives.ReadableStream;
    ReadableStreamBYOBReader: typeof EdgePrimitives.ReadableStreamBYOBReader;
    ReadableStreamDefaultReader: typeof EdgePrimitives.ReadableStreamDefaultReader;
    Request: typeof EdgePrimitives.Request;
    Response: typeof EdgePrimitives.Response;
    structuredClone: typeof EdgePrimitives.structuredClone;
    SubtleCrypto: typeof EdgePrimitives.SubtleCrypto;
    TextDecoder: typeof EdgePrimitives.TextDecoder;
    TextEncoder: typeof EdgePrimitives.TextEncoder;
    TransformStream: typeof EdgePrimitives.TransformStream;
    URL: typeof EdgePrimitives.URL;
    URLPattern: typeof EdgePrimitives.URLPattern;
    URLSearchParams: typeof EdgePrimitives.URLSearchParams;
    WritableStream: typeof EdgePrimitives.WritableStream;
    WritableStreamDefaultWriter: typeof EdgePrimitives.WritableStreamDefaultWriter;
    EdgeRuntime: string;
};
