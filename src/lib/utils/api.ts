export function apiResponse<T>(data: T, status = 200): Response {
  return Response.json(
    {
      data,
      error: null,
      meta: { timestamp: new Date().toISOString(), requestId: crypto.randomUUID() },
    },
    { status }
  )
}

export function apiError(message: string, status = 400): Response {
  return Response.json(
    {
      data: null,
      error: message,
      meta: { timestamp: new Date().toISOString(), requestId: crypto.randomUUID() },
    },
    { status }
  )
}
