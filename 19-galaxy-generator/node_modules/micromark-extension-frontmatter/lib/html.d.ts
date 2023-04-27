/**
 * Create an extension for `micromark` to support frontmatter when serializing
 * to HTML.
 *
 * > 👉 **Note**: this makes sure nothing is generated in the output HTML for
 * > frontmatter.
 *
 * @param {Options | null | undefined} [options='yaml']
 *   Configuration.
 * @returns {HtmlExtension}
 *   Extension for `micromark` that can be passed in `htmlExtensions`, to
 *   support frontmatter when serializing to HTML.
 */
export function frontmatterHtml(
  options?: Options | null | undefined
): HtmlExtension
export type HtmlExtension = import('micromark-util-types').HtmlExtension
export type Handle = import('micromark-util-types').Handle
export type CompileContext = import('micromark-util-types').CompileContext
export type Options = import('../matters.js').Options
