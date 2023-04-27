"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitCookiesString = exports.toPlainHeaders = void 0;
/**
 * Transforms a standard Headers object into a plean Headers object. This is
 * done to support a plain format for headers which is used in the Edge
 * Function signature.
 *
 * @param headers Headers from the original request.
 * @returns The same headers formatted as Node Headers.
 */
function toPlainHeaders(headers) {
    const result = {};
    if (!headers)
        return result;
    headers.forEach((value, key) => {
        result[key] = value;
        if (key.toLowerCase() === 'set-cookie') {
            result[key] = splitCookiesString(value);
        }
    });
    return result;
}
exports.toPlainHeaders = toPlainHeaders;
/**
 * Set-Cookie header field-values are sometimes comma joined in one string.
 * This splits them without choking on commas that are within a single
 * set-cookie field-value, such as in the Expires portion. This is uncommon,
 * but explicitly allowed (https://tools.ietf.org/html/rfc2616#section-4.2)
 */
function splitCookiesString(cookiesString) {
    const cookiesStrings = [];
    let pos = 0;
    let start;
    let ch;
    let lastComma;
    let nextStart;
    let cookiesSeparatorFound;
    function skipWhitespace() {
        while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos)))
            pos += 1;
        return pos < cookiesString.length;
    }
    function notSpecialChar() {
        ch = cookiesString.charAt(pos);
        return ch !== '=' && ch !== ';' && ch !== ',';
    }
    while (pos < cookiesString.length) {
        start = pos;
        cookiesSeparatorFound = false;
        while (skipWhitespace()) {
            ch = cookiesString.charAt(pos);
            if (ch === ',') {
                // ',' is a cookie separator if we have later first '=', not ';' or ','
                lastComma = pos;
                pos += 1;
                skipWhitespace();
                nextStart = pos;
                while (pos < cookiesString.length && notSpecialChar()) {
                    pos += 1;
                }
                // currently special character
                if (pos < cookiesString.length && cookiesString.charAt(pos) === '=') {
                    // we found cookies separator
                    cookiesSeparatorFound = true;
                    // pos is inside the next cookie, so back up and return it.
                    pos = nextStart;
                    cookiesStrings.push(cookiesString.substring(start, lastComma));
                    start = pos;
                }
                else {
                    // in param ',' or param separator ';',
                    // we continue from that comma
                    pos = lastComma + 1;
                }
            }
            else {
                pos += 1;
            }
        }
        if (!cookiesSeparatorFound || pos >= cookiesString.length) {
            cookiesStrings.push(cookiesString.substring(start, cookiesString.length));
        }
    }
    return cookiesStrings;
}
exports.splitCookiesString = splitCookiesString;
