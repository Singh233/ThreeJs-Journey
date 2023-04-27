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
var esbuild = require('esbuild');
var fse = require('fs-extra');
var nodeModulesPolyfill = require('@esbuild-plugins/node-modules-polyfill');
var invariant = require('../invariant.js');
var loaders = require('./loaders.js');
var cssModulesPlugin = require('./plugins/cssModulesPlugin.js');
var cssSideEffectImportsPlugin = require('./plugins/cssSideEffectImportsPlugin.js');
var vanillaExtractPlugin = require('./plugins/vanillaExtractPlugin.js');
var cssFilePlugin = require('./plugins/cssFilePlugin.js');
var deprecatedRemixPackagePlugin = require('./plugins/deprecatedRemixPackagePlugin.js');
var emptyModulesPlugin = require('./plugins/emptyModulesPlugin.js');
var mdx = require('./plugins/mdx.js');
var serverAssetsManifestPlugin = require('./plugins/serverAssetsManifestPlugin.js');
var serverBareModulesPlugin = require('./plugins/serverBareModulesPlugin.js');
var serverEntryModulePlugin = require('./plugins/serverEntryModulePlugin.js');
var serverRouteModulesPlugin = require('./plugins/serverRouteModulesPlugin.js');
var urlImportsPlugin = require('./plugins/urlImportsPlugin.js');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n["default"] = e;
  return Object.freeze(n);
}

var path__namespace = /*#__PURE__*/_interopNamespace(path);
var esbuild__namespace = /*#__PURE__*/_interopNamespace(esbuild);
var fse__namespace = /*#__PURE__*/_interopNamespace(fse);

