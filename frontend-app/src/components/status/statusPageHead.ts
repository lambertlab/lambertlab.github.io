export function buildStatusPageHead() {
  return {
    meta: [
      {
        title: 'Status | lambertlab',
      },
      {
        name: 'description',
        content:
          'Public trust page for lambertlab explaining system health boundaries, public surface availability, content freshness, and visitor-facing issues.',
      },
    ],
    links: [
      {
        rel: 'stylesheet' as const,
        href: '/css/page-status.css',
      },
      {
        rel: 'stylesheet' as const,
        href: '/css/theme-system.css',
      },
    ],
  }
}
