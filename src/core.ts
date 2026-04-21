import { TrackingConfig, ReportData, TrackingPlugin, TrackingCore } from './types';
import { Reporter } from './reporter';

const DEFAULT_CONFIG: Omit<Required<TrackingConfig>, 'appKey' | 'reportUrl'> = {
  sampleRate: 1,
  maxBatchSize: 10,
  flushInterval: 5000,
  enablePerformance: true,
  enableError: true,
  enableApi: true,
  enableResource: true,
  enableAutoClick: false,
  customFlushInterval: 0,
  userId: '',
};

export class TrackingSDKCore implements TrackingCore {
  config: Required<TrackingConfig>;
  private reporter: Reporter;
  private plugins: TrackingPlugin[] = [];
  private initialized = false;
  private sampled = true;

  constructor(userConfig: TrackingConfig) {
    this.config = { ...DEFAULT_CONFIG, ...userConfig } as Required<TrackingConfig>;

    // 采样率判断
    this.sampled = Math.random() < this.config.sampleRate;

    this.reporter = new Reporter(this.config);
    this.initialized = true;
  }

  report(data: Omit<ReportData, 'appKey' | 'timestamp' | 'pageUrl' | 'userAgent' | 'userId'>): void {
    if (!this.initialized || !this.sampled) return;

    const reportData: ReportData = {
      ...data,
      appKey: this.config.appKey,
      timestamp: Date.now(),
      pageUrl: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      userId: this.config.userId,
    };

    this.reporter.addToBuffer(reportData);
  }

  use(plugin: TrackingPlugin): void {
    if (this.plugins.find(p => p.name === plugin.name)) return;
    this.plugins.push(plugin);
    plugin.install(this);
  }

  isReportUrl(url: string): boolean {
    return this.reporter.isReportUrl(url);
  }

  destroy(): void {
    for (const plugin of this.plugins) {
      plugin.uninstall?.();
    }
    this.plugins = [];
    this.reporter.destroy();
    this.initialized = false;
  }
}
