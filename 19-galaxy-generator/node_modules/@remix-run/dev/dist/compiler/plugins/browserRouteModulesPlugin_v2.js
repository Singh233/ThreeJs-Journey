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

var fs = require('node:fs');
var path = require('node:path');
var generate = require('@babel/generator');
var invariant = require('../../invariant.js');
var create = require('../../transform/create.js');
var loaders = require('../loaders.js');
var routeExports = require('../routeExports.js');
var hmrPlugin = require('./hmrPlugin.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

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

var fs__namespace = /*#__PURE__*/_interopNamespace(fs);
var path__namespace = /*#__PURE__*/_interopNamespace(path);
var generate__default = /*#__PURE__*/_interopDefaultLegacy(generate);

const serverOnlyExports = new Set(["action", "loader"]);
let removeServerExports = onLoader => create.create(({
  types: t
}) => {
  return {
    visitor: {
      ExportNamedDeclaration: path => {
        let {
          node
        } = path;
        if (node.source) {
          let specifiers = node.specifiers.filter(({
            exported
          }) => {
            let name = t.isIdentifier(exported) ? exported.name : exported.value;
            return !serverOnlyExports.has(name);
          });
          if (specifiers.length === node.specifiers.length) return;
          if (specifiers.length === 0) return path.remove();
          path.replaceWith(t.exportNamedDeclaration(node.declaration, specifiers, node.source));
        }
        if (t.isFunctionDeclaration(node.declaration)) {
          var _node$declaration$id;
          let name = (_node$declaration$id = node.declaration.id) === null || _node$declaration$id === void 0 ? void 0 : _node$declaration$id.name;
          if (!name) return;
          if (name === "loader") {
            let {
              code
            } = generate__default["default"](node);
            onLoader(code);
          }
          if (serverOnlyExports.has(name)) return path.remove();
        }
        if (t.isVariableDeclaration(node.declaration)) {
          let declarations = node.declaration.declarations.filter(d => {
            let name = t.isIdentifier(d.id) ? d.id.name : undefined;
            if (!name) return false;
            if (name === "loader") {
              let {
                code
              } = generate__default["default"](node);
              onLoader(code);
            }
            return !serverOnlyExports.has(name);
          });
          if (declarations.length === 0) return path.remove();
          if (declarations.length === node.declaration.declarations.length) return;
          path.replaceWith(t.variableDeclaration(node.declaration.kind, declarations));
        }
      }
    }
  };
});
/**
 * This plugin loads route modules for the browser build, using module shims
 * that re-export only the route module exports that are safe for the browser.
 */
function browserRouteModulesPlugin(config, suffixMatcher, onLoader, mode) {
  return {
    name: "browser-route-modules",
    async setup(build) {
      let routesByFile = Object.keys(config.routes).reduce((map, key) => {
        let route = config.routes[key];
        map.set(route.file, route);
        return map;
      }, new Map());
      build.onResolve({
        filter: suffixMatcher
      }, args => {
        return {
          path: args.path,
          namespace: "browser-route-module"
        };
      });
      build.onLoad({
        filter: suffixMatcher,
        namespace: "browser-route-module"
      }, async args => {
        let file = args.path.replace(suffixMatcher, "");
        if (/\.mdx?$/.test(file)) {
          let route = routesByFile.get(file);
          invariant["default"](route, `Cannot get route by path: ${args.path}`);
          let theExports = await routeExports.getRouteModuleExports(config, route.id);
          let contents = "module.exports = {};";
          if (theExports.length !== 0) {
            let spec = `{ ${theExports.join(", ")} }`;
            contents = `export ${spec} from ${JSON.stringify(`./${file}`)};`;
          }
          return {
            contents,
            resolveDir: config.appDirectory,
            loader: "js"
          };
        }
        let routeFile = path__namespace.join(config.appDirectory, file);
        let sourceCode = fs__namespace.readFileSync(routeFile, "utf8");
        let transform = removeServerExports(loader => onLoader(routeFile, loader));
        let contents = transform(sourceCode, routeFile);
        if (mode === "development" && config.future.unstable_dev) {
          contents = await hmrPlugin.applyHMR(contents, {
            ...args,
            path: routeFile
          }, config, !!build.initialOptions.sourcemap);
        }
        return {
          contents,
          loader: loaders.getLoaderForFile(routeFile),
          resolveDir: path__namespace.dirname(routeFile)
        };
      });
    }
  };
}

exports.browserRouteModulesPlugin = browserRouteModulesPlugin;
