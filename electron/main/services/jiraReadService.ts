import { ProxyAgent, type Dispatcher } from 'undici'
import type { Epic, EpicCommitment, IssueKey, JiraConfig, Story } from '../../../src/domain/planTypes'
import type { FetchEpicsResult, JiraFieldMappings, RefreshIssuesResult } from '../../../src/domain/jiraTypes'
import { loadConfig } from './configService'

type JiraIssue = {
  key: string
  fields: Record<string, unknown>
}

type JiraIssueWithEpic = JiraIssue & {
  epicFallbackKey?: IssueKey
}

type JiraField = {
  id: string
  name: string
}

type JiraSearchResult = {
  issues: JiraIssue[]
}

const apiVersions = ['2', '3'] as const
const JIRA_REQUEST_TIMEOUT_MS = 15_000

const buildHeaders = (config: JiraConfig) => ({
  Authorization: `Bearer ${config.pat}`,
  Accept: 'application/json'
})

type FetchOptionsWithDispatcher = RequestInit & {
  dispatcher?: Dispatcher
}

const getProxyDispatcher = (config: JiraConfig): Dispatcher | undefined => {
  if (!config.proxy?.enabled) {
    return undefined
  }

  const proxyUrl = config.proxy.url.trim()
  if (!proxyUrl) {
    throw new Error('Proxy URL is required when proxy is enabled.')
  }

  try {
    const parsed = new URL(proxyUrl)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Unsupported proxy protocol.')
    }
    return new ProxyAgent(proxyUrl)
  } catch {
    throw new Error('Proxy URL is invalid.')
  }
}

const getJiraBaseUrls = (hostUrl: string) => {
  const normalizedHost = hostUrl.replace(/\/$/, '')
  const baseUrls = [normalizedHost]

  if (!normalizedHost.endsWith('/jira')) {
    baseUrls.push(`${normalizedHost}/jira`)
  }

  return baseUrls
}

