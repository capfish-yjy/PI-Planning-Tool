import { readFile, writeFile } from 'node:fs/promises'
import type { Plan } from '../../../src/domain/planTypes'

const validatePlan = (value: unknown): Plan => {
  if (!value || typeof value !== 'object') {
    throw new Error('Plan file is not a valid JSON object.')
  }

  const candidate = value as Partial<Plan>
  if (candidate.version !== 1 || !Array.isArray(candidate.epics) || !Array.isArray(candidate.sprints)) {
    throw new Error('Plan file is not a supported PI plan.')
  }

  return candidate as Plan
}

export const loadPlanFile = async (filePath: string) => {
  const raw = await readFile(filePath, 'utf8')
  return validatePlan(JSON.parse(raw))
}

export const savePlanFile = async (filePath: string, plan: Plan) => {
  const { ...safePlan } = plan
  await writeFile(filePath, `${JSON.stringify(safePlan, null, 2)}\n`, 'utf8')
}
