"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EdgeRuntime = void 0;
const vm_1 = require("@edge-runtime/vm");
/**
 * Store handlers that the user defined from code so that we can invoke them
 * from the Node.js realm.
 */
let unhandledRejectionHandlers;
let uncaughtExceptionHandlers;
/**
 * An EdgeVM that also allows to add and remove event listeners for unhandled
 * rejections and FetchEvent. It also allows to dispatch fetch events which
 * enables it to work behind a server.
 */
class EdgeRuntime extends vm_1.EdgeVM {
    constructor(options) {
        super({
            ...options,
            extend: (context) => {
                var _a, _b;
                return (_b = (_a = options === null || options === void 0 ? void 0 : options.extend) === null || _a === void 0 ? void 0 : _a.call(options, context)) !== null && _b !== void 0 ? _b : context;
            },
        });
        defineHandlerProps({
            object: this,
            setterName: '__onUnhandledRejectionHandler',
            setter: (handlers) => (unhandledRejectionHandlers = handlers),
            getterName: '__rejectionHandlers',
            getter: () => unhandledRejectionHandlers,
        });
        defineHandlerProps({
            object: this,
            setterName: '__onErrorHandler',
            setter: (handlers) => (uncaughtExceptionHandlers = handlers),
            getterName: '__errorHandlers',
            getter: () => uncaughtExceptionHandlers,
        });
        this.evaluate(getDefineEventListenersCode());
        this.dispatchFetch = this.evaluate(getDispatchFetchCode());
        if (options === null || options === void 0 ? void 0 : options.initialCode) {
            this.evaluate(options.initialCode);
        }
    }
}
exports.EdgeRuntime = EdgeRuntime;
/**
 * Define system-level handlers to make sure that we report to the user
 * whenever there is an unhandled rejection or exception before the process crashes.
 */
process.on('unhandledRejection', function invokeRejectionHandlers(reason, promise) {
    unhandledRejectionHandlers === null || unhandledRejectionHandlers === void 0 ? void 0 : unhandledRejectionHandlers.forEach((handler) => handler({ reason, promise }));
});
process.on('uncaughtException', function invokeErrorHandlers(error) {
    uncaughtExceptionHandlers === null || uncaughtExceptionHandlers === void 0 ? void 0 : uncaughtExceptionHandlers.forEach((handler) => handler(error));
});
/**
 * Generates polyfills for addEventListener and removeEventListener. It keeps
 * all listeners in hidden property __listeners. It will also call a hook
 * `__onUnhandledRejectionHandler` and `__onErrorHandler` when unhandled rejection
 * events are added or removed and prevent from having more than one FetchEvent
 * handler.
 */
function getDefineEventListenersCode() {
    return `
    Object.defineProperty(self, '__listeners', {
      configurable: false,
      enumerable: false,
      value: {},
      writable: true,
    })

    function __conditionallyUpdatesHandlerList(eventType) {
      if (eventType === 'unhandledrejection') {
        self.__onUnhandledRejectionHandler = self.__listeners[eventType];
      } else if (eventType === 'error') {
        self.__onErrorHandler = self.__listeners[eventType];
      }
    }

    function addEventListener(type, handler) {
      const eventType = type.toLowerCase();
      if (eventType === 'fetch' && self.__listeners.fetch) {
        throw new TypeError('You can register just one "fetch" event listener');
      }

      self.__listeners[eventType] = self.__listeners[eventType] || [];
      self.__listeners[eventType].push(handler);
      __conditionallyUpdatesHandlerList(eventType);
    }

    function removeEventListener(type, handler) {
      const eventType = type.toLowerCase();
      if (self.__listeners[eventType]) {
        self.__listeners[eventType] = self.__listeners[eventType].filter(item => {
          return item !== handler;
        });

        if (self.__listeners[eventType].length === 0) {
          delete self.__listeners[eventType];
        }
      }
      __conditionallyUpdatesHandlerList(eventType);
    }
  `;
}
/**
 * Generates the code to dispatch a FetchEvent invoking the handlers defined
 * for such events. In case there is no event handler defined it will throw
 * an error.
 */
function getDispatchFetchCode() {
    return `(async function dispatchFetch(input, init) {
    const request = new Request(input, init);
    const event = new FetchEvent(request);
    if (!self.__listeners.fetch) {
      throw new Error("No fetch event listeners found");
    }

    const getResponse = ({ response, error }) => {
     if (error || !response || !(response instanceof Response)) {
        console.error(error ? error.toString() : 'The event listener did not respond')
        response = new Response(null, {
          statusText: 'Internal Server Error',
          status: 500
        })
      }

      response.waitUntil = () => Promise.all(event.awaiting);

      if (response.status < 300 || response.status >= 400 ) {
        response.headers.delete('content-encoding');
        response.headers.delete('transform-encoding');
        response.headers.delete('content-length');
      }

      return response;
    }

    try {
      await self.__listeners.fetch[0].call(event, event)
    } catch (error) {
      return getResponse({ error })
    }

    return Promise.resolve(event.response)
      .then(response => getResponse({ response }))
      .catch(error => getResponse({ error }))
  })`;
}
/**
 * Defines a readable property on the VM and the corresponding writable property
 * on the VM's context. These properties are not enumerable nor updatable.
 */
function defineHandlerProps({ object: instance, setterName, setter: setter, getterName, getter, }) {
    Object.defineProperty(instance.context, setterName, {
        set: setter,
        configurable: false,
        enumerable: false,
    });
    Object.defineProperty(instance, getterName, {
        get: getter,
        configurable: false,
        enumerable: false,
    });
}
//# sourceMappingURL=edge-runtime.js.map