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

var integration = require('@vanilla-extract/integration');

/**
 * This plugin marks all .css.ts/js files as having side effects. This is
 * to ensure that all usages of `globalStyle` are included in the CSS bundle,
 * even if a .css.ts/js file has no exports or is otherwise tree-shaken.
 */
const vanillaExtractSideEffectsPlugin = {
  name: "vanilla-extract-side-effects-plugin",
  setup(build) {
    let preventInfiniteLoop = {};
    build.onResolve({
      filter: /\.css(\.(j|t)sx?)?(\?.*)?$/,
      namespace: "file"
    }, async args => {
      if (args.pluginData === preventInfiniteLoop) {
        return null;
      }
      let resolvedPath = (await build.resolve(args.path, {
        resolveDir: args.resolveDir,
        kind: args.kind,
        pluginData: preventInfiniteLoop
      })).path;
      if (!integration.cssFileFilter.test(resolvedPath)) {
        return null;
      }
      return {
        path: resolvedPath,
        sideEffects: true
      };
    });
  }
};

exports.vanillaExtractSideEffectsPlugin = vanillaExtractSideEffectsPlugin;
