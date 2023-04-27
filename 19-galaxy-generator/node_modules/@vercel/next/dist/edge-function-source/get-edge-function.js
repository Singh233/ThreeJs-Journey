"use strict";
/// <reference lib="DOM" />
Object.defineProperty(exports, "__esModule", { value: true });
const to_plain_headers_1 = require("./to-plain-headers");
/**
 * A template to adapt the Next.js Edge Function signature into the core Edge
 * Function signature. This will automatically inject parameters that are
 * missing in default Edge Functions from the provided configuration
 * parameters. Static and Dynamic RegExp are calculated in the module scope
 * to avoid recomputing them for each function invocation.
 */
function getNextjsEdgeFunction(params) {
    const staticRoutes = params.staticRoutes.map(route => ({
        regexp: new RegExp(route.namedRegex),
        page: route.page,
    }));
    const dynamicRoutes = params.dynamicRoutes?.map(route => ({
        regexp: new RegExp(route.namedRegex),
        page: route.page,
    })) || [];
    return async function edgeFunction(request, context) {
        let pathname = new URL(request.url).pathname;
        let pageMatch = {};
        // Remove the basePath from the URL
        if (params.nextConfig?.basePath) {
            if (pathname.startsWith(params.nextConfig.basePath)) {
                pathname = pathname.replace(params.nextConfig.basePath, '') || '/';
            }
        }
        // Remove the locale from the URL
        if (params.nextConfig?.i18n) {
            for (const locale of params.nextConfig.i18n.locales) {
                const regexp = new RegExp(`^/${locale}($|/)`, 'i');
                if (pathname.match(regexp)) {
                    pathname = pathname.replace(regexp, '/') || '/';
                    break;
                }
            }
        }
        // Find the page match that will happen if there are no assets matching
        for (const route of staticRoutes) {
            const result = route.regexp.exec(pathname);
            if (result) {
                pageMatch.name = route.page;
                break;
            }
        }
        if (!pageMatch.name) {
            const isApi = isApiRoute(pathname);
            for (const route of dynamicRoutes || []) {
                /**
                 * Dynamic API routes should not be checked against dynamic non API
                 * routes so we skip it in such case. For example, a request to
                 * /api/test should not match /pages/[slug].test having:
                 *   - pages/api/foo.js
                 *   - pages/[slug]/test.js
                 */
                if (isApi && !isApiRoute(route.page)) {
                    continue;
                }
                const result = route.regexp.exec(pathname);
                if (result) {
                    pageMatch = {
                        name: route.page,
                        params: result.groups,
                    };
                    break;
                }
            }
        }
        // Invoke the function injecting missing parameters
        const result = await _ENTRIES[`middleware_${params.name}`].default.call({}, {
            request: {
                url: request.url,
                method: request.method,
                headers: (0, to_plain_headers_1.toPlainHeaders)(request.headers),
                ip: header(request.headers, IncomingHeaders.Ip),
                geo: {
                    city: header(request.headers, IncomingHeaders.City, true),
                    country: header(request.headers, IncomingHeaders.Country, true),
                    latitude: header(request.headers, IncomingHeaders.Latitude),
                    longitude: header(request.headers, IncomingHeaders.Longitude),
                    region: header(request.headers, IncomingHeaders.Region, true),
                },
                nextConfig: params.nextConfig,
                page: pageMatch,
                body: request.body,
            },
        });
        context.waitUntil(result.waitUntil);
        return result.response;
    };
}
exports.default = getNextjsEdgeFunction;
/**
 * Allows to get a header value by name but falling back to `undefined` when
 * the value does not exist. Optionally, we can make this function decode
 * what it reads for certain cases.
 *
 * @param headers The Headers object.
 * @param name The name of the header to extract.
 * @param decode Tells if we should decode the value.
 * @returns The header value or undefined.
 */
function header(headers, name, decode = false) {
    const value = headers.get(name) || undefined;
    return decode && value ? decodeURIComponent(value) : value;
}
function isApiRoute(path) {
    return path === '/api' || path.startsWith('/api/');
}
var IncomingHeaders;
(function (IncomingHeaders) {
    /**
     * City of the original client IP calculated by Vercel Proxy.
     */
    IncomingHeaders["City"] = "x-vercel-ip-city";
    /**
     * Country of the original client IP calculated by Vercel Proxy.
     */
    IncomingHeaders["Country"] = "x-vercel-ip-country";
    /**
     * Ip from Vercel Proxy. Do not confuse it with the client Ip.
     */
    IncomingHeaders["Ip"] = "x-real-ip";
    /**
     * Latitude of the original client IP calculated by Vercel Proxy.
     */
    IncomingHeaders["Latitude"] = "x-vercel-ip-latitude";
    /**
     * Longitude of the original client IP calculated by Vercel Proxy.
     */
    IncomingHeaders["Longitude"] = "x-vercel-ip-longitude";
    /**
     * Region of the original client IP calculated by Vercel Proxy.
     */
    IncomingHeaders["Region"] = "x-vercel-ip-country-region";
})(IncomingHeaders || (IncomingHeaders = {}));
