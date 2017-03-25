'use strict'

const {send, createError} = require('micro')
const {installAndBundle} = require('./install-and-bundle')
const {tail} = require('ramda')
const validate = require('validate-npm-package-name')

function validateNames (...names) {
  names.forEach(name => {
    const result = validate(name)
    if (!result.validForNewPackages) {
      throw new Error(`Invalid package name "${name}"`)
    }
  })
}

module.exports = async (req, res) => {
  try {
    const names = tail(req.url).split('&')
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
