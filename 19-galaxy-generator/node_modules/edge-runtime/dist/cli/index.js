#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const edge_runtime_1 = require("../edge-runtime");
const util_1 = require("util");
const fs_1 = require("fs");
const server_1 = require("../server");
const child_process_1 = __importDefault(require("child_process"));
const exit_hook_1 = __importDefault(require("exit-hook"));
const mri_1 = __importDefault(require("mri"));
const path_1 = __importDefault(require("path"));
const { _: input, ...flags } = (0, mri_1.default)(process.argv.slice(2), {
    alias: {
        e: 'eval',
        h: 'help',
        l: 'listen',
        p: 'port',
    },
    default: {
        cwd: process.cwd(),
        help: false,
        listen: false,
        port: 3000,
        repl: false,
        eval: false,
    },
});
async function main() {
    if (flags.help) {
        const { help } = await Promise.resolve().then(() => __importStar(require('./help')));
        console.log(help());
        return;
    }
    if (flags.eval) {
        const { inlineEval } = await Promise.resolve().then(() => __importStar(require('./eval')));
        console.log(await inlineEval(input[0]));
        return;
    }
    /**
     * If there is no script path to run a server, the CLI will start a REPL.
     */
    const [scriptPath] = input;
    if (!scriptPath) {
        const replPath = path_1.default.resolve(__dirname, 'repl.js');
        return (0, util_1.promisify)(child_process_1.default.spawn).call(null, 'node', [replPath], {
            stdio: 'inherit',
        });
    }
    const initialCode = (0, fs_1.readFileSync)(path_1.default.resolve(process.cwd(), scriptPath), 'utf-8');
    const runtime = new edge_runtime_1.EdgeRuntime({ initialCode });
    if (!flags.listen)
        return runtime.evaluate('');
    const logger = await Promise.resolve().then(() => __importStar(require('./logger'))).then(({ createLogger }) => createLogger());
    logger.debug(`v${String(require('../../package.json').version)} at Node.js ${process.version}`);
    /**
     * Start a server with the script provided in the file path.
     */
    const server = await (0, server_1.runServer)({
        logger: logger,
        port: flags.port,
        runtime,
    });
    (0, exit_hook_1.default)(() => server.close());
    logger(`Waiting incoming requests at ${logger.quotes(server.url)}`);
}
main().catch((error) => {
    if (!(error instanceof Error))
        error = new Error(error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map