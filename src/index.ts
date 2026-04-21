import type { TrackingConfig } from './types';
import { TrackingSDKCore } from './core';
import { PerformancePlugin } from './plugins/performance';
import { ErrorPlugin } from './plugins/error';
import { ApiPlugin } from './plugins/api';
import { ResourcePlugin } from './plugins/resource';
import { CustomPlugin } from './plugins/custom';

let instance: TrackingSDKCore | null = null;
let customPlugin: CustomPlugin | null = null;

const TrackingSDK = {
  init(config: TrackingConfig): void {
    if (!config.appKey || !config.reportUrl) {
      console.warn('[TrackingSDK] appKey and reportUrl are required');
      return;
    }

    if (instance) {
      console.warn('[TrackingSDK] SDK already initialized');
      return;
    }

    instance = new TrackingSDKCore(config);

    // 根据配置自动注册插件
    if (instance.config.enablePerformance) {
      instance.use(new PerformancePlugin());
    }
    if (instance.config.enableError) {
      instance.use(new ErrorPlugin());
    }
    if (instance.config.enableApi) {
      instance.use(new ApiPlugin());
    }
    if (instance.config.enableResource) {
      instance.use(new ResourcePlugin());
    }

    // 自定义事件插件（支持自动点击埋点 + 聚合缓冲）
    customPlugin = new CustomPlugin();
    instance.use(customPlugin);
  },

  destroy(): void {
    if (instance) {
      instance.destroy();
      instance = null;
      customPlugin = null;
    }
  },

  setUserId(userId: string): void {
    if (instance) {
      instance.config.userId = userId;
    }
  },

  /**
   * 手动上报自定义事件
   * @param eventName 事件名称，如 'button_click'、'form_submit'
   * @param extra 附加数据，如 { buttonId: 'submit', page: 'login' }
   */
  trackEvent(eventName: string, extra?: Record<string, any>): void {
    if (!instance || !customPlugin) {
      console.warn('[TrackingSDK] SDK not initialized, call init() first');
      return;
    }
    customPlugin.bufferEvent({
      type: 'custom',
      data: {
        eventName,
        eventType: 'custom',
        ...extra,
      },
    });
  },

  /**
   * 手动上报页面浏览事件
   * @param pagePath 页面路径，如 '/dashboard'，不传则自动取当前 URL
   * @param extra 附加数据
   */
  trackPageView(pagePath?: string, extra?: Record<string, any>): void {
    if (!instance || !customPlugin) {
      console.warn('[TrackingSDK] SDK not initialized, call init() first');
      return;
    }
    customPlugin.bufferEvent({
      type: 'custom',
      data: {
        eventName: 'page_view',
        eventType: 'pageview',
        pagePath: pagePath || (typeof window !== 'undefined' ? window.location.pathname : ''),
        ...extra,
      },
    });
  },
};

export default TrackingSDK;
export type { TrackingConfig } from './types';
