import { send } from 'micro'

export const sendText = (res, ...sendArgs) => {
  res.setHeader('Content-type', 'text/plain')
  send(res, ...sendArgs)
}

export const sendHtml = (res, ...sendArgs) => {
  res.setHeader('Content-type', 'text/html')
  send(res, ...sendArgs)
}

export const sendJson = (res, ...sendArgs) => {
  res.setHeader('Content-type', 'application/json')
  send(res, ...sendArgs)
}

export const sendJavascript = (res, ...sendArgs) => {
  res.setHeader('Content-type', 'application/javascript')
  send(res, ...sendArgs)
}

export const sendRedirect = (res, url) => {
  res.setHeader('Location', url)
  send(res, 302)
}
