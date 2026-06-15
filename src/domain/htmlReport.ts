import { getPlanProgress, getSprintUsage } from './capacity'
import type { Epic, Plan, Sprint, Story } from './planTypes'

type PlanHtmlOptions = {
  jiraHostUrl?: string
}

const escapeHtml = (value: string | number | null | undefined) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const formatDateRange = (sprint?: Sprint) => (sprint ? `${sprint.startDate} - ${sprint.endDate}` : '')

const formatPoints = (points: number | null) => (points === null ? 'No estimate' : String(points))

const normalizeJiraBrowseBaseUrl = (jiraHostUrl?: string) => {
  if (!jiraHostUrl) {
    return null
  }

  const normalizedHost = jiraHostUrl.replace(/\/$/, '')
  return `${normalizedHost.endsWith('/jira') ? normalizedHost : `${normalizedHost}/jira`}/browse`
}

const buildIssueLink = (issueKey: string, jiraBrowseBaseUrl: string | null) => {
  if (!jiraBrowseBaseUrl) {
    return escapeHtml(issueKey)
  }

  return `<a class="issue-link" href="${escapeHtml(`${jiraBrowseBaseUrl}/${encodeURIComponent(issueKey)}`)}" target="_blank" rel="noreferrer">${escapeHtml(issueKey)}</a>`
}

const getEpicProgress = (epic: Epic, plan: Plan) => {
  const plannedStories = epic.stories.filter((story) => Boolean(plan.assignments[story.key]))
  const totalPoints = epic.stories.reduce((sum, story) => sum + (story.storyPoints ?? 0), 0)
  const plannedPoints = plannedStories.reduce((sum, story) => sum + (story.storyPoints ?? 0), 0)

  return {
    plannedStoryCount: plannedStories.length,
    totalStoryCount: epic.stories.length,
    plannedPoints,
    totalPoints
  }
}

const sortStoriesForReport = (stories: Story[], plan: Plan) => {
  const sprintOrder = new Map(plan.sprints.map((sprint, index) => [sprint.id, index]))

  return [...stories].sort((left, right) => {
    const leftSprintId = plan.assignments[left.key]
    const rightSprintId = plan.assignments[right.key]
    const leftOrder = leftSprintId ? sprintOrder.get(leftSprintId) ?? Number.MAX_SAFE_INTEGER - 1 : Number.MAX_SAFE_INTEGER
    const rightOrder = rightSprintId ? sprintOrder.get(rightSprintId) ?? Number.MAX_SAFE_INTEGER - 1 : Number.MAX_SAFE_INTEGER

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder
    }

    return left.key.localeCompare(right.key)
  })
}

const buildStoryRows = (epic: Epic, plan: Plan, jiraBrowseBaseUrl: string | null) => {
  const sprintById = new Map(plan.sprints.map((sprint) => [sprint.id, sprint]))

  return sortStoriesForReport(epic.stories, plan)
    .map((story) => {
      const sprint = sprintById.get(plan.assignments[story.key] ?? '')
      const isPlanned = Boolean(sprint)

      return `
        <tr>
          <td class="key">${buildIssueLink(story.key, jiraBrowseBaseUrl)}</td>
          <td>${escapeHtml(story.summary)}</td>
          <td>${escapeHtml(story.issueType)}</td>
          <td>${escapeHtml(story.status)}</td>
          <td class="number">${escapeHtml(formatPoints(story.storyPoints))}</td>
          <td><span class="badge ${isPlanned ? 'planned' : 'backlog'}">${escapeHtml(sprint?.name ?? 'Backlog')}</span></td>
          <td>${escapeHtml(formatDateRange(sprint))}</td>
          <td>${escapeHtml(story.localNote)}</td>
        </tr>
      `
    })
    .join('')
}

const buildEpicSection = (epic: Epic, plan: Plan, jiraBrowseBaseUrl: string | null) => {
  const progress = getEpicProgress(epic, plan)

  return `
    <section class="report-section epic">
      <div class="epic-header">
        <div>
          <h2>${buildIssueLink(epic.key, jiraBrowseBaseUrl)} - ${escapeHtml(epic.summary)}</h2>
          <div class="meta">
            <span>Commitment: <strong>${escapeHtml(epic.commitment)}</strong></span>
            <span>Priority Weight: <strong>${escapeHtml(epic.priorityWeight)}</strong></span>
            <span>Stories: <strong>${progress.plannedStoryCount}/${progress.totalStoryCount}</strong></span>
            <span>Points: <strong>${progress.plannedPoints}/${progress.totalPoints}</strong></span>
          </div>
        </div>
      </div>
      ${epic.localNote ? `<div class="note"><strong>Epic note:</strong> ${escapeHtml(epic.localNote)}</div>` : ''}
      <table>
        <thead>
          <tr>
            <th>Story</th>
            <th>Summary</th>
            <th>Type</th>
            <th>Status</th>
            <th>Points</th>
            <th>Sprint</th>
            <th>Sprint Dates</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          ${buildStoryRows(epic, plan, jiraBrowseBaseUrl) || '<tr><td colspan="8" class="empty">No stories imported.</td></tr>'}
        </tbody>
      </table>
    </section>
  `
}

