import { TrackingPlugin, TrackingCore } from '../types';

export class ResourcePlugin implements TrackingPlugin {
  name = 'resource';
  private core: TrackingCore | null = null;
  private errorHandler: ((event: Event) => void) | null = null;

  install(core: TrackingCore): void {
    this.core = core;

    if (typeof window === 'undefined') return;

    this.listenResourceErrors();
  }

  uninstall(): void {
    if (typeof window !== 'undefined' && this.errorHandler) {
      window.removeEventListener('error', this.errorHandler, true);
    }
    this.core = null;
  }

  private listenResourceErrors(): void {
    this.errorHandler = (event: Event) => {
      const target = event.target as HTMLElement;

      // 只处理资源加载错误，不处理 JS 运行时错误
      if (!target || target === window as any) return;

      const tagName = target.tagName?.toLowerCase();
      if (!tagName) return;

      const resourceTypeMap: Record<string, string> = {
        script: 'script',
        link: 'stylesheet',
        img: 'image',
        video: 'video',
        audio: 'audio',
        source: 'media-source',
      };

      const resourceType = resourceTypeMap[tagName];
      if (!resourceType) return;

      const resourceUrl =
        (target as HTMLScriptElement).src ||
        (target as HTMLLinkElement).href ||
        (target as HTMLImageElement).src ||
        '';

      if (!resourceUrl) return;

      this.core?.report({
        type: 'resource',
        data: {
          resourceUrl,
          resourceType,
          errorMessage: `Failed to load ${resourceType}: ${resourceUrl}`,
        },
      });
    };

    // 在捕获阶段监听，确保能捕获到资源加载错误
    window.addEventListener('error', this.errorHandler, true);
  }
}
