const BASE_URL = "https://api.inngest.com";

interface InngestRequestOptions {
  method?: string;
  path: string;
  signingKey: string;
  params?: Record<string, string | number | undefined>;
  body?: unknown;
}

interface PageInfo {
  cursor?: string;
  hasMore?: boolean;
  limit?: number;
}

interface ApiResponse<T> {
  data: T;
  metadata?: {
    fetched_at: string;
    cached_until?: string;
  };
  page?: PageInfo;
}

export interface InngestEvent {
  id: string;
  name: string;
  data: unknown;
  user?: unknown;
  ts: number;
  received_at: string;
}

export interface InngestRun {
  run_id: string;
  status: string;
  function_id?: string;
  output?: unknown;
  ended_at?: string;
  started_at?: string;
}

export interface InngestFunction {
  id: string;
  name: string;
  slug: string;
  triggers: unknown[];
  config?: unknown;
}

export interface InngestCancellation {
  id: string;
  app_id: string;
  function_id: string;
  started_after: string;
  started_before: string;
  if?: string;
  created_at?: string;
}

async function request<T>(options: InngestRequestOptions): Promise<ApiResponse<T>> {
  const url = new URL(`${BASE_URL}${options.path}`);

  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(url.toString(), {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${options.signingKey}`,
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Inngest API ${response.status}: ${text}`);
  }

  return response.json() as Promise<ApiResponse<T>>;
}

export function listEvents(
  signingKey: string,
  params?: {
    limit?: number;
    cursor?: string;
    name?: string;
    received_after?: string;
    received_before?: string;
  }
) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return request<InngestEvent[]>({
    path: "/v1/events",
    signingKey,
    params: {
      ...params,
      received_after: params?.received_after ?? sevenDaysAgo.toISOString(),
      received_before: params?.received_before ?? now.toISOString(),
    },
  });
}

export function getEvent(signingKey: string, eventId: string) {
  return request<InngestEvent>({
    path: `/v1/events/${eventId}`,
    signingKey,
  });
}

export function getEventRuns(signingKey: string, eventId: string) {
  return request<InngestRun[]>({
    path: `/v1/events/${eventId}/runs`,
    signingKey,
  });
}

export function getRun(signingKey: string, runId: string) {
  return request<InngestRun>({
    path: `/v1/runs/${runId}`,
    signingKey,
  });
}

export function cancelRun(signingKey: string, runId: string) {
  return request<{ message: string }>({
    path: `/v1/runs/${runId}`,
    signingKey,
    method: "DELETE",
  });
}

export function listFunctions(signingKey: string, appName: string) {
  return request<InngestFunction[]>({
    path: `/v1/apps/${appName}/functions`,
    signingKey,
  });
}

export function createCancellation(
  signingKey: string,
  params: {
    app_id: string;
    function_id: string;
    started_after: string;
    started_before: string;
    if?: string;
  }
) {
  return request<InngestCancellation>({
    path: "/v1/cancellations",
    signingKey,
    method: "POST",
    body: params,
  });
}

export function listCancellations(signingKey: string) {
  return request<InngestCancellation[]>({
    path: "/v1/cancellations",
    signingKey,
  });
}
