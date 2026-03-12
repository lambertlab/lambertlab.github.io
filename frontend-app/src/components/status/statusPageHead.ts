export function buildStatusPageHead() {
  return {
    meta: [
      {
        title: 'Status | lambertlab',
      },
      {
        name: 'description',
        content: 'Public trust page for lambertlab covering overall status, public surface availability, content freshness, and known notes.',
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
