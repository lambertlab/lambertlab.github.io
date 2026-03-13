import * as React from 'react'

export function useRuntimeScripts(scriptSources: readonly string[]) {
  React.useEffect(() => {
    if (scriptSources.length === 0) {
      return
    }

    const mountedScripts: HTMLScriptElement[] = []

    for (const scriptSrc of scriptSources) {
      const existing = document.querySelector(`script[data-ll-runtime-script="${scriptSrc}"]`)
      if (existing instanceof HTMLScriptElement) {
        continue
      }

      const script = document.createElement('script')
      script.src = scriptSrc
      script.async = false
      script.dataset.llRuntimeScript = scriptSrc
      mountedScripts.push(script)
      document.body.appendChild(script)
    }

    return () => {
      for (const script of mountedScripts) {
        script.remove()
      }
    }
  }, [scriptSources])
}
