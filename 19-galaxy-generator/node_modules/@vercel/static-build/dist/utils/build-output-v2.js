"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBuildOutput = exports.readBuildOutputDirectory = exports.getBuildOutputDirectory = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = require("fs-extra");
const build_utils_1 = require("@vercel/build-utils");
const _shared_1 = require("./_shared");
const ts_morph_1 = require("ts-morph");
const static_config_1 = require("@vercel/static-config");
const BUILD_OUTPUT_DIR = '.output';
const BRIDGE_MIDDLEWARE_V2_TO_V3 = `


// appended to convert v2 middleware to v3 middleware
export default async (request) => {
  const { response } = await _ENTRIES['middleware_pages/_middleware'].default({ request });
  return response;
}
`;
const CONFIG_FILES = [
    'build-manifest.json',
    'functions-manifest.json',
    'images-manifest.json',
    'prerender-manifest.json',
    'routes-manifest.json',
];
/**
 * Returns the path to the Build Output API v2 directory when any
 * relevant config file was created by the framework / build script,
 * or `undefined` if the framework did not create the v2 output.
 */
async function getBuildOutputDirectory(workingDir) {
    const outputDir = path_1.default.join(workingDir, BUILD_OUTPUT_DIR);
    // check for one of several config files
    const finderPromises = CONFIG_FILES.map(configFile => {
        return fs_extra_1.pathExists(path_1.default.join(outputDir, configFile));
    });
    const finders = await Promise.all(finderPromises);
    if (finders.some(found => found)) {
        return outputDir;
    }
    return undefined;
}
exports.getBuildOutputDirectory = getBuildOutputDirectory;
/**
 * Reads the BUILD_OUTPUT_DIR directory and returns and object
 * that should be merged with the build outputs.
 */
async function readBuildOutputDirectory({ workPath, }) {
    // Functions are not supported, but are used to support Middleware
    const functions = {};
    // Routes are not supported, but are used to support Middleware
    const routes = [];
    const middleware = await getMiddleware(workPath);
    if (middleware) {
        routes.push(middleware.route);
        functions['middleware'] = new build_utils_1.EdgeFunction({
            deploymentTarget: 'v8-worker',
            entrypoint: '_middleware.js',
            files: {
                '_middleware.js': middleware.file,
            },
            name: 'middleware',
            regions: (() => {
                try {
                    const project = new ts_morph_1.Project();
                    const config = static_config_1.getConfig(project, middleware.file.fsPath);
                    return config?.regions;
                }
                catch (err) {
                    return undefined;
                }
            })(),
        });
    }
    const staticFiles = await readStaticFiles({ workPath });
    const outputs = {
        staticFiles: _shared_1.isObjectEmpty(staticFiles) ? null : staticFiles,
        functions: _shared_1.isObjectEmpty(functions) ? null : functions,
        routes: routes.length ? routes : null,
    };
    if (outputs.functions) {
        build_utils_1.debug(`Detected Serverless Functions in "${BUILD_OUTPUT_DIR}"`);
    }
    if (outputs.staticFiles) {
        build_utils_1.debug(`Detected Static Assets in "${BUILD_OUTPUT_DIR}"`);
    }
    if (outputs.routes) {
        build_utils_1.debug(`Detected Routes Configuration in "${BUILD_OUTPUT_DIR}"`);
    }
    return outputs;
}
exports.readBuildOutputDirectory = readBuildOutputDirectory;
async function getMiddleware(workPath) {
    const manifestPath = path_1.default.join(workPath, BUILD_OUTPUT_DIR, 'functions-manifest.json');
    try {
        const manifest = await fs_extra_1.readJson(manifestPath);
        if (manifest.pages['_middleware.js'].runtime !== 'web') {
            return;
        }
    }
    catch (error) {
        if (error.code !== 'ENOENT')
            throw error;
        return;
    }
    const middlewareRelativePath = path_1.default.join(BUILD_OUTPUT_DIR, 'server/pages/_middleware.js');
    const middlewareAbsoluatePath = path_1.default.join(workPath, middlewareRelativePath);
    await fs_extra_1.appendFile(middlewareAbsoluatePath, BRIDGE_MIDDLEWARE_V2_TO_V3);
    const route = {
        src: '/(.*)',
        middlewarePath: 'middleware',
        continue: true,
    };
    return {
        route,
        file: new build_utils_1.FileFsRef({
            fsPath: middlewareRelativePath,
        }),
    };
}
async function readStaticFiles({ workPath, }) {
    const staticFilePath = path_1.default.join(workPath, BUILD_OUTPUT_DIR, 'static');
    const staticFiles = await build_utils_1.glob('**', {
        cwd: staticFilePath,
    });
    return staticFiles;
}
async function createBuildOutput(workPath) {
    let output = {};
    const routes = [];
    const extraOutputs = await readBuildOutputDirectory({
        workPath,
    });
    if (extraOutputs.routes) {
        routes.push(...extraOutputs.routes);
    }
    if (extraOutputs.staticFiles) {
        output = Object.assign({}, extraOutputs.staticFiles, extraOutputs.functions);
    }
    return { routes, output };
}
exports.createBuildOutput = createBuildOutput;
