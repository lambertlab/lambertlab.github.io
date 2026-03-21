import { AdminConsoleApiError, type AdminProjectErrorCode } from '~/lib/api/adminConsoleApi'

function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function mapAdminError(error: unknown): { code: AdminProjectErrorCode; message: string } {
  if (error instanceof AdminConsoleApiError) {
    if (error.code === 'unauthorized') return { code: 'unauthorized', message: 'Admin Token \u65e0\u6548\u6216\u8fc7\u671f\uff0c\u8bf7\u91cd\u65b0\u9a8c\u8bc1\u3002' }
    if (error.code === 'sync_failed') return { code: error.code, message: '\u540c\u6b65\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002' }
    if (error.code === 'sync_rate_limited') return { code: error.code, message: 'GitHub \u914d\u989d\u9650\u6d41\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002' }
    if (error.code === 'sync_job_not_found') return { code: error.code, message: '\u540c\u6b65\u4efb\u52a1\u4e0d\u5b58\u5728\uff0c\u8bf7\u5237\u65b0\u5217\u8868\u3002' }
    if (error.code === 'sync_job_state_invalid') return { code: error.code, message: '\u5f53\u524d\u4efb\u52a1\u72b6\u6001\u4e0d\u5141\u8bb8\u91cd\u8bd5\u3002' }
    if (error.code === 'validation_failed') return { code: error.code, message: '\u8bf7\u6c42\u53c2\u6570\u6821\u9a8c\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u540e\u91cd\u8bd5\u3002' }
    if (error.code === 'request_timeout') return { code: error.code, message: '\u8bf7\u6c42\u8d85\u65f6\u3002\u4efb\u52a1\u53ef\u80fd\u5df2\u53d7\u7406\uff0c\u7cfb\u7edf\u5c06\u5c1d\u8bd5\u56de\u67e5\u7ed3\u679c\u3002' }
    if (error.code === 'network_failed') return { code: error.code, message: '\u7f51\u7edc\u8bf7\u6c42\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5 API_BASE\u3001CORS \u6216\u670d\u52a1\u53ef\u8fbe\u6027\u540e\u91cd\u8bd5\u3002' }
    if (toText(error.message)) return { code: error.code, message: toText(error.message) }
  }

  if (error instanceof Error && toText(error.message)) {
    return { code: 'unknown', message: toText(error.message) }
  }

  return { code: 'unknown', message: '\u8bf7\u6c42\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5\u3002' }
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