const requestUrl = async <T>(config: JiraConfig, url: string): Promise<T> => {
  const dispatcher = getProxyDispatcher(config)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), JIRA_REQUEST_TIMEOUT_MS)
  const fetchOptions: FetchOptionsWithDispatcher = {
    method: 'GET',
    headers: buildHeaders(config),
    dispatcher,
    signal: controller.signal
  }

  try {
    const response = await fetch(url, fetchOptions)

    if (!response.ok) {
      throw new Error(`Jira GET ${url} failed with ${response.status}.`)
    }

    return (await response.json()) as T
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Jira request timed out after 15 seconds. Check Jira host, proxy, VPN, or network access.')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

const requestWithFallback = async <T>(config: JiraConfig, path: string): Promise<T> => {
  let lastError: unknown
  for (const baseUrl of getJiraBaseUrls(config.jiraHostUrl)) {
    for (const apiVersion of apiVersions) {
      try {
        return await requestUrl<T>(config, `${baseUrl}/rest/api/${apiVersion}${path}`)
      } catch (error) {
        lastError = error
      }
    }
  }
  throw lastError
}

const requestAgile = async <T>(config: JiraConfig, path: string): Promise<T> => {
  let lastError: unknown
  for (const baseUrl of getJiraBaseUrls(config.jiraHostUrl)) {
    try {
      return await requestUrl<T>(config, `${baseUrl}/rest/agile/1.0${path}`)
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}

const quoteJqlList = (keys: IssueKey[]) => keys.map((key) => `"${key.replace(/"/g, '\\"')}"`).join(',')

const getJqlField = (fieldId?: string) => {
  if (!fieldId) {
    return null
  }
  const customFieldMatch = fieldId.match(/^customfield_(\d+)$/)
  return customFieldMatch ? `cf[${customFieldMatch[1]}]` : `"${fieldId}"`
}

const fetchFields = async (config: JiraConfig) => requestWithFallback<JiraField[]>(config, '/field')

const detectFieldMappings = async (config: JiraConfig): Promise<JiraFieldMappings> => {
  const configured = config.fieldMappings ?? {}
  const fields = await fetchFields(config)
  const storyPointsField =
    configured.storyPointsFieldId ??
    fields.find((field) => ['story points', 'story point estimate', 'story points estimate'].includes(field.name.toLowerCase()))?.id
  const epicLinkField =
    configured.epicLinkFieldId ?? fields.find((field) => ['epic link', 'parent link'].includes(field.name.toLowerCase()))?.id
  const numericalPriorityField =
    configured.numericalPriorityFieldId ??
    fields.find((field) => ['numerical priority', 'numeric priority'].includes(field.name.toLowerCase()))?.id
  const commitmentField =
    configured.commitmentFieldId ?? fields.find((field) => ['commitment', 'epic commitment'].includes(field.name.toLowerCase()))?.id

  return {
    storyPointsFieldId: storyPointsField,
    epicLinkFieldId: epicLinkField,
    numericalPriorityFieldId: numericalPriorityField,
    commitmentFieldId: commitmentField
  }
}

const issueFields = (mappings: JiraFieldMappings) =>
  [
    'summary',
    'description',
    'issuetype',
    'status',
    'parent',
    mappings.storyPointsFieldId,
    mappings.epicLinkFieldId,
    mappings.numericalPriorityFieldId,
    mappings.commitmentFieldId
  ]
    .filter(Boolean)
    .join(',')

const searchIssues = async (config: JiraConfig, jql: string, fields: string) => {
  const params = new URLSearchParams({
    jql,
    fields,
    maxResults: '1000'
  })
  const result = await requestWithFallback<JiraSearchResult>(config, `/search?${params.toString()}`)
  return result.issues
}

const fetchIssue = async (config: JiraConfig, key: IssueKey, fields: string) => {
  const params = new URLSearchParams({ fields })
  return requestWithFallback<JiraIssue>(config, `/issue/${encodeURIComponent(key)}?${params.toString()}`)
}

const getFieldObjectName = (value: unknown, fallback: string) => {
  if (value && typeof value === 'object' && 'name' in value && typeof value.name === 'string') {
    return value.name
  }
  return fallback
}

const getNumericFieldValue = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

const getCommitmentValue = (value: unknown): EpicCommitment => {
  const rawValue =
    value && typeof value === 'object'
      ? 'name' in value && typeof value.name === 'string'
        ? value.name
        : 'value' in value && typeof value.value === 'string'
          ? value.value
          : ''
      : typeof value === 'string'
        ? value
        : ''

  const normalized = rawValue.trim().toLowerCase()
  if (normalized === 'committed') {
    return 'committed'
  }
  if (normalized === 'uncommitted') {
    return 'uncommitted'
  }
  return 'unplanned'
}

const extractTextFromAdf = (value: unknown): string[] => {
  if (!value || typeof value !== 'object') {
    return []
  }

  if ('text' in value && typeof value.text === 'string') {
    return [value.text]
  }

  if ('content' in value && Array.isArray(value.content)) {
    return value.content.flatMap(extractTextFromAdf)
  }

  return []
}

const getDescriptionText = (value: unknown) => {
  if (typeof value === 'string') {
    return value.trim()
  }

  return extractTextFromAdf(value).join(' ').replace(/\s+/g, ' ').trim()
}

const parseStory = (issue: JiraIssue, epicKey: string, mappings: JiraFieldMappings): Story => {
  const fields = issue.fields
  const points = mappings.storyPointsFieldId ? fields[mappings.storyPointsFieldId] : null

  return {
    key: issue.key,
    summary: String(fields.summary ?? ''),
    description: getDescriptionText(fields.description),
    issueType: getFieldObjectName(fields.issuetype, 'Issue'),
    status: getFieldObjectName(fields.status, 'Unknown'),
    storyPoints: typeof points === 'number' ? points : null,
    epicKey
  }
}

const isClosedStory = (issue: JiraIssue) => getFieldObjectName(issue.fields.status, '').toLowerCase() === 'closed'

const mergeUniqueIssues = (issueGroups: JiraIssueWithEpic[][]) => {
  const issuesByKey = new Map<IssueKey, JiraIssueWithEpic>()
  for (const issue of issueGroups.flat()) {
    issuesByKey.set(issue.key, issue)
  }
  return [...issuesByKey.values()]
}

const getEpicKeyForStory = (issue: JiraIssue, fallbackEpicKey: string, mappings: JiraFieldMappings) => {
  const parent = issue.fields.parent
  if (parent && typeof parent === 'object' && 'key' in parent && typeof parent.key === 'string') {
    return parent.key
  }

  const epicLink = mappings.epicLinkFieldId ? issue.fields[mappings.epicLinkFieldId] : null
  return typeof epicLink === 'string' ? epicLink : fallbackEpicKey
}

const parseEpic = (issue: JiraIssue, stories: Story[], mappings: JiraFieldMappings): Epic => {
  const numericalPriority = mappings.numericalPriorityFieldId ? issue.fields[mappings.numericalPriorityFieldId] : null
  const commitment = mappings.commitmentFieldId ? issue.fields[mappings.commitmentFieldId] : null

  return {
    key: issue.key,
    summary: String(issue.fields.summary ?? ''),
    description: getDescriptionText(issue.fields.description),
    priorityWeight: getNumericFieldValue(numericalPriority),
    commitment: getCommitmentValue(commitment),
    stories
  }
}

const fetchStoriesForEpics = async (
  config: JiraConfig,
  projectKey: string,
  epicKeys: IssueKey[],
  mappings: JiraFieldMappings
) => {
  const fields = issueFields(mappings)
  const issueGroups: JiraIssueWithEpic[][] = []

  for (const epicKey of epicKeys) {
    try {
      const params = new URLSearchParams({
        maxResults: '1000',
        fields
      })
      const result = await requestAgile<JiraSearchResult>(
        config,
        `/epic/${encodeURIComponent(epicKey)}/issue?${params.toString()}`
      )
      issueGroups.push(result.issues.filter((issue) => !isClosedStory(issue)).map((issue) => ({ ...issue, epicFallbackKey: epicKey })))
    } catch {
      // Some Jira instances disable Agile APIs. JQL fallbacks below still cover read-only imports.
    }
  }

  const epicLinkField = getJqlField(mappings.epicLinkFieldId)

  for (const epicKey of epicKeys) {
    const jqlCandidates = [
      epicLinkField ? `project = "${projectKey}" AND ${epicLinkField} = "${epicKey}"` : '',
      `project = "${projectKey}" AND "Epic Link" = "${epicKey}"`,
      `project = "${projectKey}" AND parent = "${epicKey}"`
    ].filter(Boolean)

    for (const jql of jqlCandidates) {
      try {
        const issues = await searchIssues(config, jql, fields)
        if (issues.length > 0) {
          issueGroups.push(issues.filter((issue) => !isClosedStory(issue)).map((issue) => ({ ...issue, epicFallbackKey: epicKey })))
        }
      } catch {
        // Try the next read-only lookup style.
      }
    }
  }

  return mergeUniqueIssues(issueGroups)
}

export const testConnection = async (configPath: string) => {
  const config = await loadConfig(configPath)
  await requestWithFallback(config, '/myself')
}

export const fetchEpics = async (
  configPath: string,
  projectKey: string,
  epicKeys: IssueKey[]
): Promise<FetchEpicsResult> => {
  const config = await loadConfig(configPath)
  const mappings = await detectFieldMappings(config)
  const fields = issueFields(mappings)
  const epicIssues = await Promise.all(epicKeys.map((key) => fetchIssue(config, key, fields)))
  const childIssues = await fetchStoriesForEpics(config, projectKey, epicKeys, mappings)

  const storiesByEpic = new Map<IssueKey, Story[]>()
  for (const issue of childIssues) {
    const epicKey = issue.epicFallbackKey ?? getEpicKeyForStory(issue, epicKeys[0], mappings)
    const story = parseStory(issue, epicKey, mappings)
    storiesByEpic.set(epicKey, [...(storiesByEpic.get(epicKey) ?? []), story])
  }

  return {
    projectKey,
    epics: epicIssues.map((issue) => parseEpic(issue, storiesByEpic.get(issue.key) ?? [], mappings)),
    fieldMappings: mappings
  }
}

export const refreshIssues = async (configPath: string, issueKeys: IssueKey[]): Promise<RefreshIssuesResult> => {
  const config = await loadConfig(configPath)
  const mappings = await detectFieldMappings(config)
  const fields = issueFields(mappings)
  const refreshed = await Promise.allSettled(issueKeys.map((key) => fetchIssue(config, key, fields)))

  return {
    stories: refreshed.map((result, index) => {
      if (result.status === 'fulfilled') {
        return parseStory(result.value, '', mappings)
      }
      return {
        key: issueKeys[index],
        summary: 'Unable to refresh from Jira',
        issueType: 'Issue',
        status: 'Unavailable',
        storyPoints: null,
        epicKey: '',
        stale: true
      }
    })
  }
}
