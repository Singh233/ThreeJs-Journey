"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const next_server_1 = __importDefault(require("next-server"));
const url_1 = __importDefault(require("url"));
if (!process.env.NODE_ENV) {
    const region = process.env.VERCEL_REGION || process.env.NOW_REGION;
    process.env.NODE_ENV = region === 'dev1' ? 'development' : 'production';
}
const app = (0, next_server_1.default)({});
module.exports = (req, res) => {
    const parsedUrl = url_1.default.parse(req.url || '', true);
    app.render(req, res, 'PATHNAME_PLACEHOLDER', parsedUrl.query, parsedUrl);
};
