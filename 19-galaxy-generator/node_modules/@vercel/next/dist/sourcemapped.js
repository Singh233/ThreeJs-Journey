"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringifySourceMap = exports.fileToSource = exports.raw = exports.sourcemapped = void 0;
const convert_source_map_1 = __importDefault(require("convert-source-map"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const webpack_sources_1 = require("webpack-sources");
/**
 * A template literal tag that preserves existing source maps, if any. This
 * allows to compose multiple sources and preserve the source maps, so we can
 * resolve the correct line numbers in the stack traces later on.
 *
 * @param strings The string literals.
 * @param sources All the sources that may optionally have source maps. Use
 * `raw` to pass a string that should be inserted raw (with no source map
 * attached).
 */
function sourcemapped(strings, ...sources) {
    const concat = new webpack_sources_1.ConcatSource();
    for (let i = 0; i < Math.max(strings.length, sources.length); i++) {
        const string = strings[i];
        const source = sources[i];
        if (string)
            concat.add(raw(string));
        if (source)
            concat.add(source);
    }
    return concat;
}
exports.sourcemapped = sourcemapped;
/**
 * A helper to create a Source from a string with no source map.
 * This allows to obfuscate the source code from the user and print `[native code]`
 * when resolving the stack trace.
 */
function raw(value) {
    return new webpack_sources_1.OriginalSource(value, '[native code]');
}
exports.raw = raw;
/**
 * Takes a file with contents and tries to extract its source maps it will
 * first try to use a `${fullFilePath}.map` file if it exists. Then, it will
 * try to use the inline source map comment.
 *
 * @param content The file contents.
 * @param sourceName the name of the source.
 * @param fullFilePath The full path to the file.
 */
async function fileToSource(content, sourceName, fullFilePath) {
    const sourcemap = await getSourceMap(content, fullFilePath);
    const cleanContent = convert_source_map_1.default.removeComments(content);
    return sourcemap
        ? new webpack_sources_1.SourceMapSource(cleanContent, sourceName, sourcemap)
        : new webpack_sources_1.OriginalSource(cleanContent, sourceName);
}
exports.fileToSource = fileToSource;
/**
 * Finds a source map for a given content and file path. First it will try to
 * use a `${fullFilePath}.map` file if it exists. Then, it will try to use
 * the inline source map comment.
 */
async function getSourceMap(content, fullFilePath) {
    try {
        if (fullFilePath && (await fs_extra_1.default.pathExists(`${fullFilePath}.map`))) {
            const mapJson = await fs_extra_1.default.readFile(`${fullFilePath}.map`, 'utf8');
            return convert_source_map_1.default.fromJSON(mapJson).toObject();
        }
        return convert_source_map_1.default.fromComment(content).toObject();
    }
    catch {
        return null;
    }
}
/**
 * Stringifies a source map, removing unnecessary data:
 * * `sourcesContent` is not needed to trace back frames.
 */
function stringifySourceMap(sourceMap) {
    if (!sourceMap)
        return;
    const obj = typeof sourceMap === 'object'
        ? { ...sourceMap }
        : convert_source_map_1.default.fromJSON(sourceMap).toObject();
    delete obj.sourcesContent;
    return JSON.stringify(obj);
}
exports.stringifySourceMap = stringifySourceMap;
