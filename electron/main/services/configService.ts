import { readFile, writeFile } from 'node:fs/promises'
import type { JiraConfig } from '../../../src/domain/planTypes'

const validateConfig = (value: unknown): JiraConfig => {
  if (!value || typeof value !== 'object') {
    throw new Error('Config file is not a valid JSON object.')
  }

  const candidate = value as Partial<JiraConfig>
  if (!candidate.jiraHostUrl || !candidate.pat) {
    throw new Error('Config file must include jiraHostUrl and pat.')
  }

  return {
    jiraHostUrl: candidate.jiraHostUrl.replace(/\/$/, ''),
    pat: candidate.pat,
    fieldMappings: candidate.fieldMappings
  }
}

export const loadConfig = async (configPath: string) => {
  const raw = await readFile(configPath, 'utf8')
  return validateConfig(JSON.parse(raw))
}

export const saveConfig = async (configPath: string, config: JiraConfig) => {
  const normalized = validateConfig(config)
  await writeFile(configPath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8')
}
