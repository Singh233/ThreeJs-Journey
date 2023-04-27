/// <reference types="node" />
import type { IncomingMessage } from 'http';
declare type BodyStream = ReadableStream<Uint8Array>;
/**
 * An interface that encapsulates body stream cloning
 * of an incoming request.
 */
export declare function getClonableBodyStream<T extends IncomingMessage>(incomingMessage: T, KUint8Array: typeof Uint8Array, KTransformStream: typeof TransformStream): {
    /**
     * Replaces the original request body if necessary.
     * This is done because once we read the body from the original request,
     * we can't read it again.
     */
    finalize(): void;
    /**
     * Clones the body stream
     * to pass into a middleware
     */
    cloneBodyStream(): BodyStream;
};
/**
 * Creates an async iterator from a ReadableStream that ensures that every
 * emitted chunk is a `Uint8Array`. If there is some invalid chunk it will
 * throw.
 */
export declare function consumeUint8ArrayReadableStream(body?: ReadableStream): AsyncGenerator<Uint8Array, void, unknown>;
export {};
