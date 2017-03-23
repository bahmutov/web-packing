const webpack = require('webpack')
const webpackConfig = require('./webpack.config')
// const MemoryFS = require('memory-fs')
const fs = require('fs')
const {stripIndent} = require('common-tags')
const _ = require('lodash')

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

function bundle (...names) {
  console.log('bundling', names)
  return new Promise((resolve, reject) => {
    writeEntry(...names)
    const compiler = webpack(webpackConfig)
    // compiler.outputFileSystem = fs
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
      // console.log('content', content)

      // const dummyJavaScript = 'console.log("packed")'
      resolve(content)
    })
  })
}

module.exports = {bundle}

if (!module.parent) {
  bundle('@cycle/run')
    .then(() => console.log('bundled'))
    .catch(console.error)
}
