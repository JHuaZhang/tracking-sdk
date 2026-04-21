export interface TrackingConfig {
  appKey: string;
  reportUrl: string;
  sampleRate?: number;
  maxBatchSize?: number;
  flushInterval?: number;
  enablePerformance?: boolean;
  enableError?: boolean;
  enableApi?: boolean;
  enableResource?: boolean;
  enableAutoClick?: boolean;
  /** 自定义事件聚合窗口时间（毫秒），窗口期内的事件会汇总成一条请求发送。0 表示不聚合，立即上报。默认 0 */
  customFlushInterval?: number;
  userId?: string;
}

export interface ReportData {
  appKey: string;
  type: 'performance' | 'error' | 'api' | 'resource' | 'custom';
  data: Record<string, any>;
  timestamp: number;
  pageUrl: string;
  userAgent: string;
  userId?: string;
}

export interface TrackingPlugin {
  name: string;
  install(core: TrackingCore): void;
  uninstall?(): void;
}

export interface TrackingCore {
  config: Required<TrackingConfig>;
  report(data: Omit<ReportData, 'appKey' | 'timestamp' | 'pageUrl' | 'userAgent' | 'userId'>): void;
  isReportUrl(url: string): boolean;
}
