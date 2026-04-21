import { TrackingPlugin, TrackingCore } from '../types';

export class ApiPlugin implements TrackingPlugin {
  name = 'api';
  private core: TrackingCore | null = null;
  private originalXhrOpen: typeof XMLHttpRequest.prototype.open | null = null;
  private originalXhrSend: typeof XMLHttpRequest.prototype.send | null = null;
  private originalFetch: typeof window.fetch | null = null;

  install(core: TrackingCore): void {
    this.core = core;

    if (typeof window === 'undefined') return;

    this.hookXhr();
    this.hookFetch();
  }

  uninstall(): void {
    if (typeof window !== 'undefined') {
      if (this.originalXhrOpen) {
        XMLHttpRequest.prototype.open = this.originalXhrOpen;
      }
      if (this.originalXhrSend) {
        XMLHttpRequest.prototype.send = this.originalXhrSend;
      }
      if (this.originalFetch) {
        window.fetch = this.originalFetch;
      }
    }
    this.core = null;
  }

  private hookXhr(): void {
    const self = this;
    this.originalXhrOpen = XMLHttpRequest.prototype.open;
    this.originalXhrSend = XMLHttpRequest.prototype.send;

    const originalOpen = this.originalXhrOpen;
    const originalSend = this.originalXhrSend;

    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      ...args: any[]
    ) {
      (this as any).__tracking_method = method;
      (this as any).__tracking_url = url.toString();
      return originalOpen.apply(this, [method, url, ...args] as any);
    };

    XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
      const requestUrl = (this as any).__tracking_url || '';
      const requestMethod = (this as any).__tracking_method || 'GET';

      // 过滤 SDK 自身请求
      if (self.core?.isReportUrl(requestUrl)) {
        return originalSend.call(this, body);
      }

      const startTime = Date.now();

      this.addEventListener('loadend', function () {
        const duration = Date.now() - startTime;
        const statusCode = this.status;
        const success = statusCode >= 200 && statusCode < 400;

        self.core?.report({
          type: 'api',
          data: {
            url: requestUrl,
            method: requestMethod,
            statusCode,
            duration,
            success,
          },
        });
      });

      return originalSend.call(this, body);
    };
  }

  private hookFetch(): void {
    if (typeof window.fetch !== 'function') return;

    const self = this;
    this.originalFetch = window.fetch;
    const originalFetch = this.originalFetch;

    window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
      const method = init?.method || (input instanceof Request ? input.method : 'GET');

      // 过滤 SDK 自身请求
      if (self.core?.isReportUrl(url)) {
        return originalFetch.call(window, input, init);
      }

      const startTime = Date.now();

      return originalFetch.call(window, input, init).then(
        (response) => {
          const duration = Date.now() - startTime;
          self.core?.report({
            type: 'api',
            data: {
              url,
              method: method.toUpperCase(),
              statusCode: response.status,
              duration,
              success: response.ok,
            },
          });
          return response;
        },
        (error) => {
          const duration = Date.now() - startTime;
          self.core?.report({
            type: 'api',
            data: {
              url,
              method: method.toUpperCase(),
              statusCode: 0,
              duration,
              success: false,
            },
          });
          throw error;
        }
      );
    };
  }
}
