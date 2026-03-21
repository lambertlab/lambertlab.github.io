import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const args = new Set(process.argv.slice(2))
const cwd = process.cwd()
const outputDir = path.resolve(cwd, '.output')
const startedAt = Date.now()
const runtime = detectRuntime()

main().catch((error) => {
  const details = formatError(error)
  console.error(`[build] Failed: ${details}`)
  if (error?.hint) {
    console.error(`[build] Hint: ${error.hint}`)
  }
  process.exitCode = 1
})

async function main() {
  printEnvironment(runtime)

  if (args.has('--print-env')) {
    return
  }

  await prepareOutputDirectory()
  await runCommand(resolveLocalBin('vite'), ['build'], 'vite build', {
    retries: 1,
    shouldRetry: shouldRetryViteBuild,
    beforeRetry: async (attempt) => {
      console.warn(`[build] Re-preparing .output before vite build retry ${attempt + 1}.`)
      await prepareOutputDirectory()
    },
  })
  await runCommand(resolveLocalBin('tsc'), ['--noEmit'], 'tsc --noEmit')

  const elapsed = Date.now() - startedAt
  console.log(`[build] Completed successfully in ${formatDuration(elapsed)}.`)
}

function detectRuntime() {
  const platform = process.platform
  const family =
    platform === 'win32'
      ? 'windows'
      : platform === 'darwin'
        ? 'macos'
        : platform === 'linux'
          ? 'linux'
          : 'unknown'

  return {
    family,
    platform,
    label:
      family === 'windows'
        ? 'Windows'
        : family === 'macos'
          ? 'macOS'
          : family === 'linux'
            ? 'Linux'
            : platform,
    release: os.release(),
    arch: os.arch(),
    node: process.version,
    shell: process.env.SHELL || process.env.ComSpec || 'unknown',
    isCi: Boolean(process.env.CI),
    isWsl: platform === 'linux' && os.release().toLowerCase().includes('microsoft'),
  }
}

function printEnvironment(currentRuntime) {
  const wslSuffix = currentRuntime.isWsl ? ' (WSL)' : ''
  console.log(`[build] Environment: ${currentRuntime.label}${wslSuffix} ${currentRuntime.release} (${currentRuntime.arch}), Node ${currentRuntime.node}.`)
  console.log(`[build] Shell: ${currentRuntime.shell}`)
  console.log(`[build] Output directory: ${outputDir}`)
  console.log(`[build] Cleanup strategy: ${describeCleanupStrategy(currentRuntime.family)}`)
}

function describeCleanupStrategy(family) {
  if (family === 'windows') {
    return 'pre-clean .output with retry + rename fallback for transient file locks'
  }
  if (family === 'macos') {
    return 'pre-clean .output with retry for transient busy files'
  }
  if (family === 'linux') {
    return 'pre-clean .output with retry for transient busy files'
  }
  return 'pre-clean .output with generic retry handling'
}

async function prepareOutputDirectory() {
  if (!(await pathExists(outputDir))) {
    console.log('[build] No existing .output directory detected.')
    return
  }

  console.log('[build] Found existing .output directory, preparing a clean build surface...')

  const attempts = runtime.family === 'windows' ? 8 : 5
  const delayMs = runtime.family === 'windows' ? 250 : 120
  let lastError = null

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await fs.rm(outputDir, {
        recursive: true,
        force: true,
        maxRetries: runtime.family === 'windows' ? 3 : 1,
        retryDelay: delayMs,
      })

      if (!(await pathExists(outputDir))) {
        console.log(`[build] Cleared .output on attempt ${attempt}/${attempts}.`)
        return
      }
    } catch (error) {
      lastError = error
      console.warn(`[build] Cleanup attempt ${attempt}/${attempts} hit ${formatError(error)}.`)
    }

    const renamedDir = await tryRenameStaleOutput(attempt)
    if (renamedDir) {
      console.warn(`[build] Renamed stale .output to ${path.basename(renamedDir)} to unblock the next build.`)
      await removeRenamedDirectory(renamedDir)
      return
    }

    if (attempt < attempts) {
      await sleep(delayMs * attempt)
    }
  }

  const finalError = new Error(`Unable to prepare ${outputDir} after ${attempts} attempts.`)
  finalError.cause = lastError
  finalError.hint = runtime.family === 'windows'
    ? 'Close preview windows, Explorer tabs, or antivirus scans that may still be touching .output, then retry.'
    : 'Close any preview or watcher process that may still be touching .output, then retry.'
  throw finalError
}

