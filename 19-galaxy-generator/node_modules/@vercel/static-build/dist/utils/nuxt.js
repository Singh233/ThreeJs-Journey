"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectVercelAnalyticsPlugin = void 0;
const path_1 = require("path");
const rc9_1 = require("rc9");
const _shared_1 = require("./_shared");
// https://github.com/nuxt-modules/web-vitals
const ANALYTICS_PLUGIN_PACKAGE = '@nuxtjs/web-vitals';
async function injectVercelAnalyticsPlugin(dir) {
    // First update the `.nuxtrc` file to inject the analytics plugin.
    // See: https://gist.github.com/pi0/23b5253ac19b4ed5a70add3b971545c9
    const nuxtrcPath = path_1.join(dir, '.nuxtrc');
    console.log(`Injecting Nuxt.js analytics plugin "${ANALYTICS_PLUGIN_PACKAGE}" to \`${nuxtrcPath}\``);
    rc9_1.update({
        'modules[]': ANALYTICS_PLUGIN_PACKAGE,
    }, {
        name: nuxtrcPath,
    });
    // The dependency needs to be listed in `package.json` as well so
    // that `npm i` installs the package.
    const pkgJson = (await _shared_1.readPackageJson(dir));
    if (!pkgJson.dependencies) {
        pkgJson.dependencies = {};
    }
    if (!pkgJson.dependencies[ANALYTICS_PLUGIN_PACKAGE]) {
        pkgJson.dependencies[ANALYTICS_PLUGIN_PACKAGE] = 'latest';
        console.log(`Adding "${ANALYTICS_PLUGIN_PACKAGE}" to \`package.json\` "dependencies"`);
        await _shared_1.writePackageJson(dir, pkgJson);
    }
}
exports.injectVercelAnalyticsPlugin = injectVercelAnalyticsPlugin;
