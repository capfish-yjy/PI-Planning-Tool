import type { IssueKey } from './planTypes'

export type StoryFocusTarget = 'backlog' | 'sprint'

export type StoryFocusRequest = {
  storyKey: IssueKey
  target: StoryFocusTarget
  nonce: number
}
