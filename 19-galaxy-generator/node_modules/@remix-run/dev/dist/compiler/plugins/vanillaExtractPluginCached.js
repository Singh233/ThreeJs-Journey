/**
 * @remix-run/dev v1.15.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var path = require('path');
var integration = require('@vanilla-extract/integration');
var loaders = require('../loaders.js');
var postcss = require('../utils/postcss.js');
var vanillaExtractSideEffectsPlugin = require('./vanillaExtractSideEffectsPlugin.js');

const pluginName = "vanilla-extract-plugin-cached";
const namespace = `${pluginName}-ns`;
const virtualCssFileFilter = /\.vanilla.css$/;
const staticAssetRegexp = new RegExp(`(${Object.keys(loaders.loaders).filter(ext => ext !== ".css" && loaders.loaders[ext] === "file").join("|")})$`);
let compiler;
function vanillaExtractPluginCached({
  config,
  mode,
  outputCss
}) {
  return {
    name: pluginName,
    async setup(build) {
      let root = config.appDirectory;
      compiler = compiler || integration.createCompiler({
        root,
        identifiers: mode === "production" ? "short" : "debug",
        vitePlugins: [{
          name: "remix-assets",
          enforce: "pre",
          async resolveId(source) {
            // Handle root-relative imports within Vanilla Extract files
            if (source.startsWith("~")) {
              return await this.resolve(source.replace("~", ""));
            }
            // Handle static asset JS imports
            if (source.startsWith("/") && staticAssetRegexp.test(source)) {
              return {
                external: true,
                id: "~" + source
              };
            }
          },
          transform(code) {
            // Translate Vite's fs import format for root-relative imports
            return code.replace(/\/@fs\/~\//g, "~/");
          }
        }]
      });
      let postcssProcessor = await postcss.getPostcssProcessor({
        config,
        context: {
          vanillaExtract: true
        }
      });

      // Resolve virtual CSS files first to avoid resolving the same
      // file multiple times since this filter is more specific and
      // doesn't require a file system lookup.
      build.onResolve({
        filter: virtualCssFileFilter
      }, args => {
        return {
          path: args.path,
          namespace
        };
      });
      vanillaExtractSideEffectsPlugin.vanillaExtractSideEffectsPlugin.setup(build);
      build.onLoad({
        filter: virtualCssFileFilter,
        namespace
      }, async ({
        path: path$1
      }) => {
        let [relativeFilePath] = path$1.split(".vanilla.css");
        let {
          css,
          filePath
        } = compiler.getCssForFile(relativeFilePath);
        let resolveDir = path.dirname(path.resolve(root, filePath));
        if (postcssProcessor) {
          css = (await postcssProcessor.process(css, {
            from: path$1,
            to: path$1
          })).css;
        }
        return {
          contents: css,
          loader: "css",
          resolveDir
        };
      });
      build.onLoad({
        filter: integration.cssFileFilter
      }, async ({
        path: filePath
      }) => {
        let {
          source,
          watchFiles
        } = await compiler.processVanillaFile(filePath, {
          outputCss
        });
        return {
          contents: source,
          resolveDir: path.dirname(filePath),
          loader: "js",
          watchFiles: (Array.from(watchFiles) || []).map(watchFile => watchFile.startsWith("~") ? path.resolve(root, watchFile.replace("~", ".")) : watchFile)
        };
      });
    }
  };
}

exports.vanillaExtractPluginCached = vanillaExtractPluginCached;
