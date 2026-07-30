function combineAbortSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }
    signal.addEventListener("abort", () => controller.abort(signal.reason), {
      once: true,
    });
  }
  return controller.signal;
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number,
  signal?: AbortSignal,
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        const backoff = Math.min(1000 * Math.pow(2, attempt - 1), 4000);
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
      const response = await fetch(url, { ...options, signal });
      if (response.ok || response.status < 500) {
        return response;
      }
      if (attempt === retries) return response;
    } catch (err) {
      if (attempt === retries) throw err;
    }
  }
  throw new Error("All retries exhausted");
}

export { fetchWithRetry, combineAbortSignals };
