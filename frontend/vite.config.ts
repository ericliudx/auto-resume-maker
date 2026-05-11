import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs/promises'
import path from 'node:path'

type LlmChatRequest = {
  system: string
  user: string
  model?: string
  temperature?: number
}

type BioBankResponse =
  | {
      ok: true
      result: {
        experiences: unknown[]
        projects: unknown[]
        education: unknown[]
        skills: unknown[]
      }
    }
  | { ok: false; error: { code: 'not_found' | 'bad_request' | 'server_error'; message: string } }

type BioContactResponse =
  | {
      ok: true
      result: {
        name: string
        location: string
        phone: string
        email: string
        linkedin: string
      }
    }
  | { ok: false; error: { code: 'not_found' | 'bad_request' | 'server_error'; message: string } }

type LlmChatSuccess = {
  ok: true
  result: {
    text: string
    model: string
    usage?: {
      inputTokens: number
      outputTokens: number
    }
  }
}

type LlmChatError = {
  ok: false
  error: {
    code:
      | 'missing_api_key'
      | 'invalid_api_key'
      | 'rate_limited'
      | 'timeout'
      | 'provider_error'
      | 'bad_request'
    message: string
  }
}

function createLlmApiPlugin(env: Record<string, string>): Plugin {
  const groqApiKey = env.GROQ_API_KEY
  const defaultModel = env.GROQ_MODEL || 'llama-3.1-8b-instant'

  return {
    name: 'local-llm-api',
    configureServer(server) {
      server.middlewares.use('/api/llm/chat', async (req, res) => {
        try {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.setHeader('content-type', 'application/json')
            res.end(
              JSON.stringify({
                ok: false,
                error: { code: 'bad_request', message: 'Method not allowed.' },
              } satisfies LlmChatError),
            )
            return
          }

          if (!groqApiKey) {
            res.statusCode = 500
            res.setHeader('content-type', 'application/json')
            res.end(
              JSON.stringify({
                ok: false,
                error: {
                  code: 'missing_api_key',
                  message: 'Missing GROQ_API_KEY in server environment.',
                },
              } satisfies LlmChatError),
            )
            return
          }

          const bodyText = await readBody(req)
          const parsed = safeJsonParse(bodyText)
          if (!parsed.ok) {
            res.statusCode = 400
            res.setHeader('content-type', 'application/json')
            res.end(
              JSON.stringify({
                ok: false,
                error: { code: 'bad_request', message: 'Invalid JSON body.' },
              } satisfies LlmChatError),
            )
            return
          }

          const reqBody = parsed.value as Partial<LlmChatRequest>
          if (typeof reqBody.system !== 'string' || typeof reqBody.user !== 'string') {
            res.statusCode = 400
            res.setHeader('content-type', 'application/json')
            res.end(
              JSON.stringify({
                ok: false,
                error: {
                  code: 'bad_request',
                  message: '`system` and `user` must be strings.',
                },
              } satisfies LlmChatError),
            )
            return
          }

          const model =
            typeof reqBody.model === 'string' && reqBody.model.trim() !== ''
              ? reqBody.model
              : defaultModel

          const temperature =
            typeof reqBody.temperature === 'number' ? reqBody.temperature : 0.2

          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 25_000)

          let upstreamRes: Response
          try {
            upstreamRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              signal: controller.signal,
              headers: {
                authorization: `Bearer ${groqApiKey}`,
                'content-type': 'application/json',
              },
              body: JSON.stringify({
                model,
                temperature,
                messages: [
                  { role: 'system', content: reqBody.system },
                  { role: 'user', content: reqBody.user },
                ],
              }),
            })
          } catch (e) {
            const isAbort =
              e instanceof Error &&
              (e.name === 'AbortError' || e.message.toLowerCase().includes('aborted'))
            res.statusCode = 504
            res.setHeader('content-type', 'application/json')
            res.end(
              JSON.stringify({
                ok: false,
                error: {
                  code: isAbort ? 'timeout' : 'provider_error',
                  message: isAbort ? 'Request to provider timed out.' : 'Failed to reach provider.',
                },
              } satisfies LlmChatError),
            )
            return
          } finally {
            clearTimeout(timeout)
          }

          const upstreamText = await upstreamRes.text()
          const upstreamJson = safeJsonParse(upstreamText)

          if (upstreamRes.status === 401 || upstreamRes.status === 403) {
            res.statusCode = 502
            res.setHeader('content-type', 'application/json')
            res.end(
              JSON.stringify({
                ok: false,
                error: {
                  code: 'invalid_api_key',
                  message: 'Provider rejected credentials (check GROQ_API_KEY).',
                },
              } satisfies LlmChatError),
            )
            return
          }

          if (upstreamRes.status === 429) {
            res.statusCode = 503
            res.setHeader('content-type', 'application/json')
            res.end(
              JSON.stringify({
                ok: false,
                error: { code: 'rate_limited', message: 'Provider rate limit reached.' },
              } satisfies LlmChatError),
            )
            return
          }

          if (!upstreamRes.ok || !upstreamJson.ok) {
            res.statusCode = 502
            res.setHeader('content-type', 'application/json')
            res.end(
              JSON.stringify({
                ok: false,
                error: {
                  code: 'provider_error',
                  message: `Provider error (${upstreamRes.status}).`,
                },
              } satisfies LlmChatError),
            )
            return
          }

          const upstream = upstreamJson.value as {
            choices?: Array<{ message?: { content?: unknown } }>
            usage?: { prompt_tokens?: unknown; completion_tokens?: unknown }
          }

          const text: unknown = upstream.choices?.[0]?.message?.content
          if (typeof text !== 'string') {
            res.statusCode = 502
            res.setHeader('content-type', 'application/json')
            res.end(
              JSON.stringify({
                ok: false,
                error: { code: 'provider_error', message: 'Provider response missing text.' },
              } satisfies LlmChatError),
            )
            return
          }

          const promptTokens: unknown = upstream.usage?.prompt_tokens
          const completionTokens: unknown = upstream.usage?.completion_tokens

          const success: LlmChatSuccess = {
            ok: true,
            result: {
              text,
              model,
              usage:
                typeof promptTokens === 'number' && typeof completionTokens === 'number'
                  ? { inputTokens: promptTokens, outputTokens: completionTokens }
                  : undefined,
            },
          }

          res.statusCode = 200
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify(success))
        } catch {
          res.statusCode = 500
          res.setHeader('content-type', 'application/json')
          res.end(
            JSON.stringify({
              ok: false,
              error: { code: 'provider_error', message: 'Unexpected server error.' },
            } satisfies LlmChatError),
          )
        }
      })
    },
  }
}

