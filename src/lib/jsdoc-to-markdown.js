'use strict'
const stats = require('jsdoc2md-stats')
const jsdocApi = require('jsdoc-api')
const dmd = require('dmd')
const os = require('os')
const DmdOptions = require('./dmd-options')
const JsdocOptions = require('./jsdoc-options')

/**
 * @module jsdoc-to-markdown
 * @example
 * const jsdoc2md = require('jsdoc-to-markdown')
 */

/**
 * @alias module:jsdoc-to-markdown
 * @typicalname jsdoc2md
*/
class JsdocToMarkdown {
  /**
   * Returns markdown documentation from jsdoc-annoted source code.
   *
   * @param [options] {object} - Accepts all {@link module:jsdoc-to-markdown#getJsdocData} options plus the following:
   * @param [options.data] {object[]} - Raw template data to use. Useful when you already have template data, obtained from `.getTemplateData`. Either `files`, `source` or `data` must be supplied.
   * @param [options.template] {string} - The template the supplied documentation will be rendered into. Use the default or supply your own template for full control over the output.
   * @param [options.heading-depth] {number} - The initial heading depth. For example, with a value of `2` the top-level markdown headings look like `"## The heading"`.
   * @param [options.example-lang] {string} - Specifies the default language used in @example blocks (for [syntax-highlighting](https://help.github.com/articles/github-flavored-markdown/#syntax-highlighting) purposes). In gfm mode, each @example is wrapped in a fenced-code block. Example usage: `--example-lang js`. Use the special value `none` for no specific language. While using this option, you can override the supplied language for any @example by specifying the `@lang` subtag, e.g `@example @lang hbs`. Specifying `@example @lang off` will disable code blocks for that example.
   * @param [options.plugin] {string|string[]} - Use an installed package containing helper and/or partial overrides.
   * @param [options.helper] {string|string[]} - handlebars helper files to override or extend the default set.
   * @param [options.partial] {string|string[]} - handlebars partial files to override or extend the default set.
   * @param [options.name-format] {string} - Format identifier names in the [code](http://daringfireball.net/projects/markdown/syntax#code) style, (i.e. format using backticks or `<code></code>`).
   * @param [options.no-gfm] {boolean} - By default, dmd generates github-flavoured markdown. Not all markdown parsers render gfm correctly. If your generated docs look incorrect on sites other than Github (e.g. npmjs.org) try enabling this option to disable Github-specific syntax.
   * @param [options.separators] {boolean} - Put `<hr>` breaks between identifiers. Improves readability on bulky docs.
   * @param [options.module-index-format] {string} - none, grouped, table, dl.
   * @param [options.global-index-format] {} - none, grouped, table, dl.
   * @param [options.param-list-format] {} - Two options to render parameter lists: 'list' or 'table' (default). Table format works well in most cases but switch to list if things begin to look crowded / squashed.
   * @param [options.property-list-format] {} - list, table.
   * @param [options.member-index-format] {} - grouped, list
   * @return {Promise}
   * @fulfil {string} - the rendered docs
   * @category async
   * @example
   * Pass in filepaths (`**` glob matching supported) of javascript source files:
   * ```js
   * > jsdoc2md.render('lib/*.js').then(console.log)
   * ```
   */
  render (options) {
    options = options || {}
    const dmdOptions = new DmdOptions(options)
    if (options.data) {
      return dmd.async(options.data, dmdOptions)
    } else {
      return this.getTemplateData(options)
        .then(templateData => dmd.async(templateData, dmdOptions))
    }
  }

  /**
   * Sync version of `render`.
   *
   * @param [options] {object} - Identical options to {@link module:jsdoc-to-markdown#render}.
   * @return {string}
   * @engine nodejs >= 0.12
   * @category sync
   * @example
   * const docs = jsdoc2md.renderSync('lib/*.js')
   */
  renderSync (options) {
    options = options || {}
    const dmdOptions = new DmdOptions(options)
    if (options.data) {
      return dmd(options.data, dmdOptions)
    } else {
      return dmd(this.getTemplateDataSync(options), dmdOptions)
    }
  }

  /**
   * Returns template data (jsdoc-parse output).
   *
   * @param [options] {object} - Identical options to {@link module:jsdoc-to-markdown#getJsdocData}.
   * @return {Promise}
   * @fulfil {object[]} - the json data
   * @category async
   */
  getTemplateData (options) {
    options = options || {}
    const jsdocParse = require('jsdoc-parse')
    return this.getJsdocData(options)
      .then(jsdocParse)
  }

  /**
   * Sync version of `getTemplateData`.
   *
   * @param [options] {object} - Identical options to {@link module:jsdoc-to-markdown#getJsdocData}.
   * @return {object[]}
   * @category sync
   */
  getTemplateDataSync (options) {
    options = options || {}
    const jsdocParse = require('jsdoc-parse')
    const jsdocData = this.getJsdocDataSync(options)
    return jsdocParse(jsdocData, options)
  }

  /**
   * Returns raw jsdoc data.
   *
   * @param [options] {object} - the options
   * @param [options.cache] {boolean} - Set to false to disable memoisation cache. Defaults to true.
   * @param [options.files] {string|string[]} - One or more filenames to process. Accepts globs (e.g. `*.js`). Either `files`, `source` or `data` must be supplied.
   * @param [options.source] {string} - A string containing source code to process. Either `files`, `source` or `data` must be supplied.
   * @param [options.configure] {string} - The path to the configuration file. Default: path/to/jsdoc/conf.json.
   * @param [options.html] {boolean} - Enable experimental documentation of `.html` files.
   * @return {Promise}
   * @fulfil {object[]}
   * @category async
   */
  getJsdocData (options) {
    const jsdocOptions = new JsdocOptions(options)
    return jsdocApi.explain(jsdocOptions)
  }

  /**
   * Sync version of `getJsdocData`.
   *
   * @param [options] {object} - Identical options to {@link module:jsdoc-to-markdown#getJsdocData}.
   * @return {object[]}
   * @category sync
   */
  getJsdocDataSync (options) {
    const jsdocOptions = new JsdocOptions(options)
    return jsdocApi.explainSync(jsdocOptions)
  }

  /**
   * Clear the cache.
   * @returns {Promise}
   * @category async
   */
  clear () {
    return jsdocApi.cache.clear().then(() => dmd.cache.clear())
  }

  getNamepaths (options) {
    return this.getTemplateData(options)
      .then(data => {
        const namepaths = {}
        const kinds = [
          'module', 'class', 'constructor', 'mixin', 'member',
          'namespace', 'constant', 'function', 'event', 'typedef', 'external'
        ]
        kinds.forEach(kind => {
          namepaths[kind] = data
            .filter(identifier => {
              return identifier.kind === kind
            })
            .map(identifier => identifier.longname)
        })
        return namepaths
      })
  }
}

module.exports = new (stats(JsdocToMarkdown, require('../../package').version))()
