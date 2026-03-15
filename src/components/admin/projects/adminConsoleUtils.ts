import { AdminProjectsApiError, type AdminProjectErrorCode } from '~/lib/api/adminProjectsApi'

function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function mapAdminError(error: unknown): { code: AdminProjectErrorCode; message: string } {
  if (error instanceof AdminProjectsApiError) {
    if (error.code === 'unauthorized') return { code: 'unauthorized', message: 'Admin Token 无效或过期，请重新验证。' }
    if (error.code === 'sync_failed') return { code: error.code, message: '同步失败，请稍后重试。' }
    if (error.code === 'sync_rate_limited') return { code: error.code, message: 'GitHub 配额限流，请稍后再试。' }
    if (error.code === 'sync_job_not_found') return { code: error.code, message: '同步任务不存在，请刷新列表。' }
    if (error.code === 'sync_job_state_invalid') return { code: error.code, message: '当前任务状态不允许重试。' }
    if (error.code === 'validation_failed') return { code: error.code, message: '请求参数校验失败，请检查后重试。' }
    if (toText(error.message)) return { code: error.code, message: toText(error.message) }
  }

  if (error instanceof Error && toText(error.message)) {
    return { code: 'unknown', message: toText(error.message) }
  }

  return { code: 'unknown', message: '请求失败，请重试。' }
}

export function formatAdminTime(value: string | null): string {
  if (!value) return '--'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '--'
  return parsed.toLocaleString('zh-CN', { hour12: false })
}

export function healthTone(value: string): 'ok' | 'warn' | 'error' {
  const normalized = value.trim().toLowerCase()
  if (normalized === 'ok' || normalized === 'healthy' || normalized === 'up') {
    return 'ok'
  }
  if (normalized === 'degraded' || normalized === 'partial' || normalized === 'warning') {
    return 'warn'
  }
  return 'error'
}