function createBioApiPlugin(): Plugin {
  const bioRoot = path.resolve(process.cwd(), '..', 'bio')

  async function readJsonDir(dir: string): Promise<unknown[]> {
    const full = path.join(bioRoot, dir)
    let names: string[]
    try {
      names = await fs.readdir(full)
    } catch {
      return []
    }

    const jsonNames = names.filter((n) => n.toLowerCase().endsWith('.json')).sort()
    const docs = await Promise.all(
      jsonNames.map(async (name) => {
        const p = path.join(full, name)
        const text = await fs.readFile(p, 'utf8')
        return JSON.parse(text) as unknown
      }),
    )
    return docs
  }

  return {
    name: 'local-bio-api',
    configureServer(server) {
      server.middlewares.use('/api/bio/contact', async (req, res) => {
        try {
          if (req.method !== 'GET') {
            res.statusCode = 405
            res.setHeader('content-type', 'application/json')
            res.end(
              JSON.stringify({
                ok: false,
                error: { code: 'bad_request', message: 'Method not allowed.' },
              } satisfies BioContactResponse),
            )
            return
          }

          const p = path.join(bioRoot, 'contact.json')
          let text: string
          try {
            text = await fs.readFile(p, 'utf8')
          } catch {
            res.statusCode = 404
            res.setHeader('content-type', 'application/json')
            res.end(
              JSON.stringify({
                ok: false,
                error: { code: 'not_found', message: 'Missing bio/contact.json.' },
              } satisfies BioContactResponse),
            )
            return
          }

          const parsed = safeJsonParse(text)
          if (!parsed.ok || typeof parsed.value !== 'object' || parsed.value === null) {
            res.statusCode = 500
            res.setHeader('content-type', 'application/json')
            res.end(
              JSON.stringify({
                ok: false,
                error: { code: 'server_error', message: 'Invalid contact.json.' },
              } satisfies BioContactResponse),
            )
            return
          }

          res.statusCode = 200
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ ok: true, result: parsed.value } satisfies BioContactResponse))
        } catch {
          res.statusCode = 500
          res.setHeader('content-type', 'application/json')
          res.end(
            JSON.stringify({
              ok: false,
              error: { code: 'server_error', message: 'Failed to read contact.' },
            } satisfies BioContactResponse),
          )
        }
      })

      server.middlewares.use('/api/bio/bank', async (req, res) => {
        try {
          if (req.method !== 'GET') {
            res.statusCode = 405
            res.setHeader('content-type', 'application/json')
            res.end(
              JSON.stringify({
                ok: false,
                error: { code: 'bad_request', message: 'Method not allowed.' },
              } satisfies BioBankResponse),
            )
            return
          }

          const [experiences, projects, education, skills] = await Promise.all([
            readJsonDir('experiences'),
            readJsonDir('projects'),
            readJsonDir('education'),
            readJsonDir('skills'),
          ])

          res.statusCode = 200
          res.setHeader('content-type', 'application/json')
          res.end(
            JSON.stringify({
              ok: true,
              result: { experiences, projects, education, skills },
            } satisfies BioBankResponse),
          )
        } catch {
          res.statusCode = 500
          res.setHeader('content-type', 'application/json')
          res.end(
            JSON.stringify({
              ok: false,
              error: { code: 'server_error', message: 'Failed to read bio bank.' },
            } satisfies BioBankResponse),
          )
        }
      })
    },
  }
}

function readBody(req: import('http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function safeJsonParse(text: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) as unknown }
  } catch {
    return { ok: false }
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), createLlmApiPlugin(env), createBioApiPlugin()],
  }
})
