"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readBuildOutputConfig = exports.readBuildOutputDirectory = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const build_utils_1 = require("@vercel/build-utils");
const _shared_1 = require("./_shared");
const VERCEL_BUILD_OUTPUT = '.vercel_build_output';
/**
 * Reads the .vercel_build_output directory and returns and object
 * that should be merged with the build outputs.
 */
async function readBuildOutputDirectory({ workPath, nodeVersion, }) {
    const functions = await readFunctions({
        workPath,
        functionsMountPath: path_1.default.join('.vercel', 'functions'),
        nodeVersion,
    });
    const staticFiles = await readStaticFiles({ workPath });
    const routes = (await readBuildOutputConfig({
        workPath,
        configFileName: 'routes.json',
    })) || [];
    const images = await readBuildOutputConfig({
        workPath,
        configFileName: 'images.json',
    });
    const build = await readBuildOutputConfig({
        workPath,
        configFileName: 'build.json',
    });
    const outputs = {
        staticFiles: _shared_1.isObjectEmpty(staticFiles) ? null : staticFiles,
        functions: _shared_1.isObjectEmpty(functions) ? null : functions,
        routes: routes.length ? routes : null,
        images,
        build,
    };
    if (outputs.functions) {
        console.log(`Detected Serverless Functions in "${VERCEL_BUILD_OUTPUT}"`);
    }
    if (outputs.staticFiles) {
        console.log(`Detected Static Assets in "${VERCEL_BUILD_OUTPUT}"`);
    }
    if (outputs.routes) {
        console.log(`Detected Routes Configuration in "${VERCEL_BUILD_OUTPUT}"`);
    }
    if (outputs.images) {
        console.log(`Detected Images Configuration in "${VERCEL_BUILD_OUTPUT}"`);
    }
    if (outputs.build) {
        console.log(`Detected Build Configuration in "${VERCEL_BUILD_OUTPUT}"`);
    }
    return outputs;
}
exports.readBuildOutputDirectory = readBuildOutputDirectory;
async function readStaticFiles({ workPath, }) {
    const staticFilePath = path_1.default.join(workPath, VERCEL_BUILD_OUTPUT, 'static');
    const staticFiles = await build_utils_1.glob('**', {
        cwd: staticFilePath,
    });
    return staticFiles;
}
async function readFunctions({ workPath, functionsMountPath, nodeVersion, }) {
    const output = {};
    const functionsConfig = await readFunctionsConfig({ workPath });
    // Find all entrypoints and create a Lambda for each of them.
    let functionsPath = path_1.default.join(workPath, VERCEL_BUILD_OUTPUT, 'functions');
    let functionEntrypoints = await build_utils_1.glob('*/index{,.*}', { cwd: functionsPath });
    let isLegacyFunctions = false;
    // To not break existing projects, we have to keep supporting the `functions/node` folder.
    if (!Object.keys(functionEntrypoints).length) {
        functionsPath = path_1.default.join(functionsPath, 'node');
        functionEntrypoints = await build_utils_1.glob('*/index.{js,mjs}', {
            cwd: functionsPath,
        });
        isLegacyFunctions = true;
    }
    for (const entrypointFile of Object.keys(functionEntrypoints)) {
        let lambda;
        const functionName = path_1.default.dirname(entrypointFile);
        const lambdaConfig = functionsConfig.get(functionName) || {};
        const { runtime, handler, ...config } = lambdaConfig;
        const lambdaFiles = await build_utils_1.glob('**', {
            cwd: path_1.default.join(functionsPath, functionName),
        });
        if (!lambdaConfig.runtime && isLegacyFunctions) {
            // The bridge and launcher is only added for legacy functions.
            lambda = new build_utils_1.NodejsLambda({
                files: lambdaFiles,
                handler: path_1.default.basename(entrypointFile),
                runtime: nodeVersion.runtime,
                ...config,
                shouldAddHelpers: false,
                shouldAddSourcemapSupport: false,
            });
        }
        else {
            if (!runtime) {
                throw new Error(`Missing the \`runtime\` property for the function \`${functionName}\`.`);
            }
            if (!handler) {
                throw new Error(`Missing the \`handler\` property for the function \`${functionName}\`.`);
            }
            lambda = new build_utils_1.Lambda({
                files: lambdaFiles,
                ...config,
                handler,
                runtime,
            });
        }
        /**
         * For legacy functions we have to keep the `<name>/index` structure,
         * for new functions we'll just use `<name>`, as there is no need to
         * further nest it.
         */
        const parsed = path_1.default.parse(entrypointFile);
        const newPath = isLegacyFunctions
            ? path_1.default.join(functionsMountPath, parsed.dir, parsed.name)
            : path_1.default.join(functionsMountPath, functionName);
        output[newPath] = lambda;
        build_utils_1.debug(`Created Lambda "${newPath}" from "${path_1.default.join(functionsPath, entrypointFile)}".`);
    }
    return output;
}
/**
 * Reads the global configuration file for functions and checks its types.
 */
async function readFunctionsConfig({ workPath }) {
    const data = await fs_1.promises
        .readFile(path_1.default.join(workPath, VERCEL_BUILD_OUTPUT, 'config', 'functions.json'), 'utf8')
        .then(raw => {
        try {
            return JSON.parse(raw);
        }
        catch (_error) {
            return null;
        }
    })
        .catch(error => {
        if (error.code === 'ENOENT') {
            return null;
        }
        throw error;
    });
    const config = new Map();
    if (!data) {
        return config;
    }
    Object.keys(data).forEach(key => {
        const fnConf = parseFunctionConfig(data[key]);
        if (fnConf)
            config.set(key, fnConf);
    });
    return config;
}
function parseFunctionConfig(data) {
    if (!data) {
        return null;
    }
    const config = {};
    if (typeof data.memory === 'number') {
        config.memory = data.memory;
    }
    if (typeof data.maxDuration === 'number') {
        config.maxDuration = data.maxDuration;
    }
    // In case of a custom runtime, a custom handler has to be provided.
    if (typeof data.runtime === 'string' && typeof data.handler === 'string') {
        config.runtime = data.runtime;
        config.handler = data.handler;
    }
    if (Array.isArray(data.regions) &&
        data.regions.every(r => typeof r === 'string')) {
        config.regions = data.regions;
    }
    return config;
}
async function readBuildOutputConfig({ workPath, configFileName, }) {
    const configPath = path_1.default.join(workPath, VERCEL_BUILD_OUTPUT, 'config', configFileName);
    try {
        return JSON.parse(await fs_1.promises.readFile(configPath, 'utf8'));
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            return undefined;
        }
        throw error;
    }
}
exports.readBuildOutputConfig = readBuildOutputConfig;
