import { TrackingPlugin, TrackingCore, ReportData } from '../types';

interface BufferedEvent {
  data: Omit<ReportData, 'appKey' | 'timestamp' | 'pageUrl' | 'userAgent' | 'userId'>;
}

export class CustomPlugin implements TrackingPlugin {
  name = 'custom';
  private core: TrackingCore | null = null;
  private clickHandler: ((event: MouseEvent) => void) | null = null;
  private eventBuffer: BufferedEvent[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private aggregateInterval = 0;

  install(core: TrackingCore): void {
    this.core = core;
    this.aggregateInterval = core.config.customFlushInterval;

    if (typeof window === 'undefined') return;

    if (core.config.enableAutoClick) {
      this.listenAutoClick();
    }

    // 页面离开时立即刷新缓冲区
    if (this.aggregateInterval > 0) {
      window.addEventListener('beforeunload', () => this.flushBuffer());
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flushBuffer();
        }
      });
    }
  }

  uninstall(): void {
    this.flushBuffer();
    if (typeof window !== 'undefined' && this.clickHandler) {
      document.removeEventListener('click', this.clickHandler, true);
    }
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.core = null;
  }

  /**
   * 将自定义事件加入聚合缓冲区。
   * 如果 customFlushInterval > 0，事件会被攒在缓冲区内，窗口结束后一次性上报。
   * 如果 customFlushInterval = 0，立即上报。
   */
  bufferEvent(data: Omit<ReportData, 'appKey' | 'timestamp' | 'pageUrl' | 'userAgent' | 'userId'>): void {
    if (!this.core) return;

    if (this.aggregateInterval <= 0) {
      this.core.report(data);
      return;
    }

    this.eventBuffer.push({ data });

    // 首个事件进入时启动定时器
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flushBuffer();
      }, this.aggregateInterval);
    }
  }

  /**
   * 将缓冲区内的所有事件汇总成一条 batch 请求上报
   */
  private flushBuffer(): void {
    if (!this.core || this.eventBuffer.length === 0) return;

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    const events = this.eventBuffer.map(item => item.data.data);
    this.eventBuffer = [];

    // 汇总成一条 custom_batch 事件上报
    this.core.report({
      type: 'custom',
      data: {
        eventName: '__batch__',
        eventType: 'batch',
        events,
        batchSize: events.length,
      },
    });
  }

  /**
   * 自动采集带 data-track 属性的元素点击事件
   */
  private listenAutoClick(): void {
    this.clickHandler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      const trackElement = this.findTrackElement(target, 5);
      if (!trackElement) return;

      const eventName = trackElement.getAttribute('data-track');
      if (!eventName) return;

      let extra: Record<string, any> = {};
      const extraAttr = trackElement.getAttribute('data-track-extra');
      if (extraAttr) {
        try {
          extra = JSON.parse(extraAttr);
        } catch {
          // 解析失败则忽略 extra
        }
      }

      this.bufferEvent({
        type: 'custom',
        data: {
          eventName,
          eventType: 'click',
          tagName: trackElement.tagName.toLowerCase(),
          elementText: (trackElement.textContent || '').trim().slice(0, 200),
          ...extra,
        },
      });
    };

    document.addEventListener('click', this.clickHandler, true);
  }

  private findTrackElement(element: HTMLElement, maxDepth: number): HTMLElement | null {
    let current: HTMLElement | null = element;
    let depth = 0;
    while (current && depth < maxDepth) {
      if (current.hasAttribute('data-track')) {
        return current;
      }
      current = current.parentElement;
      depth++;
    }
    return null;
  }
}
