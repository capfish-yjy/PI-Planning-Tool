import type { Epic, EpicCommitment, Plan, Sprint, Story } from './planTypes'
import { getSprintUsage } from './capacity'

const requiredCsvHeaders = [
  'Project Key',
  'Epic Key',
  'Epic Summary',
  'Epic Commitment',
  'Epic Priority Weight',
  'Issue Key',
  'Issue Summary',
  'Issue Type',
  'Jira Status',
  'Story Points',
  'Sprint Name',
  'Sprint Start Date',
  'Sprint End Date',
  'Sprint Capacity',
  'Sprint Used Points',
  'Capacity Warning'
]

const csvHeaders = [
  'Project Key',
  'Epic Key',
  'Epic Summary',
  'Epic Commitment',
  'Epic Priority Weight',
  'Epic Note',
  'Issue Key',
  'Issue Summary',
  'Issue Type',
  'Jira Status',
  'Story Points',
  'Issue Note',
  'Sprint Name',
  'Sprint Start Date',
  'Sprint End Date',
  'Sprint Capacity',
  'Sprint Used Points',
  'Capacity Warning'
]

const escapeCsv = (value: string | number | null | undefined) => {
  const normalized = value === null || value === undefined ? '' : String(value)
  return `"${normalized.replace(/"/g, '""')}"`
}

export const buildPlanCsv = (plan: Plan) => {
  const sprintById = new Map(plan.sprints.map((sprint) => [sprint.id, sprint]))

  const rows = plan.epics.flatMap((epic) =>
    epic.stories.map((story) => {
      const sprint = sprintById.get(plan.assignments[story.key] ?? '')
      const usage = sprint ? getSprintUsage(plan, sprint.id) : null
      return [
        plan.projectKey,
        epic.key,
        epic.summary,
        epic.commitment,
        epic.priorityWeight,
        epic.localNote,
        story.key,
        story.summary,
        story.issueType,
        story.status,
        story.storyPoints,
        story.localNote,
        sprint?.name,
        sprint?.startDate,
        sprint?.endDate,
        sprint?.pointCapacity,
        usage?.usedPoints,
        usage?.isOverCapacity ? 'Over Capacity' : ''
      ]
    })
  )

  return [csvHeaders, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\r\n')
}

export const findSprintForStory = (plan: Plan, storyKey: string): Sprint | undefined => {
  const sprintId = plan.assignments[storyKey]
  return plan.sprints.find((sprint) => sprint.id === sprintId)
}

const parseCsvRows = (csv: string) => {
  const rows: string[][] = []
  let row: string[] = []
  let value = ''
  let inQuotes = false

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index]
    const nextChar = csv[index + 1]

    if (char === '"' && inQuotes && nextChar === '"') {
      value += '"'
      index += 1
      continue
    }

    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }

    if (char === ',' && !inQuotes) {
      row.push(value)
      value = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        index += 1
      }
      row.push(value)
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row)
      }
      row = []
      value = ''
      continue
    }

    value += char
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value)
    rows.push(row)
  }

  return rows
}

const normalizeHeader = (header: string) => header.replace(/^\uFEFF/, '').trim()

const readNumber = (value: string) => {
  if (!value.trim()) {
    return null
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const readCommitment = (value: string): EpicCommitment => {
  if (value === 'committed' || value === 'uncommitted' || value === 'unplanned') {
    return value
  }
  return 'unplanned'
}

const makeSprintId = (sprintName: string, startDate: string, endDate: string) =>
  `csv-${sprintName}-${startDate}-${endDate}`.replace(/[^a-zA-Z0-9_-]+/g, '-')

export const parsePlanCsv = (csv: string): Plan => {
  const rows = parseCsvRows(csv)
  const [headerRow, ...dataRows] = rows

  if (!headerRow) {
    throw new Error('CSV file is empty.')
  }

  const normalizedHeaders = headerRow.map(normalizeHeader)
  for (const expectedHeader of requiredCsvHeaders) {
    if (!normalizedHeaders.includes(expectedHeader)) {
      throw new Error(`CSV file is missing required column: ${expectedHeader}.`)
    }
  }

  const columnIndex = new Map(normalizedHeaders.map((header, index) => [header, index]))
  const getCell = (row: string[], header: string) => row[columnIndex.get(header) ?? -1]?.trim() ?? ''
  const epicsByKey = new Map<string, Epic>()
  const sprintsById = new Map<string, Sprint>()
  const assignments: Plan['assignments'] = {}
  let projectKey = ''

  for (const row of dataRows) {
    const epicKey = getCell(row, 'Epic Key')
    const issueKey = getCell(row, 'Issue Key')
    if (!epicKey || !issueKey) {
      continue
    }

    projectKey = projectKey || getCell(row, 'Project Key')
    const epic =
      epicsByKey.get(epicKey) ??
      ({
        key: epicKey,
        summary: getCell(row, 'Epic Summary'),
        localNote: getCell(row, 'Epic Note') || undefined,
        priorityWeight: readNumber(getCell(row, 'Epic Priority Weight')) ?? 0,
        commitment: readCommitment(getCell(row, 'Epic Commitment')),
        stories: []
      } satisfies Epic)
    const epicNote = getCell(row, 'Epic Note')
    if (epicNote && !epic.localNote) {
      epic.localNote = epicNote
    }
    epicsByKey.set(epicKey, epic)

    const storyPoints = readNumber(getCell(row, 'Story Points'))
    const story: Story = {
      key: issueKey,
      summary: getCell(row, 'Issue Summary'),
      issueType: getCell(row, 'Issue Type') || 'Issue',
      status: getCell(row, 'Jira Status') || 'Unknown',
      storyPoints,
      localNote: getCell(row, 'Issue Note') || undefined,
      epicKey
    }

    if (!epic.stories.some((existingStory) => existingStory.key === story.key)) {
      epic.stories.push(story)
    }

    const sprintName = getCell(row, 'Sprint Name')
    if (sprintName) {
      const startDate = getCell(row, 'Sprint Start Date')
      const endDate = getCell(row, 'Sprint End Date')
      const sprintId = makeSprintId(sprintName, startDate, endDate)
      if (!sprintsById.has(sprintId)) {
        sprintsById.set(sprintId, {
          id: sprintId,
          name: sprintName,
          startDate,
          endDate,
          pointCapacity: readNumber(getCell(row, 'Sprint Capacity')) ?? 0
        })
      }
      assignments[issueKey] = sprintId
    } else {
      assignments[issueKey] = null
    }
  }

  const epics = [...epicsByKey.values()]
  return {
    version: 1,
    projectKey,
    epicIds: epics.map((epic) => epic.key),
    epics,
    sprints: [...sprintsById.values()],
    assignments,
    updatedAt: new Date().toISOString()
  }
}
