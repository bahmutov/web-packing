'use strict'

const la = require('lazy-ass')
const is = require('check-more-types')
const quote = require('quote')
const {bundle} = require('./web-packing')
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
function installAndBundle (...allNames) {
  const names = allNames.filter(is.unemptyString)
  la(is.array(names), 'expected list of names', names)
  la(is.not.empty(names), 'expected at least 1 name', names)
  console.log('packing names', names)

  const timings = [
    timing('install', 'NPM install', 2),
    timing('bundle', 'Webpack bundling', 1)
  ]

  const installName = name => {
    console.log('installing', name)
    const cmd = `npm --cache-min 9999999 install ${name}`

    const reportError = err => {
      console.error('Could not install', name)
      console.error('cmd:', cmd)
      return Promise.reject(err)
    }
    return execa.shell(cmd)
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
