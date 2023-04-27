"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServerlessEventHandler = void 0;
const launcher_js_1 = require("@vercel/node-bridge/launcher.js");
function rawBody(readable) {
    return new Promise((resolve, reject) => {
        let bytes = 0;
        const chunks = [];
        readable.on('error', reject);
        readable.on('data', chunk => {
            chunks.push(chunk);
            bytes += chunk.length;
        });
        readable.on('end', () => {
            resolve(Buffer.concat(chunks, bytes));
        });
    });
}
async function createServerlessEventHandler(entrypoint, options) {
    const launcher = launcher_js_1.getVercelLauncher({
        entrypointPath: entrypoint,
        helpersPath: './helpers.js',
        shouldAddHelpers: options.shouldAddHelpers,
        useRequire: options.useRequire,
        // not used
        bridgePath: '',
        sourcemapSupportPath: '',
    });
    const bridge = launcher();
    return async function (request) {
        const body = await rawBody(request);
        const event = {
            Action: 'Invoke',
            body: JSON.stringify({
                method: request.method,
                path: request.url,
                headers: request.headers,
                encoding: 'base64',
                body: body.toString('base64'),
            }),
        };
        return bridge.launcher(event, {
            callbackWaitsForEmptyEventLoop: false,
        });
    };
}
exports.createServerlessEventHandler = createServerlessEventHandler;
