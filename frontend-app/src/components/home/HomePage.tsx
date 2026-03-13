import * as React from 'react'
import { useHomeSplitLayout } from '~/legacy/useHomeSplitLayout'
import { rootMetadata } from '~/lib/siteCopy'
import { useRuntimeScripts } from '~/lib/useRuntimeScripts'
import { useDocumentMetadata, useUiLocale } from '~/lib/uiLocale'

const HOME_RUNTIME_SCRIPTS = ['/js/projects-runtime.js', '/js/home-featured-projects.js'] as const

export function HomePage() {
  const { locale } = useUiLocale()

  useHomeSplitLayout(true)
  useRuntimeScripts(HOME_RUNTIME_SCRIPTS)
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

            <div className="panel-content-grid grid grid-cols-2 gap-4 flex-grow relative z-10" data-home-featured-projects>
              <a
                className="bento-card col-span-2 flex justify-between items-center group featured-project-card featured-project-card-hero"
                data-home-featured-slot="0"
                href="/projects/"
                aria-busy="true"
              >
                <div className="featured-project-copy">
                  <span className="accent-label text-blue-600" data-project-rank>
                    Featured Projects
                  </span>
                  <h3 className="font-bold text-lg" data-project-name>
                    Loading featured project
                  </h3>
                  <p className="text-xs text-slate-500 mt-2" data-project-summary>
                    正在从统一 Projects 真相源加载首页精选。
                  </p>
                  <div className="featured-chip-row">
                    <span className="card-meta" data-project-stage>
                      Loading
                    </span>
                    <span className="card-meta" data-meta-tone="neutral" data-project-type>
                      Type pending
                    </span>
                    <span className="card-meta" data-meta-tone="neutral" data-project-source>
                      Source pending
                    </span>
                  </div>
                </div>
                <div className="featured-project-arrow" aria-hidden="true">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M17 8l4 4m0 0l-4 4m4-4H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
              </a>

              <a className="bento-card featured-project-card" data-home-featured-slot="1" href="/projects/" aria-busy="true">
                <span className="accent-label text-slate-400" data-project-rank>
                  Featured Projects
                </span>
                <h3 className="font-bold mt-1" data-project-name>
                  Loading next featured project
                </h3>
                <p className="text-xs text-slate-500 mt-2" data-project-summary>
                  目录精选会与首页卡片保持同一字段口径。
                </p>
                <div className="featured-chip-row">
                  <span className="card-meta" data-project-stage>
                    Loading
                  </span>
                  <span className="card-meta" data-meta-tone="neutral" data-project-type>
                    Type pending
                  </span>
                </div>
              </a>

              <a className="bento-card featured-project-card" data-home-featured-slot="2" href="/projects/" aria-busy="true">
                <span className="accent-label text-slate-400" data-project-rank>
                  Featured Projects
                </span>
                <h3 className="font-bold mt-1" data-project-name>
                  Loading featured project
                </h3>
                <p className="text-xs text-slate-500 mt-2" data-project-summary>
                  主动作将统一进入详情主路径。
                </p>
                <div className="featured-chip-row">
                  <span className="card-meta" data-project-stage>
                    Loading
                  </span>
                  <span className="card-meta" data-meta-tone="neutral" data-project-type>
                    Type pending
                  </span>
                </div>
              </a>

              <a className="bento-card col-span-2 featured-directory-card" href="/projects/">
                <span className="accent-label text-slate-400">Project Directory</span>
                <h3 className="font-bold mt-1">Browse All Projects</h3>
                <p className="text-xs text-slate-500 mt-2">
                  打开完整目录，继续使用搜索、筛选、URL Replay 与详情入口。
                </p>
                <span className="card-meta" data-meta-tone="neutral">
                  entry · catalog
                </span>
              </a>
            </div>
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
                <a className="card-meta" data-meta-tone="neutral" href="/journal/index.html">
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
