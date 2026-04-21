import { TrackingPlugin, TrackingCore } from '../types';

export class PerformancePlugin implements TrackingPlugin {
  name = 'performance';
  private core: TrackingCore | null = null;

  install(core: TrackingCore): void {
    this.core = core;

    if (typeof window === 'undefined' || !window.performance) return;

    if (document.readyState === 'complete') {
      this.collectNavigationTiming();
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => this.collectNavigationTiming(), 0);
      });
    }

    this.observeWebVitals();
  }

  uninstall(): void {
    this.core = null;
  }

  private collectNavigationTiming(): void {
    if (!this.core) return;

    const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (entries.length === 0) return;

    const timing = entries[0];

    this.core.report({
      type: 'performance',
      data: {
        dns: Math.round(timing.domainLookupEnd - timing.domainLookupStart),
        tcp: Math.round(timing.connectEnd - timing.connectStart),
        ttfb: Math.round(timing.responseStart - timing.requestStart),
        domParse: Math.round(timing.domInteractive - timing.responseEnd),
        loadTime: Math.round(timing.loadEventStart - timing.fetchStart),
      },
    });
  }

  private observeWebVitals(): void {
    if (typeof PerformanceObserver === 'undefined') return;

    // FCP
    try {
      const fcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        for (const entry of entries) {
          if (entry.name === 'first-contentful-paint') {
            this.core?.report({
              type: 'performance',
              data: { fcp: Math.round(entry.startTime) },
            });
            fcpObserver.disconnect();
          }
        }
      });
      fcpObserver.observe({ type: 'paint', buffered: true });
    } catch {
      // PerformanceObserver not supported for paint
    }

    // LCP
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.core?.report({
            type: 'performance',
            data: { lcp: Math.round(lastEntry.startTime) },
          });
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // 页面隐藏时断开 LCP 观察
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          lcpObserver.disconnect();
        }
      }, { once: true });
    } catch {
      // PerformanceObserver not supported for LCP
    }
  }
}
