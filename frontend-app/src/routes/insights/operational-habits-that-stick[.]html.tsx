import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'

const TARGET_PATH = '/journal/operational-habits-that-stick/index.html'

export const Route = createFileRoute('/insights/operational-habits-that-stick.html')({
  head: () => ({
    meta: [
      {
        name: 'robots',
        content: 'noindex',
      },
    ],
  }),
  component: InsightOperationalHabitsThatStickRedirectPage,
})

function InsightOperationalHabitsThatStickRedirectPage() {
  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    window.location.replace(`${TARGET_PATH}${window.location.search}${window.location.hash}`)
  }, [])

  return (
    <main id="main-content">
      <p>页面已迁移到 Journal，正在跳转...</p>
      <p>
        <a href={TARGET_PATH}>如果没有自动跳转，请点击此链接。</a>
      </p>
    </main>
  )
}
