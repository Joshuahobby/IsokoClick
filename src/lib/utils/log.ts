// Minimal server-side error logger. Sentry is not installed yet; when it
// is, route this through Sentry.captureException so the no-console rule
// holds in production. Until then this is the single choke point.
export function logError(context: string, error: unknown): void {
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${context}]`, error)
  }
  // TODO(sentry): Sentry.captureException(error, { tags: { context } })
}
