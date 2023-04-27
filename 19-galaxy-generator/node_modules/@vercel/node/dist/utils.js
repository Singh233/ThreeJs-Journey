"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEdgeRuntime = exports.EdgeRuntimes = exports.logError = exports.entrypointToOutputPath = exports.getRegExpFromMatchers = void 0;
const path_1 = require("path");
const path_to_regexp_1 = require("path-to-regexp");
const build_utils_1 = require("@vercel/build-utils");
function getRegExpFromMatchers(matcherOrMatchers) {
    if (!matcherOrMatchers) {
        return '^/.*$';
    }
    const matchers = Array.isArray(matcherOrMatchers)
        ? matcherOrMatchers
        : [matcherOrMatchers];
    const regExps = matchers.flatMap(getRegExpFromMatcher).join('|');
    return regExps;
}
exports.getRegExpFromMatchers = getRegExpFromMatchers;
function getRegExpFromMatcher(matcher, index, allMatchers) {
    if (typeof matcher !== 'string') {
        throw new Error("Middleware's `config.matcher` must be a path matcher (string) or an array of path matchers (string[])");
    }
    if (!matcher.startsWith('/')) {
        throw new Error(`Middleware's \`config.matcher\` values must start with "/". Received: ${matcher}`);
    }
    const regExps = [path_to_regexp_1.pathToRegexp(matcher).source];
    if (matcher === '/' && !allMatchers.includes('/index')) {
        regExps.push(path_to_regexp_1.pathToRegexp('/index').source);
    }
    return regExps;
}
/**
 * If `zeroConfig`:
 *   "api/foo.js" -> "api/foo.js"
 *   "api/foo.ts" -> "api/foo.ts"
 *
 * If *NOT* `zeroConfig`:
 *   "api/foo.js" -> "api/foo"
 *   "api/foo.ts" -> "api/foo"
 */
function entrypointToOutputPath(entrypoint, zeroConfig) {
    if (zeroConfig) {
        const ext = path_1.extname(entrypoint);
        return entrypoint.slice(0, entrypoint.length - ext.length);
    }
    return entrypoint;
}
exports.entrypointToOutputPath = entrypointToOutputPath;
function logError(error) {
    console.error(error.message);
    if (error.stack) {
        // only show the stack trace if debug is enabled
        // because it points to internals, not user code
        const errorPrefixLength = 'Error: '.length;
        const errorMessageLength = errorPrefixLength + error.message.length;
        build_utils_1.debug(error.stack.substring(errorMessageLength + 1));
    }
}
exports.logError = logError;
var EdgeRuntimes;
(function (EdgeRuntimes) {
    EdgeRuntimes["Edge"] = "edge";
    EdgeRuntimes["ExperimentalEdge"] = "experimental-edge";
})(EdgeRuntimes = exports.EdgeRuntimes || (exports.EdgeRuntimes = {}));
function isEdgeRuntime(runtime) {
    return (runtime !== undefined &&
        Object.values(EdgeRuntimes).includes(runtime));
}
exports.isEdgeRuntime = isEdgeRuntime;
