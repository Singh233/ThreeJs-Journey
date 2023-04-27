import type { DispatchFetch } from './types';
import type { EdgeVMOptions, EdgeContext } from '@edge-runtime/vm';
import { EdgeVM } from '@edge-runtime/vm';
interface Options<T extends EdgeContext> extends EdgeVMOptions<T> {
    /**
     * Code to be evaluated as the VM for the Runtime is created. This is handy
     * to run code directly instead of first creating the runtime and then
     * evaluating.
     */
    initialCode?: string;
}
/**
 * An EdgeVM that also allows to add and remove event listeners for unhandled
 * rejections and FetchEvent. It also allows to dispatch fetch events which
 * enables it to work behind a server.
 */
export declare class EdgeRuntime<T extends EdgeContext = EdgeContext> extends EdgeVM<T> {
    readonly dispatchFetch: DispatchFetch;
    constructor(options?: Options<T>);
}
export {};