const getAllStoriesWithEpics = (plan: Plan) =>
  plan.epics.flatMap((epic) => epic.stories.map((story) => ({ epic, story })))

const sortStoriesByEpicThenKey = (items: Array<{ epic: Epic; story: Story }>) =>
  [...items].sort((left, right) => {
    const epicCompare = left.epic.key.localeCompare(right.epic.key)
    return epicCompare === 0 ? left.story.key.localeCompare(right.story.key) : epicCompare
  })

const buildSprintStoryRows = (
  items: Array<{ epic: Epic; story: Story }>,
  jiraBrowseBaseUrl: string | null
) =>
  sortStoriesByEpicThenKey(items)
    .map(({ epic, story }) => `
      <tr>
        <td class="key">${buildIssueLink(story.key, jiraBrowseBaseUrl)}</td>
        <td>${escapeHtml(story.summary)}</td>
        <td class="key">${buildIssueLink(epic.key, jiraBrowseBaseUrl)}</td>
        <td>${escapeHtml(story.issueType)}</td>
        <td>${escapeHtml(story.status)}</td>
        <td class="number">${escapeHtml(formatPoints(story.storyPoints))}</td>
        <td>${escapeHtml(story.localNote)}</td>
      </tr>
    `)
    .join('')

const buildSprintViewSection = (plan: Plan, jiraBrowseBaseUrl: string | null) => {
  const allItems = getAllStoriesWithEpics(plan)
  const sprintSections = plan.sprints
    .map((sprint) => {
      const usage = getSprintUsage(plan, sprint.id)
      const items = allItems.filter(({ story }) => plan.assignments[story.key] === sprint.id)

      return `
        <section class="report-section sprint-view-card">
          <div class="epic-header">
            <div>
              <h2>${escapeHtml(sprint.name)}</h2>
              <div class="meta">
                <span>Dates: <strong>${escapeHtml(formatDateRange(sprint))}</strong></span>
                <span>Capacity: <strong>${escapeHtml(sprint.pointCapacity)}</strong></span>
                <span>Used Points: <strong>${escapeHtml(usage.usedPoints)}</strong></span>
                ${usage.isOverCapacity ? '<span><span class="badge warning">Over Capacity</span></span>' : ''}
              </div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Story</th>
                <th>Summary</th>
                <th>Epic</th>
                <th>Type</th>
                <th>Status</th>
                <th>Points</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              ${buildSprintStoryRows(items, jiraBrowseBaseUrl) || '<tr><td colspan="7" class="empty">No stories assigned to this sprint.</td></tr>'}
            </tbody>
          </table>
        </section>
      `
    })
    .join('')

  const backlogItems = allItems.filter(({ story }) => !plan.assignments[story.key])

  return `
    <section id="sprint-view" class="view-block">
      <h2 class="view-heading">Sprint View</h2>
      ${sprintSections || '<section class="report-section"><div class="empty block-empty">No sprints created.</div></section>'}
      <section class="report-section sprint-view-card">
        <div class="epic-header">
          <div>
            <h2><span class="badge backlog">Backlog</span></h2>
            <div class="meta">
              <span>Unplanned Stories: <strong>${escapeHtml(backlogItems.length)}</strong></span>
            </div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Story</th>
              <th>Summary</th>
              <th>Epic</th>
              <th>Type</th>
              <th>Status</th>
              <th>Points</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            ${buildSprintStoryRows(backlogItems, jiraBrowseBaseUrl) || '<tr><td colspan="7" class="empty">No backlog stories.</td></tr>'}
          </tbody>
        </table>
      </section>
    </section>
  `
}

const buildSprintSummaryRows = (plan: Plan) =>
  plan.sprints
    .map((sprint) => {
      const usage = getSprintUsage(plan, sprint.id)

      return `
        <tr>
          <td>${escapeHtml(sprint.name)}</td>
          <td>${escapeHtml(formatDateRange(sprint))}</td>
          <td class="number">${escapeHtml(sprint.pointCapacity)}</td>
          <td class="number">${escapeHtml(usage.usedPoints)}</td>
          <td>${usage.isOverCapacity ? '<span class="badge warning">Over Capacity</span>' : ''}</td>
        </tr>
      `
    })
    .join('')

