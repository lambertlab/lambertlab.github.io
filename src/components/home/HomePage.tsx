import * as React from 'react'
import { useHomeSplitLayout } from '~/components/home/hooks/useHomeSplitLayout'
import { useFeaturedProjects } from '~/features/projects/hooks/useFeaturedProjects'
import { FeaturedProjectsSection } from '~/features/projects/ui/FeaturedProjectsSection'
import { rootMetadata } from '~/lib/siteCopy'
import { useDocumentMetadata, useUiLocale } from '~/lib/uiLocale'

export function HomePage() {
  const { locale } = useUiLocale()
  const featuredProjectsState = useFeaturedProjects(3)

  useHomeSplitLayout(true)
  useDocumentMetadata(rootMetadata.title[locale], rootMetadata.description[locale])

  return (
    <main id="main-content" className="pt-32 pb-20 px-6">
      <section className="max-w-7xl mx-auto mb-16" id="about">
        <div className="max-w-4xl">
          <span className="accent-label text-brand-blue mb-4 block">Technology x Life</span>
          <h1 className="hero-title text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Building systems and <span className="text-brand-blue">tools.</span>
          </h1>
          <p className="text-xl text-slate-500 font-medium">
            构建系统与工具。致力于通过工程与美学的平衡创造价值。
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto">
        <div className="split-layout" data-split-layout>
          <section className="panel" data-purpose="tech-panel" data-home-managed-by-projects aria-label="Technology world">
            <div className="absolute inset-0 bg-grid pointer-events-none"></div>
            <div className="relative z-10 mb-10 flex justify-between items-end">
              <div>
                <span className="accent-label text-brand-blue">Workstream</span>
                <h2 className="text-3xl font-bold mt-1">Technology</h2>
              </div>
            </div>

            <FeaturedProjectsSection
              status={featuredProjectsState.status}
              projects={featuredProjectsState.projects}
              message={featuredProjectsState.message}
              onRetry={featuredProjectsState.retry}
              locale={locale}
              directoryHref="/projects/"
            />
          </section>

          <section className="panel" data-purpose="life-panel" aria-label="Life world">
            <div className="absolute inset-0 bg-organic pointer-events-none"></div>
            <div className="relative z-10 mb-10">
              <span className="accent-label text-emerald-600">Equilibrium</span>
              <h2 className="text-3xl font-bold mt-1">Life</h2>
            </div>

            <div className="panel-content-grid grid grid-cols-2 gap-4 flex-grow relative z-10">
              <article className="bento-card col-span-2 border-orange-100">
                <span className="accent-label text-orange-600">Reading</span>
                <h3 className="font-bold mt-1">Atomic Habits</h3>
                <p className="text-xs text-slate-500 mt-2">Systems &gt; Goals.</p>
                <span className="card-meta">content · reading</span>
              </article>

              <article className="bento-card border-emerald-100">
                <span className="accent-label text-emerald-600">Fitness</span>
                <h3 className="font-bold mt-1">Weekly Training</h3>
                <p className="text-xs text-slate-500 mt-2">Consistency compounds long-term health.</p>
                <span className="card-meta" data-meta-tone="positive">
                  routine
                </span>
              </article>

              <article className="bento-card border-slate-200">
                <span className="accent-label text-slate-600">Notes</span>
                <h3 className="font-bold mt-1">Journal</h3>
                <p className="text-xs text-slate-500 mt-2">持续记录工程与生活中的观察。</p>
                <a className="card-meta" data-meta-tone="neutral" href="/journal/">
                  open journal
                </a>
              </article>
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}