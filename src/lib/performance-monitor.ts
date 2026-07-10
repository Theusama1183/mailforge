export class PerformanceMonitor {
  private label: string;
  private startTime: number;

  constructor(label: string) {
    this.label = label;
    this.startTime = performance.now();
  }

  end(): void {
    const duration = this.getDuration();
    console.log(JSON.stringify({
      label: this.label,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    }));
  }

  getDuration(): number {
    return performance.now() - this.startTime;
  }
}

export async function monitorHandler(
  handler: Function,
  label: string
): Promise<Response> {
  const monitor = new PerformanceMonitor(label);
  try {
    const response = await handler();
    const duration = monitor.getDuration();
    if (duration > 1000) {
      console.warn(
        JSON.stringify({
          level: "warn",
          label,
          duration_ms: duration,
          timestamp: new Date().toISOString(),
          message: "Handler execution exceeded 1 second threshold",
        })
      );
    } else {
      monitor.end();
    }
    const headers = new Headers(response.headers);
    headers.set("X-Response-Time", `${duration}ms`);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    const duration = monitor.getDuration();
    console.error(
      JSON.stringify({
        level: "error",
        label,
        duration_ms: duration,
        timestamp: new Date().toISOString(),
        error: String(error),
      })
    );
    throw error;
  }
}

export function trackPageLoad(pageName: string, durationMs: number): void {
  console.log(
    JSON.stringify({
      event: "page_load",
      page: pageName,
      duration_ms: durationMs,
      timestamp: new Date().toISOString(),
    })
  );
}
