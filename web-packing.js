'use strict'

const la = require('lazy-ass')
const is = require('check-more-types')
const webpack = require('webpack')
const webpackConfig = require('./webpack.config')
const fs = require('fs')
const {stripIndent} = require('common-tags')
const _ = require('lodash')
const path = require('path')

// TODO remove scope, use camel case
const safeName = packageName => {
  if (packageName.includes('/')) {
    // something like @cycle/run
    return _.camelCase(packageName.substr(packageName.lastIndexOf('/') + 1))
  }
  return _.camelCase(packageName)
}

function writeEntry (...names) {
  const safeNames = names.map(safeName)
  const requires = names.map((name, k) =>
    `const ${safeNames[k]} = require('${name}')`).join('\n')
  const packedNames = `global.packs = {${safeNames.join(', ')}}`
  const str = stripIndent`
  ${requires}
  ${packedNames}
  `
  fs.writeFileSync(webpackConfig.entry, str + '\n\n', 'utf8')
}

function bundle (outputFilename, ...names) {
  console.log('bundling', names)
  console.log('into', outputFilename)
  la(is.unemptyString(outputFilename),
    'missing output filename', outputFilename)

  const outputPath = path.dirname(outputFilename)
  const outputFile = path.basename(outputFilename)

  return new Promise((resolve, reject) => {
    writeEntry(...names)
    webpackConfig.output.path = outputPath
    webpackConfig.output.filename = outputFile

    const compiler = webpack(webpackConfig)
    compiler.run((err, stats) => {
      if (err || stats.hasErrors()) {
        if (err) {
          console.error('err', err)
        }
        console.error('stats', stats)
        return reject(new Error('Could not bundle :('))
      }
      // https://webpack.js.org/api/node/
      const content = fs.readFileSync(webpackConfig.output.filename, 'utf8')
      resolve(content)
    })
  })
}

module.exports = {bundle}

if (!module.parent) {
  bundle('/tmp/bundle.js', '@cycle/run')
    .then(() => console.log('bundled'))
    .catch(console.error)
}
