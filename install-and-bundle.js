const npm = require('npm-utils')
const quote = require('quote')
const {bundle} = require('./packer')
const pEachSeries = require('p-each-series')
const execa = require('execa')
const {tap} = require('ramda')

function timing (shortName, longName, seconds) {
  return `${shortName}=${seconds}; ${quote(longName)}`
}

function prune () {
  console.log('pruning installed packages')
  return execa.shell('npm prune')
}

// should respond with the bundle and timings
function installAndBundle (...names) {
  console.log('packing names', names)

  const timings = [
    timing('install', 'NPM install', 2),
    timing('bundle', 'Webpack bundling', 1)
  ]

  const installName = name => {
    console.log('installing', name)
    const reportError = err => {
      console.log('Could not install', name)
      return Promise.reject(err)
    }
    return npm.install({name})
      .catch(reportError)
  }

  const pruneAndReject = err => {
    prune()
    return Promise.reject(err)
  }

  return pEachSeries(names, installName)
    .then(() => bundle(...names))
    .then(bundle => {
      return {bundle, timings}
    })
    .then(tap(prune), pruneAndReject)
}

module.exports = {installAndBundle}

if (!module.parent) {
  installAndBundle('xstream', '@cycle/run', '@cycle/dom')
    .then(console.log)
    .catch(console.error)
}
