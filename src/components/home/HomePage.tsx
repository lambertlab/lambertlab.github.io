import * as React from 'react'
import { LifeCardsSection } from '~/components/home/LifeCardsSection'
import { useHomeSplitLayout } from '~/components/home/hooks/useHomeSplitLayout'
import { useHomeLifeCards } from '~/components/home/hooks/useHomeLifeCards'
import { useFeaturedProjects } from '~/features/projects/hooks/useFeaturedProjects'
import { FeaturedProjectsSection } from '~/features/projects/ui/FeaturedProjectsSection'
import { rootMetadata } from '~/lib/siteCopy'
import { useDocumentMetadata, useUiLocale } from '~/lib/uiLocale'

export function HomePage() {
  const { locale } = useUiLocale()
  const featuredProjectsState = useFeaturedProjects(3)
  const lifeCardsState = useHomeLifeCards()

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
          <p className="text-xl text-slate-500 font-medium">{'\u6784\u5efa\u7cfb\u7edf\u4e0e\u5de5\u5177\u3002\u81f4\u529b\u4e8e\u901a\u8fc7\u5de5\u7a0b\u4e0e\u7f8e\u5b66\u7684\u5e73\u8861\u521b\u9020\u4ef7\u503c\u3002'}</p>
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

            <LifeCardsSection
              status={lifeCardsState.status}
              cards={lifeCardsState.cards}
              message={lifeCardsState.message}
              onRetry={lifeCardsState.retry}
              locale={locale}
            />
          </section>
        </div>
      </section>
    </main>
  )
}
