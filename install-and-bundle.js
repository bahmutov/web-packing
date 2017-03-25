'use strict'

const la = require('lazy-ass')
const is = require('check-more-types')
const quote = require('quote')
const {bundle} = require('./web-packing')
const pEachSeries = require('p-each-series')
const execa = require('execa')
const {tap} = require('ramda')
const os = require('os')
const fs = require('fs')
const chdir = require('chdir-promise')
const slugify = require('slugify')
const path = require('path')

const toSeconds = (startMs, endMs) => (endMs - startMs) / 1000

function timing (shortName, longName, seconds) {
  return `${shortName}=${seconds}; ${quote(longName)}`
}

function safeName (names) {
  la(is.strings(names), 'expected list of names', names)
  return slugify(names.join('-'))
}

function installAndBundle (...allNames) {
  const names = allNames.filter(is.unemptyString)
  la(is.array(names), 'expected list of names', names)
  la(is.not.empty(names), 'expected at least 1 name', names)
  console.log('install and bundling names', names)

  const times = []
  const timestamp = () => times.push(+(new Date()))
  timestamp()

  const slug = safeName(names)
  la(is.unemptyString(slug), 'could not slufigy', names)
  const bundleFilename = slug + '.js'
  const madeName = path.join(os.tmpdir(), bundleFilename)
  if (fs.existsSync(madeName)) {
    console.log('returning existing bundle file', madeName)
    const bundle = fs.readFileSync(madeName, 'utf8')
    timestamp()

    return {
      bundle,
      timings: [
        timing('cached', 'Cached lookup', toSeconds(times[0], times[1]))
      ]
    }
  }

  const getTimings = times => {
    console.log('times', times)
    const timings = []
    timings.push(timing('install', 'NPM install',
      toSeconds(times[0], times[1])))
    timings.push(timing('bundle', 'Webpack bundling',
      toSeconds(times[1], times[2])))
    console.log('timings')
    console.log(timings)
    return timings
  }

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

  const backAndReject = err => {
    chdir.back()
    return Promise.reject(err)
  }

  return chdir.to(os.tmpdir())
    .then(() => pEachSeries(names, installName))
    .then(timestamp)
    .then(() => bundle(madeName, ...names))
    .then(bundle => {
      timestamp()
      const timings = getTimings(times)
      return {bundle, timings}
    })
    .then(tap(chdir.back), backAndReject)
}

module.exports = {installAndBundle}

if (!module.parent) {
  installAndBundle('xstream', '@cycle/run', '@cycle/dom')
    .then(console.log)
    .catch(console.error)
}
