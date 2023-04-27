"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareCache = void 0;
const build_utils_1 = require("@vercel/build-utils");
const prepareCache = ({ repoRootPath, workPath }) => {
    return (0, build_utils_1.glob)('**/node_modules/**', repoRootPath || workPath);
};
exports.prepareCache = prepareCache;
//# sourceMappingURL=prepare-cache.js.map