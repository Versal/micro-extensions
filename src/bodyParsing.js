import urlencodedBodyParser from 'urlencoded-body-parser'
import micro from 'micro'

/*
Sometimes it's useful to read the body more than once (e.g. once from middleware
and again in a response handler) without incuring the expense of reading more
than once. This module imports and re-exports useful body parsing helpers after
wrapping them in a caching mechanism.
*/

const json = async req => {
  if (req.__microExtensionBodyJson) return req.__microExtensionBodyJson
  req.__microExtensionBodyJson = await micro.json(req)
  return req.__microExtensionBodyJson
}

const buffer = async req => {
  if (req.__microExtensionBodyBuffer) return req.__microExtensionBodyBuffer
  req.__microExtensionBodyBuffer = await micro.buffer(req)
  return req.__microExtensionBodyBuffer
}

const text = async req => {
  if (req.__microExtensionBodyText) return req.__microExtensionBodyText
  req.__microExtensionBodyText = await micro.text(req)
  return req.__microExtensionBodyText
}

const urlencoded = async req => {
  if (req.__microExtensionBodyUrlencoded) return req.__microExtensionBodyUrlencoded
  req.__microExtensionBodyUrlencoded = await urlencodedBodyParser(req)
  return req.__microExtensionBodyUrlencoded
}

export {
  json,
  buffer,
  text,
  urlencoded
}
