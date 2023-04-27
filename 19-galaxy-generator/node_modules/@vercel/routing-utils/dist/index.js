"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransformedRoutes = exports.normalizeRoutes = exports.isValidHandleValue = exports.isHandler = exports.getCleanUrls = exports.mergeRoutes = exports.appendRoutesToPhase = void 0;
const url_1 = require("url");
const superstatic_1 = require("./superstatic");
var append_1 = require("./append");
Object.defineProperty(exports, "appendRoutesToPhase", { enumerable: true, get: function () { return append_1.appendRoutesToPhase; } });
var merge_1 = require("./merge");
Object.defineProperty(exports, "mergeRoutes", { enumerable: true, get: function () { return merge_1.mergeRoutes; } });
__exportStar(require("./schemas"), exports);
var superstatic_2 = require("./superstatic");
Object.defineProperty(exports, "getCleanUrls", { enumerable: true, get: function () { return superstatic_2.getCleanUrls; } });
__exportStar(require("./types"), exports);
const VALID_HANDLE_VALUES = [
    'filesystem',
    'hit',
    'miss',
    'rewrite',
    'error',
    'resource',
];
const validHandleValues = new Set(VALID_HANDLE_VALUES);
function isHandler(route) {
    return typeof route.handle !== 'undefined';
}
exports.isHandler = isHandler;
function isValidHandleValue(handle) {
    return validHandleValues.has(handle);
}
exports.isValidHandleValue = isValidHandleValue;
function normalizeRoutes(inputRoutes) {
    if (!inputRoutes || inputRoutes.length === 0) {
        return { routes: inputRoutes, error: null };
    }
    const routes = [];
    const handling = [];
    const errors = [];
    inputRoutes.forEach((r, i) => {
        const route = { ...r };
        routes.push(route);
        const keys = Object.keys(route);
        if (isHandler(route)) {
            const { handle } = route;
            if (keys.length !== 1) {
                const unknownProp = keys.find(prop => prop !== 'handle');
                errors.push(`Route at index ${i} has unknown property \`${unknownProp}\`.`);
            }
            else if (!isValidHandleValue(handle)) {
                errors.push(`Route at index ${i} has unknown handle value \`handle: ${handle}\`.`);
            }
            else if (handling.includes(handle)) {
                errors.push(`Route at index ${i} is a duplicate. Please use one \`handle: ${handle}\` at most.`);
            }
            else {
                handling.push(handle);
            }
        }
        else if (route.src) {
            // Route src should always start with a '^'
            if (!route.src.startsWith('^')) {
                route.src = `^${route.src}`;
            }
            // Route src should always end with a '$'
            if (!route.src.endsWith('$')) {
                route.src = `${route.src}$`;
            }
            // Route src should strip escaped forward slash, its not special
            route.src = route.src.replace(/\\\//g, '/');
            const regError = checkRegexSyntax('Route', i, route.src);
            if (regError) {
                errors.push(regError);
            }
            // The last seen handling is the current handler
            const handleValue = handling[handling.length - 1];
            if (handleValue === 'hit') {
                if (route.dest) {
                    errors.push(`Route at index ${i} cannot define \`dest\` after \`handle: hit\`.`);
                }
                if (route.status) {
                    errors.push(`Route at index ${i} cannot define \`status\` after \`handle: hit\`.`);
                }
                if (!route.continue) {
                    errors.push(`Route at index ${i} must define \`continue: true\` after \`handle: hit\`.`);
                }
            }
            else if (handleValue === 'miss') {
                if (route.dest && !route.check) {
                    errors.push(`Route at index ${i} must define \`check: true\` after \`handle: miss\`.`);
                }
                else if (!route.dest && !route.continue) {
                    errors.push(`Route at index ${i} must define \`continue: true\` after \`handle: miss\`.`);
                }
            }
        }
        else {
            errors.push(`Route at index ${i} must define either \`handle\` or \`src\` property.`);
        }
    });
    const error = errors.length > 0
        ? createError('invalid_route', errors, 'https://vercel.link/routes-json', 'Learn More')
        : null;
    return { routes, error };
}
exports.normalizeRoutes = normalizeRoutes;
function checkRegexSyntax(type, index, src) {
    try {
        new RegExp(src);
    }
    catch (err) {
        const prop = type === 'Route' ? 'src' : 'source';
        return `${type} at index ${index} has invalid \`${prop}\` regular expression "${src}".`;
    }
    return null;
}
function checkPatternSyntax(type, index, { source, destination, has, }) {
    let sourceSegments = new Set();
    const destinationSegments = new Set();
    try {
        sourceSegments = new Set(superstatic_1.sourceToRegex(source).segments);
    }
    catch (err) {
        return {
            message: `${type} at index ${index} has invalid \`source\` pattern "${source}".`,
            link: 'https://vercel.link/invalid-route-source-pattern',
        };
    }
    if (destination) {
        try {
            const { hostname, pathname, query } = url_1.parse(destination, true);
            superstatic_1.sourceToRegex(hostname || '').segments.forEach(name => destinationSegments.add(name));
            superstatic_1.sourceToRegex(pathname || '').segments.forEach(name => destinationSegments.add(name));
            for (const strOrArray of Object.values(query)) {
                const value = Array.isArray(strOrArray) ? strOrArray[0] : strOrArray;
                superstatic_1.sourceToRegex(value || '').segments.forEach(name => destinationSegments.add(name));
            }
        }
        catch (err) {
            // Since checkPatternSyntax() is a validation helper, we don't want to
            // replicate all possible URL parsing here so we consume the error.
            // If this really is an error, we'll throw later in convertRedirects().
        }
        const hasSegments = superstatic_1.collectHasSegments(has);
        for (const segment of destinationSegments) {
            if (!sourceSegments.has(segment) && !hasSegments.includes(segment)) {
                return {
                    message: `${type} at index ${index} has segment ":${segment}" in \`destination\` property but not in \`source\` or \`has\` property.`,
                    link: 'https://vercel.link/invalid-route-destination-segment',
                };
            }
        }
    }
    return null;
}
function checkRedirect(r, index) {
    if (typeof r.permanent !== 'undefined' &&
        typeof r.statusCode !== 'undefined') {
        return `Redirect at index ${index} cannot define both \`permanent\` and \`statusCode\` properties.`;
    }
    return null;
}
function createError(code, allErrors, link, action) {
    const errors = Array.isArray(allErrors) ? allErrors : [allErrors];
    const message = errors[0];
    const error = {
        name: 'RouteApiError',
        code,
        message,
        link,
        action,
        errors,
    };
    return error;
}
function notEmpty(value) {
    return value !== null && value !== undefined;
}
function getTransformedRoutes(vercelConfig) {
    const { cleanUrls, rewrites, redirects, headers, trailingSlash } = vercelConfig;
    let { routes = null } = vercelConfig;
    if (routes) {
        const hasNewProperties = typeof cleanUrls !== 'undefined' ||
            typeof trailingSlash !== 'undefined' ||
            typeof redirects !== 'undefined' ||
            typeof headers !== 'undefined' ||
            typeof rewrites !== 'undefined';
        if (hasNewProperties) {
            const error = createError('invalid_mixed_routes', 'If `rewrites`, `redirects`, `headers`, `cleanUrls` or `trailingSlash` are used, then `routes` cannot be present.', 'https://vercel.link/mix-routing-props', 'Learn More');
            return { routes, error };
        }
        return normalizeRoutes(routes);
    }
    if (typeof cleanUrls !== 'undefined') {
        const normalized = normalizeRoutes(superstatic_1.convertCleanUrls(cleanUrls, trailingSlash));
        if (normalized.error) {
            normalized.error.code = 'invalid_clean_urls';
            return { routes, error: normalized.error };
        }
        routes = routes || [];
        routes.push(...(normalized.routes || []));
    }
    if (typeof trailingSlash !== 'undefined') {
        const normalized = normalizeRoutes(superstatic_1.convertTrailingSlash(trailingSlash));
        if (normalized.error) {
            normalized.error.code = 'invalid_trailing_slash';
            return { routes, error: normalized.error };
        }
        routes = routes || [];
        routes.push(...(normalized.routes || []));
    }
    if (typeof redirects !== 'undefined') {
        const code = 'invalid_redirect';
        const regexErrorMessage = redirects
            .map((r, i) => checkRegexSyntax('Redirect', i, r.source))
            .find(notEmpty);
        if (regexErrorMessage) {
            return {
                routes,
                error: createError('invalid_redirect', regexErrorMessage, 'https://vercel.link/invalid-route-source-pattern', 'Learn More'),
            };
        }
        const patternError = redirects
            .map((r, i) => checkPatternSyntax('Redirect', i, r))
            .find(notEmpty);
        if (patternError) {
            return {
                routes,
                error: createError(code, patternError.message, patternError.link, 'Learn More'),
            };
        }
        const redirectErrorMessage = redirects.map(checkRedirect).find(notEmpty);
        if (redirectErrorMessage) {
            return {
                routes,
                error: createError(code, redirectErrorMessage, 'https://vercel.link/redirects-json', 'Learn More'),
            };
        }
        const normalized = normalizeRoutes(superstatic_1.convertRedirects(redirects));
        if (normalized.error) {
            normalized.error.code = code;
            return { routes, error: normalized.error };
        }
        routes = routes || [];
        routes.push(...(normalized.routes || []));
    }
    if (typeof headers !== 'undefined') {
        const code = 'invalid_header';
        const regexErrorMessage = headers
            .map((r, i) => checkRegexSyntax('Header', i, r.source))
            .find(notEmpty);
        if (regexErrorMessage) {
            return {
                routes,
                error: createError(code, regexErrorMessage, 'https://vercel.link/invalid-route-source-pattern', 'Learn More'),
            };
        }
        const patternError = headers
            .map((r, i) => checkPatternSyntax('Header', i, r))
            .find(notEmpty);
        if (patternError) {
            return {
                routes,
                error: createError(code, patternError.message, patternError.link, 'Learn More'),
            };
        }
        const normalized = normalizeRoutes(superstatic_1.convertHeaders(headers));
        if (normalized.error) {
            normalized.error.code = code;
            return { routes, error: normalized.error };
        }
        routes = routes || [];
        routes.push(...(normalized.routes || []));
    }
    if (typeof rewrites !== 'undefined') {
        const code = 'invalid_rewrite';
        const regexErrorMessage = rewrites
            .map((r, i) => checkRegexSyntax('Rewrite', i, r.source))
            .find(notEmpty);
        if (regexErrorMessage) {
            return {
                routes,
                error: createError(code, regexErrorMessage, 'https://vercel.link/invalid-route-source-pattern', 'Learn More'),
            };
        }
        const patternError = rewrites
            .map((r, i) => checkPatternSyntax('Rewrite', i, r))
            .find(notEmpty);
        if (patternError) {
            return {
                routes,
                error: createError(code, patternError.message, patternError.link, 'Learn More'),
            };
        }
        const normalized = normalizeRoutes(superstatic_1.convertRewrites(rewrites));
        if (normalized.error) {
            normalized.error.code = code;
            return { routes, error: normalized.error };
        }
        routes = routes || [];
        routes.push({ handle: 'filesystem' });
        routes.push(...(normalized.routes || []));
    }
    return { routes, error: null };
}
exports.getTransformedRoutes = getTransformedRoutes;
