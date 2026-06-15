import { readFile, writeFile } from 'node:fs/promises'
import type { Plan } from '../../../src/domain/planTypes'
import { buildPlanCsv, parsePlanCsv } from '../../../src/domain/csv'
import { buildPlanHtml } from '../../../src/domain/htmlReport'

export const exportPlanCsv = async (filePath: string, plan: Plan) => {
  await writeFile(filePath, `\uFEFF${buildPlanCsv(plan)}\r\n`, 'utf8')
}

export const exportPlanHtml = async (filePath: string, plan: Plan, jiraHostUrl?: string) => {
  await writeFile(filePath, buildPlanHtml(plan, { jiraHostUrl }), 'utf8')
}

export const importPlanCsv = async (filePath: string) => {
  const raw = await readFile(filePath, 'utf8')
  return parsePlanCsv(raw)
}
