"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBuildOutput = exports.readConfig = exports.getBuildOutputDirectory = void 0;
const path_1 = require("path");
const fs_1 = require("fs");
const BUILD_OUTPUT_DIR = '.vercel/output';
/**
 * Returns the path to the Build Output API v3 directory when the
 * `config.json` file was created by the framework / build script,
 * or `undefined` if the framework did not create the v3 output.
 */
async function getBuildOutputDirectory(path) {
    try {
        const outputDir = path_1.join(path, BUILD_OUTPUT_DIR);
        const configPath = path_1.join(outputDir, 'config.json');
        await fs_1.promises.stat(configPath);
        return outputDir;
    }
    catch (err) {
        if (err.code !== 'ENOENT')
            throw err;
    }
    return undefined;
}
exports.getBuildOutputDirectory = getBuildOutputDirectory;
async function readConfig(path) {
    try {
        const outputDir = path_1.join(path, BUILD_OUTPUT_DIR);
        const configPath = path_1.join(outputDir, 'config.json');
        return JSON.parse(await fs_1.promises.readFile(configPath, 'utf8'));
    }
    catch (err) {
        if (err.code !== 'ENOENT')
            throw err;
    }
    return undefined;
}
exports.readConfig = readConfig;
function createBuildOutput(meta, buildCommand, buildOutputPath, framework) {
    if (meta.isDev) {
        let buildCommandName;
        if (buildCommand)
            buildCommandName = `"${buildCommand}"`;
        else if (framework)
            buildCommandName = framework.name;
        else
            buildCommandName = 'the "build" script';
        throw new Error(`Detected Build Output v3 from ${buildCommandName}, but it is not supported for \`vercel dev\`. Please set the Development Command in your Project Settings.`);
    }
    return {
        buildOutputVersion: 3,
        buildOutputPath,
    };
}
exports.createBuildOutput = createBuildOutput;
