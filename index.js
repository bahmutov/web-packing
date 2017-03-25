'use strict'

const {send, createError} = require('micro')
const {installAndBundle} = require('./install-and-bundle')
const {tail} = require('ramda')
const validate = require('validate-npm-package-name')
const fs = require('fs')
const is = require('check-more-types')
const readme = fs.readFileSync('./README.md', 'utf8')

function validateNames (...names) {
  names.forEach(name => {
    const result = validate(name)
    if (!result.validForNewPackages) {
      throw new Error(`Invalid package name "${name}"`)
    }
  })
}

module.exports = async (req, res) => {
  if (req.url === '/favicon.ico') {
    return send(res, 404)
  }

  try {
    const names = tail(req.url).split('&').filter(is.unemptyString)
    if (is.empty(names)) {
      return readme
    }

    console.log('packing names', names)
    validateNames(...names)

    const {bundle, timings} = await installAndBundle(...names)
    res.setHeader('Content-Type', 'application/javascript')
    res.setHeader('Cache-Control', 'max-age=99999999, public, immutable')
    res.setHeader('Server-Timing', timings.join(', '))
    return send(res, 200, bundle)
  } catch (err) {
    console.error('Could not pack')
    console.error(err)
    throw createError(500, err.message)
  }
}
