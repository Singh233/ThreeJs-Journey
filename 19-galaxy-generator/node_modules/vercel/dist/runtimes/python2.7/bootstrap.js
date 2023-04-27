"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const child_process_1 = require("child_process");
const pythonBin = (0, path_1.join)(__dirname, 'bin', 'python');
const bootstrap = (0, path_1.join)(__dirname, '..', 'python', 'bootstrap.py');
(0, child_process_1.spawn)(pythonBin, [bootstrap], { stdio: 'inherit' });
//# sourceMappingURL=bootstrap.js.map