export const buildPlanHtml = (plan: Plan, options: PlanHtmlOptions = {}) => {
  const progress = getPlanProgress(plan)
  const exportedAt = new Date().toLocaleString()
  const jiraBrowseBaseUrl = normalizeJiraBrowseBaseUrl(options.jiraHostUrl)

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(plan.projectKey || 'PI Plan')} Planning Report</title>
  <style>
    :root {
      color: #1f2937;
      background: #f8fafc;
      font-family: Arial, Helvetica, sans-serif;
    }
    body {
      margin: 0;
      padding: 32px;
      background: #f8fafc;
    }
    .page {
      max-width: 1280px;
      margin: 0 auto;
    }
    header {
      margin-bottom: 24px;
      border-bottom: 2px solid #cbd5e1;
      padding-bottom: 16px;
    }
    h1 {
      margin: 0 0 8px;
      color: #0f172a;
      font-size: 28px;
    }
    h2 {
      margin: 0;
      color: #0f172a;
      font-size: 18px;
    }
    .nav {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 16px;
    }
    .nav a {
      border: 1px solid #cbd5e1;
      border-radius: 999px;
      padding: 6px 12px;
      background: #ffffff;
      color: #1e40af;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
    }
    .nav a:hover {
      text-decoration: underline;
    }
    .summary,
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 18px;
      color: #475569;
      font-size: 13px;
    }
    .summary {
      margin-top: 12px;
    }
    .view-heading {
      margin: 28px 0 12px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 8px;
      font-size: 22px;
    }
    .report-section {
      margin: 18px 0;
      overflow: hidden;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background: #ffffff;
    }
    .epic-header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding: 16px;
      border-bottom: 1px solid #e2e8f0;
      background: #f1f5f9;
    }
    .note {
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
      background: #fffbeb;
      color: #713f12;
      white-space: pre-wrap;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th,
    td {
      border-bottom: 1px solid #e2e8f0;
      padding: 9px 10px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f8fafc;
      color: #475569;
      font-size: 11px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    tr:last-child td {
      border-bottom: 0;
    }
    .key {
      color: #334155;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-weight: 700;
      white-space: nowrap;
    }
    .issue-link {
      color: #1d4ed8;
      text-decoration: none;
    }
    .issue-link:hover {
      text-decoration: underline;
    }
    .number {
      text-align: right;
      white-space: nowrap;
    }
    .badge {
      display: inline-block;
      border-radius: 999px;
      padding: 3px 8px;
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
    }
    .planned {
      background: #dbeafe;
      color: #1e40af;
    }
    .backlog {
      background: #e2e8f0;
      color: #475569;
    }
    .warning {
      background: #fee2e2;
      color: #991b1b;
    }
    .empty {
      color: #64748b;
      text-align: center;
    }
    .block-empty {
      padding: 18px;
    }
    @media print {
      body {
        padding: 0;
        background: #ffffff;
      }
      .epic,
      .report-section {
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <main class="page">
    <header>
      <h1>${escapeHtml(plan.projectKey || 'PI Plan')} Planning Report</h1>
      <div class="summary">
        <span>Exported: <strong>${escapeHtml(exportedAt)}</strong></span>
        <span>Epics: <strong>${escapeHtml(plan.epics.length)}</strong></span>
        <span>Stories: <strong>${escapeHtml(progress.totalStoryCount)}</strong></span>
        <span>Total Points: <strong>${escapeHtml(progress.totalStoryPoints)}</strong></span>
        <span>Planned Points: <strong>${escapeHtml(progress.plannedStoryPoints)}</strong></span>
        <span>Planned Stories: <strong>${escapeHtml(progress.plannedStoryCount)}/${escapeHtml(progress.totalStoryCount)}</strong></span>
      </div>
      <nav class="nav">
        <a href="#epic-view">Epic View</a>
        <a href="#sprint-view">Sprint View</a>
        <a href="#sprint-summary">Sprint Summary</a>
      </nav>
    </header>

    <section id="epic-view" class="view-block">
      <h2 class="view-heading">Epic View</h2>
      ${plan.epics.map((epic) => buildEpicSection(epic, plan, jiraBrowseBaseUrl)).join('')}
    </section>

    ${buildSprintViewSection(plan, jiraBrowseBaseUrl)}

    <section id="sprint-summary" class="report-section sprint-summary">
      <div class="epic-header">
        <h2>Sprint Summary</h2>
      </div>
      <table>
        <thead>
          <tr>
            <th>Sprint</th>
            <th>Dates</th>
            <th>Capacity</th>
            <th>Used Points</th>
            <th>Warning</th>
          </tr>
        </thead>
        <tbody>
          ${buildSprintSummaryRows(plan) || '<tr><td colspan="5" class="empty">No sprints created.</td></tr>'}
        </tbody>
      </table>
    </section>
  </main>
</body>
</html>`
}
