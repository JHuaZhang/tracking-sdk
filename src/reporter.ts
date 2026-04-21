import { ReportData, TrackingConfig } from './types';

export class Reporter {
  private buffer: ReportData[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private config: Required<TrackingConfig>;

  constructor(config: Required<TrackingConfig>) {
    this.config = config;
    this.startTimer();
    this.bindUnloadEvent();
  }

  addToBuffer(data: ReportData): void {
    this.buffer.push(data);
    if (this.buffer.length >= this.config.maxBatchSize) {
      this.flush();
    }
  }

  flush(): void {
    if (this.buffer.length === 0) return;

    const dataToSend = [...this.buffer];
    this.buffer = [];

    this.send(dataToSend);
  }

  isReportUrl(url: string): boolean {
    return url.includes(this.config.reportUrl);
  }

  destroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.flush();
  }

  private send(data: ReportData[]): void {
    const body = JSON.stringify(data);

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const success = navigator.sendBeacon(this.config.reportUrl, body);
      if (success) return;
    }

    this.sendByXhr(body);
  }

  private sendByXhr(body: string): void {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', this.config.reportUrl, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(body);
  }

  private startTimer(): void {
    this.timer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private bindUnloadEvent(): void {
    const handleUnload = () => {
      this.flush();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleUnload);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush();
        }
      });
    }
  }
}
