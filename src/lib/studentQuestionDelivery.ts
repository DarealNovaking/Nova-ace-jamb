import type { CbtQuestion } from './cbtService'
import type { PublishedTopicMapping } from './progressSummary'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const failure = () => new Error('Question delivery could not be confirmed. Reload the session before continuing.')
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

function id(value: unknown): string {
  if (typeof value !== 'string' || !uuid.test(value)) throw failure()
  return value.toLowerCase()
}

function fields(value: unknown, allowed: string[]): Record<string, unknown> {
  if (!object(value) || Object.keys(value).some(key => !allowed.includes(key)) || allowed.some(key => !(key in value))) throw failure()
  return value
}

function text(value: unknown, limit: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > limit) throw failure()
  return value
}

export function validateQuestionIds(ids: unknown, limit: number): string[] {
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > limit) throw failure()
  const valid = ids.map(id)
  if (new Set(valid).size !== valid.length) throw failure()
  return valid
}

function optionSets(ids: string[], value: unknown): Map<string, Set<string>> {
  if (!object(value) || Object.keys(value).length !== ids.length || Object.keys(value).some(key => !ids.includes(key))) throw failure()
  return new Map(ids.map(questionId => {
    const keys = value[questionId]
    if (!Array.isArray(keys) || keys.length < 1 || keys.length > 20 || keys.some(key => typeof key !== 'string' || !/^[A-Z]$/.test(key))) throw failure()
    const set = new Set<string>(keys)
    if (set.size !== keys.length) throw failure()
    return [questionId, set]
  }))
}

export function validateAttemptQuestionRequest(attemptId: string, ids: string[], optionOrder: unknown): string {
  const valid = validateQuestionIds(ids, 500)
  optionSets(valid, optionOrder)
  return id(attemptId)
}

export function parseAttemptQuestions(value: unknown, ids: string[], optionOrder: unknown): CbtQuestion[] {
  const expected = validateQuestionIds(ids, 500)
  const expectedOptions = optionSets(expected, optionOrder)
  if (!Array.isArray(value) || value.length !== expected.length) throw failure()
  return value.map((item, index) => {
    const question = fields(item, ['id', 'question_text', 'options', 'subject_id', 'topic_id', 'difficulty'])
    if (id(question.id) !== expected[index] || !Array.isArray(question.options) || question.options.length < 1 || question.options.length > 20) throw failure()
    const options = question.options.map(item => {
      const option = fields(item, ['key', 'text'])
      if (typeof option.key !== 'string' || !/^[A-Z]$/.test(option.key)) throw failure()
      return { key: option.key, text: text(option.text, 4000) }
    })
    const keys = new Set(options.map(option => option.key))
    const wanted = expectedOptions.get(expected[index])!
    if (keys.size !== options.length || keys.size !== wanted.size || [...wanted].some(key => !keys.has(key))) throw failure()
    if (question.difficulty !== null && (typeof question.difficulty !== 'string' || !['easy', 'medium', 'hard'].includes(question.difficulty))) throw failure()
    return {
      id: expected[index], text: text(question.question_text, 20000), options,
      subject_id: question.subject_id === null ? null : id(question.subject_id),
      topic_id: question.topic_id === null ? null : id(question.topic_id),
      difficulty: question.difficulty as string | null,
    }
  })
}

export function parsePublishedQuestionIds(value: unknown, limit: number): string[] {
  if (!Number.isInteger(limit) || limit < 1 || limit > 20 || !Array.isArray(value) || value.length > limit) throw failure()
  return value.length ? validateQuestionIds(value, limit) : []
}

export function parseStudentQuestionTopics(value: unknown, ids: string[]): PublishedTopicMapping[] {
  const requested = new Set(validateQuestionIds(ids, 80))
  const seen = new Set<string>()
  if (!Array.isArray(value) || value.length > requested.size) throw failure()
  return value.map(item => {
    const mapping = fields(item, ['id', 'subject_id', 'topic_id', 'subtopic_id'])
    const key = id(mapping.id)
    if (!requested.has(key) || seen.has(key)) throw failure()
    seen.add(key)
    return { id: key, subject_id: id(mapping.subject_id), topic_id: id(mapping.topic_id), subtopic_id: mapping.subtopic_id === null ? null : id(mapping.subtopic_id) }
  })
}

export function questionDeliveryPhase(status: string, seconds: number): 'load' | 'expired' | 'closed' {
  if (!['active', 'paused', 'completed', 'abandoned'].includes(status) || !Number.isFinite(seconds) || seconds < 0) throw failure()
  return status !== 'active' ? 'closed' : seconds === 0 ? 'expired' : 'load'
}
