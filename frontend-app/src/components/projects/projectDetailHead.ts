export function buildProjectDetailHead() {
  return {
    meta: [
      {
        title: 'Project Detail | lambertlab',
      },
      {
        name: 'description',
        content: 'LambertLab Projects detail skeleton powered by the unified project contract.',
      },
    ],
    links: [
      {
        rel: 'stylesheet' as const,
        href: '/css/page-project-detail.css',
      },
    ],
  }
}