const createEsbuildConfig = (config, assetsManifestChannel, outfile, routes, options) => {
  let stdin;
  let entryPoints;
  if (config.serverEntryPoint) {
    entryPoints = [config.serverEntryPoint];
  } else {
    stdin = {
      contents: config.serverBuildTargetEntryModule,
      resolveDir: config.rootDirectory,
      loader: "ts"
    };
  }
  let {
    mode
  } = options;
  let outputCss = false;
  let plugins = [deprecatedRemixPackagePlugin.deprecatedRemixPackagePlugin(options.onWarning), config.future.unstable_cssModules ? cssModulesPlugin.cssModulesPlugin({
    config,
    mode,
    outputCss
  }) : null, config.future.unstable_vanillaExtract ? vanillaExtractPlugin.vanillaExtractPlugin({
    config,
    mode,
    outputCss
  }) : null, config.future.unstable_cssSideEffectImports ? cssSideEffectImportsPlugin.cssSideEffectImportsPlugin({
    config,
    options
  }) : null, cssFilePlugin.cssFilePlugin({
    config,
    options
  }), urlImportsPlugin.urlImportsPlugin(), mdx.mdxPlugin(config), emptyModulesPlugin.emptyModulesPlugin(config, /\.client(\.[jt]sx?)?$/), serverRouteModulesPlugin.serverRouteModulesPlugin(config, routes), serverEntryModulePlugin.serverEntryModulePlugin(config, routes, {
    liveReloadPort: options.liveReloadPort
  }), serverAssetsManifestPlugin.serverAssetsManifestPlugin(assetsManifestChannel.read(), routes), serverBareModulesPlugin.serverBareModulesPlugin(config, process.cwd(), options.onWarning)].filter(isNotNull);
  if (config.serverPlatform !== "node") {
    plugins.unshift(nodeModulesPolyfill.NodeModulesPolyfillPlugin());
  }
  return {
    absWorkingDir: config.rootDirectory,
    stdin,
    entryPoints,
    outfile,
    conditions: config.serverConditions,
    platform: config.serverPlatform,
    format: config.serverModuleFormat,
    treeShaking: true,
    // The type of dead code elimination we want to do depends on the
    // minify syntax property: https://github.com/evanw/esbuild/issues/672#issuecomment-1029682369
    // Dev builds are leaving code that should be optimized away in the
    // bundle causing server / testing code to be shipped to the browser.
    // These are properly optimized away in prod builds today, and this
    // PR makes dev mode behave closer to production in terms of dead
    // code elimination / tree shaking is concerned.
    minifySyntax: true,
    minify: options.mode === "production" && config.serverMinify,
    mainFields: config.serverMainFields,
    target: options.target,
    loader: loaders.loaders,
    bundle: true,
    logLevel: "silent",
    // As pointed out by https://github.com/evanw/esbuild/issues/2440, when tsconfig is set to
    // `undefined`, esbuild will keep looking for a tsconfig.json recursively up. This unwanted
    // behavior can only be avoided by creating an empty tsconfig file in the root directory.
    tsconfig: config.tsconfigPath,
    sourcemap: options.sourcemap,
    // use linked (true) to fix up .map file
    // The server build needs to know how to generate asset URLs for imports
    // of CSS and other files.
    assetNames: "_assets/[name]-[hash]",
    publicPath: config.publicPath,
    define: {
      "process.env.NODE_ENV": JSON.stringify(options.mode),
      "process.env.REMIX_DEV_SERVER_WS_PORT": JSON.stringify(config.devServerPort)
    },
    jsx: "automatic",
    jsxDev: options.mode !== "production",
    plugins
  };
};
async function writeServerBuildResult(config, serverBuildPath, outputFiles) {
  await fse__namespace.ensureDir(path__namespace.dirname(serverBuildPath));
  for (let file of outputFiles) {
    if (file.path.endsWith(".js")) {
      // fix sourceMappingURL to be relative to current path instead of /build
      let filename = file.path.substring(file.path.lastIndexOf(path__namespace.sep) + 1);
      let escapedFilename = filename.replace(/\./g, "\\.");
      let pattern = `(//# sourceMappingURL=)(.*)${escapedFilename}`;
      let contents = Buffer.from(file.contents).toString("utf-8");
      contents = contents.replace(new RegExp(pattern), `$1${filename}`);
      await fse__namespace.writeFile(file.path, contents);
    } else if (file.path.endsWith(".map")) {
      // Don't write CSS source maps to server build output
      if (file.path.endsWith(".css.map")) {
        break;
      }

      // remove route: prefix from source filenames so breakpoints work
      let contents = Buffer.from(file.contents).toString("utf-8");
      contents = contents.replace(/"route:/gm, '"');
      await fse__namespace.writeFile(file.path, contents);
    } else {
      let assetPath = path__namespace.join(config.assetsBuildDirectory, file.path.replace(path__namespace.dirname(serverBuildPath), ""));

      // Don't write CSS bundle from server build to browser assets directory,
      // especially since the file name doesn't contain a content hash
      if (assetPath === path__namespace.join(config.assetsBuildDirectory, "index.css")) {
        break;
      }
      await fse__namespace.ensureDir(path__namespace.dirname(assetPath));
      await fse__namespace.writeFile(assetPath, file.contents);
    }
  }
}
const createServerCompiler = (remixConfig, options) => {
  let compile = async (manifestChannel, outfile = remixConfig.serverBuildPath, routes = remixConfig.routes) => {
    let esbuildConfig = createEsbuildConfig(remixConfig, manifestChannel, outfile, routes, options);
    let {
      metafile,
      outputFiles
    } = await esbuild__namespace.build({
      ...esbuildConfig,
      write: false,
      metafile: true
    });
    invariant["default"](metafile, "Expected metafile to be defined.");
    await writeServerBuildResult(remixConfig, outfile, outputFiles);
    return metafile;
  };
  let compileBundles = manifestChannel => {
    if (remixConfig.serverBundles) {
      return remixConfig.serverBundles.map(({
        serverBuildPath,
        routes
      }) => compile(manifestChannel, serverBuildPath, routes));
    }
    return [compile(manifestChannel)];
  };
  return {
    compile,
    compileBundles,
    dispose: () => undefined
  };
};
function isNotNull(value) {
  return value !== null;
}

exports.createServerCompiler = createServerCompiler;
