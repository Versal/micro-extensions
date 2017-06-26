import { createError } from 'micro'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { sendHtml, sendJson, sendText, sendJavascript } from '../send'

// This is the beginnings of robust app-wide error handling. The end product
// should look something like `next.js` where you can declare an error
// template (react component) that gets rendered when the content type
// is text/html.

const sendHtmlError = ErrorPage => {
  return (res, { message, statusCode }) =>
    sendHtml(
      res,
      statusCode,
      renderToStaticMarkup(
        <ErrorPage
          message={message}
          statusCode={statusCode} />
      )
    )
}

const sendTextError = (res, { message, statusCode }) =>
  sendText(res, statusCode, message)

const sendJsonError = (res, { message, statusCode }) =>
  sendJson(res, statusCode, { message, statusCode })

const sendJavascriptError = (res, { message, statusCode }) =>
  sendJavascript(res, statusCode, `// ${message}`)

const sendErrorPageForContentType = (
  res,
  error,
  contentType,
  ErrorPage
) => {
  const errorSenders = {
    'text/html': sendHtmlError(ErrorPage),
    'application/json': sendJsonError,
    'application/javascript': sendJavascriptError
  }

  const errorSender = errorSenders[contentType] || sendTextError
  errorSender(res, error)
}

const findContentType = pathname => {
  if (pathname.endsWith('.json')) return 'application/json'
  if (pathname.endsWith('.js')) return 'application/javascript'
  return 'text/html'
}

const catchAndRenderErrors = ErrorPage => handler => async context => {
  try {
    return await handler(context)
  } catch (originalError) {
    const { res, pathname } = context
    const { statusCode, message } = originalError
    const contentType = findContentType(pathname)

    // If it's an unexpected error package it up for rendering
    const error = statusCode
      ? originalError
      : createError(500, message, originalError)

    // Otherwise this error is already ready to go, continuing
    return sendErrorPageForContentType(
      res,
      error,
      contentType,
      ErrorPage
    )
  }
}

export default catchAndRenderErrors
