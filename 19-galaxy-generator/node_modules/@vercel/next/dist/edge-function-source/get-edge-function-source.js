"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextjsEdgeFunctionSource = void 0;
const fs_extra_1 = require("fs-extra");
const webpack_sources_1 = require("webpack-sources");
const sourcemapped_1 = require("../sourcemapped");
const path_1 = require("path");
const constants_1 = require("./constants");
const zlib_1 = __importDefault(require("zlib"));
const util_1 = require("util");
const utils_1 = require("../utils");
// @ts-expect-error this is a prebuilt file, based on `../../scripts/build-edge-function-template.js`
const ___get_nextjs_edge_function_js_1 = __importDefault(require("../../dist/___get-nextjs-edge-function.js"));
const gzip = (0, util_1.promisify)(zlib_1.default.gzip);
/**
 * Allows to get the source code for a Next.js Edge Function where the output
 * is defined by a set of filePaths that compose all chunks. Those will write
 * to a global namespace _ENTRIES. The Next.js parameters will allow to adapt
 * the function into the core Edge Function signature.
 *
 * @param filePaths Array of relative file paths for the function chunks.
 * @param params Next.js parameters to adapt it to core edge functions.
 * @param outputDir The output directory the files in `filePaths` stored in.
 * @returns The source code of the edge function.
 */
async function getNextjsEdgeFunctionSource(filePaths, params, outputDir, wasm) {
    const chunks = new webpack_sources_1.ConcatSource((0, sourcemapped_1.raw)(`let _ENTRIES = {};`));
    for (const filePath of filePaths) {
        const fullFilePath = (0, path_1.join)(outputDir, filePath);
        const content = await (0, fs_extra_1.readFile)(fullFilePath, 'utf8');
        chunks.add((0, sourcemapped_1.raw)(`\n/**/;`));
        chunks.add(await (0, sourcemapped_1.fileToSource)(content, filePath, fullFilePath));
    }
    const text = chunks.source();
    /**
     * We validate at this point because we want to verify against user code.
     * It should not count the Worker wrapper nor the Next.js wrapper.
     */
    const wasmFiles = (wasm ?? []).map(({ filePath }) => (0, path_1.join)(outputDir, filePath));
    await validateSize(text, wasmFiles);
    // Wrap to fake module.exports
    const getPageMatchCode = `(function () {
    const module = { exports: {}, loaded: false };
    const fn = (function(module,exports) {${___get_nextjs_edge_function_js_1.default}\n});
    fn(module, module.exports);
    return module.exports;
  })`;
    return (0, sourcemapped_1.sourcemapped) `
  ${(0, sourcemapped_1.raw)(getWasmImportStatements(wasm))}
  ${chunks};
  export default ${(0, sourcemapped_1.raw)(getPageMatchCode)}.call({}).default(
    ${(0, sourcemapped_1.raw)(JSON.stringify(params))}
  )`;
}
exports.getNextjsEdgeFunctionSource = getNextjsEdgeFunctionSource;
function getWasmImportStatements(wasm = []) {
    return wasm
        .filter(({ name }) => name.startsWith('wasm_'))
        .map(({ name }) => {
        const pathname = `/wasm/${name}.wasm`;
        return `const ${name} = require(${JSON.stringify(pathname)});`;
    })
        .join('\n');
}
async function validateSize(script, wasmFiles) {
    const buffers = [Buffer.from(script, 'utf8')];
    for (const filePath of wasmFiles) {
        buffers.push(await (0, fs_extra_1.readFile)(filePath));
    }
    const content = Buffer.concat(buffers);
    const gzipped = await gzip(content);
    if (gzipped.length > constants_1.EDGE_FUNCTION_SIZE_LIMIT) {
        throw new Error(`Exceeds maximum edge function size: ${(0, utils_1.prettyBytes)(gzipped.length)} / ${(0, utils_1.prettyBytes)(constants_1.EDGE_FUNCTION_SIZE_LIMIT)}`);
    }
}
