"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.repl = void 0;
const format_1 = require("@edge-runtime/format");
const repl_1 = __importDefault(require("repl"));
const edge_runtime_1 = require("../edge-runtime");
const format = (0, format_1.createFormat)();
const writer = (output) => {
    return typeof output === 'function' ? output.toString() : format(output);
};
const repl = repl_1.default.start({ prompt: 'ƒ => ', writer });
exports.repl = repl;
Object.getOwnPropertyNames(repl.context).forEach((mod) => delete repl.context[mod]);
const runtime = new edge_runtime_1.EdgeRuntime();
Object.getOwnPropertyNames(runtime.context)
    .filter((key) => !key.startsWith('__'))
    .forEach((key) => Object.assign(repl.context, { [key]: runtime.context[key] }));
Object.defineProperty(repl.context, 'EdgeRuntime', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: runtime.context.EdgeRuntime,
});
const nodeMajorVersion = parseInt(process.versions.node.split('.')[0]);
if (nodeMajorVersion < 16) {
    repl.context.util = {
        inspect: (...args) => {
            var _a;
            const stack = (_a = new Error().stack) !== null && _a !== void 0 ? _a : '';
            if (!stack.includes('internal/repl/utils.js')) {
                throw new Error('util.inspect is not available in Edge Runtime');
            }
            return format(...args).replace(/\n */g, ' ');
        },
    };
}
//# sourceMappingURL=repl.js.map