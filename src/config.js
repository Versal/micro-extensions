import { existsSync, readJsonSync } from 'fs-extra'
import JsonSchema from 'ajv'
import fromPairs from 'lodash/fromPairs'
const jsonSchema = new JsonSchema({ allErrors: true })

const validateConfig = (schema, config) => {
  let errors = []
  schema.forEach(({ name, schema }) => {
    const val = config[name]
    if (val === undefined) {
      errors = [...errors, `'${name}' is required`]
    } else {
      const isValid = jsonSchema.validate(schema, val)
      if (!isValid) {
        const { errors: validationErrors } = jsonSchema
        validationErrors.forEach(
          ({ message }) => {
            errors = [...errors, `'${name}' ${message}`]
          }
        )
      }
    }
  })

  if (errors.length) {
    return errors
  }
}

const applyDefaultsFromSchema = (schema, config) => {
  const mapNameToDefault = param => [param.name, param.default]
  const defaults = fromPairs(schema.map(mapNameToDefault))

  return { ...defaults, ...config }
}

const showErrors = errors => {
  console.error('Config is not valid:')
  errors.forEach(error => console.error(' - ' + error))
}

const killProcess = () => process.exit(1)

export const loadConfig = (schema, config) => {
  const configWithDefaults = applyDefaultsFromSchema(schema, config)
  const errors = validateConfig(schema, configWithDefaults)
  if (errors) {
    showErrors(errors)
    killProcess()
  }

  return configWithDefaults
}

export const loadConfigFromPath = (schema, configPath) => {
  if (!existsSync(configPath)) {
    console.warn(`WARN: config file does not exist: ${configPath}`)
    console.warn(`WARN: returning empty config for app`)
    return {}
  }

  console.info(`Loading config from '${configPath}'`)

  const config = readJsonSync(configPath)
  return loadConfig(schema, config)
}
