import { sendText, sendJson } from '../modules/sendContentTypes'
import { readJsonSync, existsSync } from 'fs-extra'
import { join as joinPath } from 'path'
import { hostname as getHostname } from 'os'

// Build process dumps a `build.json` in the project root
const buildPath = joinPath(__dirname, '/../../build.json')
const build = existsSync(buildPath)
  ? readJsonSync(buildPath)
  : { commit: 'n/a', builtAt: 'n/a' }

// Additional version info comes from package.json
const projectPackagePath = joinPath(__dirname, '/../../package.json')
const projectPackage = readJsonSync(projectPackagePath)
const { name: projectName, version: projectVersion } = projectPackage

const project = {
  name: projectName.split('/').pop(),
  version: projectVersion,
  environment: getHostname().split('.').shift()
}

// Render the results
const renderVersion = ({
  name,
  version,
  commit,
  builtAt,
  environment
}) => {
  return `
 project: ${name}
 version: v${version}
git hash: ${commit}
   built: ${builtAt}
     tag: ${environment}
`.slice(1) // Cleanup leading newline
}

const version = { ...build, ...project }
const versionText = renderVersion(version)

export const routes = [
  {
    method: 'get',
    pattern: '/version.json',
    handler: ({ res }) => sendJson(res, 200, version)
  },
  {
    method: 'get',
    pattern: '/version',
    handler: ({ res }) => sendText(res, 200, versionText)
  }
]