async function tryRenameStaleOutput(attempt) {
  if (!(await pathExists(outputDir))) {
    return null
  }

  const renamedDir = path.resolve(cwd, `.output.stale.${Date.now()}.${attempt}`)

  try {
    await fs.rename(outputDir, renamedDir)
    return renamedDir
  } catch {
    return null
  }
}

async function removeRenamedDirectory(renamedDir) {
  try {
    await fs.rm(renamedDir, {
      recursive: true,
      force: true,
      maxRetries: runtime.family === 'windows' ? 3 : 1,
      retryDelay: runtime.family === 'windows' ? 250 : 120,
    })
    console.log(`[build] Removed ${path.basename(renamedDir)}.`)
  } catch (error) {
    console.warn(`[build] Deferred cleanup for ${path.basename(renamedDir)}: ${formatError(error)}.`)
  }
}

async function runCommand(command, commandArgs, label, options = {}) {
  const retries = options.retries ?? 0

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const retrySuffix = attempt > 0 ? ` (retry ${attempt}/${retries})` : ''
    console.log(`[build] Running ${label}${retrySuffix}...`)

    try {
      await runCommandOnce(command, commandArgs, label)
      return
    } catch (error) {
      const shouldRetry = attempt < retries && options.shouldRetry?.(error)
      if (!shouldRetry) {
        throw error
      }

      console.warn(`[build] Retrying ${label} after transient prerender startup failure.`)
      if (options.beforeRetry) {
        await options.beforeRetry(attempt)
      }
    }
  }
}

async function runCommandOnce(command, commandArgs, label) {
  let combinedOutput = ''

  await new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      cwd,
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: runtime.family === 'windows',
      env: {
        ...process.env,
      },
    })

    const handleChunk = (stream, chunk) => {
      const text = chunk.toString()
      combinedOutput += text
      stream.write(chunk)
    }

    child.stdout?.on('data', (chunk) => handleChunk(process.stdout, chunk))
    child.stderr?.on('data', (chunk) => handleChunk(process.stderr, chunk))

    child.on('error', (error) => {
      reject(new Error(`Failed to launch ${label}: ${formatError(error)}`))
    })

    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve()
        return
      }

      if (signal) {
        const error = new Error(`${label} exited via signal ${signal}.`)
        error.output = combinedOutput
        reject(error)
        return
      }

      const error = new Error(`${label} exited with code ${code ?? 'unknown'}.`)
      error.output = combinedOutput
      reject(error)
    })
  })
}

function shouldRetryViteBuild(error) {
  const output = typeof error?.output === 'string' ? error.output : ''
  return (
    output.includes('Failed to start the Vite preview server for prerendering')
    || output.includes('Timeout waiting for port ')
  )
}

function resolveLocalBin(binName) {
  const executable = runtime.family === 'windows' ? `${binName}.cmd` : binName
  return path.resolve(cwd, 'node_modules', '.bin', executable)
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function formatDuration(ms) {
  if (ms < 1000) {
    return `${ms}ms`
  }

  return `${(ms / 1000).toFixed(1)}s`
}

function formatError(error) {
  if (!error) {
    return 'Unknown error'
  }

  const code = typeof error === 'object' && error && 'code' in error ? error.code : null
  const message = error instanceof Error ? error.message : String(error)
  return code ? `${code}: ${message}` : message
}
