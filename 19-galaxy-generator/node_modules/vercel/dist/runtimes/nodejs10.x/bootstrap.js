"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const child_process_1 = require("child_process");
const nodeBin = (0, path_1.join)(__dirname, 'bin', 'node');
const bootstrap = (0, path_1.join)(__dirname, '..', 'nodejs', 'bootstrap.js');
(0, child_process_1.spawn)(nodeBin, [bootstrap], { stdio: 'inherit' });
//# sourceMappingURL=bootstrap.js.map