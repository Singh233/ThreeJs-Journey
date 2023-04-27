"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const semver_1 = __importDefault(require("semver"));
const utils_1 = require("./utils");
function getCustomData(importName, target) {
    return `
// @ts-nocheck
module.exports = function(...args) {
  let original = require('./${importName}');

  const finalConfig = {};
  const target = { target: '${target}' };

  if (typeof original === 'function' && original.constructor.name === 'AsyncFunction') {
    // AsyncFunctions will become promises
    original = original(...args);
  }

  if (original instanceof Promise) {
    // Special case for promises, as it's currently not supported
    // and will just error later on
    return original
      .then((orignalConfig) => Object.assign(finalConfig, orignalConfig))
      .then((config) => Object.assign(config, target));
  } else if (typeof original === 'function') {
    Object.assign(finalConfig, original(...args));
  } else if (typeof original === 'object') {
    Object.assign(finalConfig, original);
  }

  Object.assign(finalConfig, target);

  return finalConfig;
}
  `.trim();
}
function getDefaultData(target) {
    return `
// @ts-nocheck
module.exports = { target: '${target}' };
  `.trim();
}
async function createServerlessConfig(workPath, entryPath, nextVersion) {
    let target = 'serverless';
    if (nextVersion) {
        try {
            if (semver_1.default.gte(nextVersion, utils_1.ExperimentalTraceVersion)) {
                target = 'experimental-serverless-trace';
            }
        }
        catch (_ignored
        // eslint-disable-next-line
        ) { }
    }
    const primaryConfigPath = path_1.default.join(entryPath, 'next.config.js');
    const secondaryConfigPath = path_1.default.join(workPath, 'next.config.js');
    const backupConfigName = `next.config.__vercel_builder_backup__.js`;
    const hasPrimaryConfig = fs_extra_1.default.existsSync(primaryConfigPath);
    const hasSecondaryConfig = fs_extra_1.default.existsSync(secondaryConfigPath);
    let configPath;
    let backupConfigPath;
    if (hasPrimaryConfig) {
        // Prefer primary path
        configPath = primaryConfigPath;
        backupConfigPath = path_1.default.join(entryPath, backupConfigName);
    }
    else if (hasSecondaryConfig) {
        // Work with secondary path (some monorepo setups)
        configPath = secondaryConfigPath;
        backupConfigPath = path_1.default.join(workPath, backupConfigName);
    }
    else {
        // Default to primary path for creation
        configPath = primaryConfigPath;
        backupConfigPath = path_1.default.join(entryPath, backupConfigName);
    }
    if (fs_extra_1.default.existsSync(configPath)) {
        await fs_extra_1.default.rename(configPath, backupConfigPath);
        await fs_extra_1.default.writeFile(configPath, getCustomData(backupConfigName, target));
    }
    else {
        await fs_extra_1.default.writeFile(configPath, getDefaultData(target));
    }
    return target;
}
exports.default = createServerlessConfig;
