import { message } from 'antd'

const DEMO_CODES = new Set(['DEMO_LIMIT_REACHED', 'DEMO_READ_ONLY'])

export function isDemoRestriction(error) {
  return error?.response?.status === 403 && DEMO_CODES.has(error?.response?.data?.error)
}

export function handleDemoRestriction(error) {
  if (!isDemoRestriction(error) || error.demoRestrictionNotified) {
    return false
  }

  error.demoRestrictionNotified = true
  message.warning(error.response.data.message)
  return true
}
