import { TrackingPlugin, TrackingCore } from '../types';

interface ErrorRecord {
  message: string;
  stack: string;
  timestamp: number;
}

const DEDUP_INTERVAL = 5000;

export class ErrorPlugin implements TrackingPlugin {
  name = 'error';
  private core: TrackingCore | null = null;
  private recentErrors: ErrorRecord[] = [];
  private originalOnError: OnErrorEventHandler = null;
  private unhandledRejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null;

  install(core: TrackingCore): void {
    this.core = core;

    if (typeof window === 'undefined') return;

    this.hookWindowOnError();
    this.hookUnhandledRejection();
  }

  uninstall(): void {
    if (typeof window !== 'undefined') {
      window.onerror = this.originalOnError;
      if (this.unhandledRejectionHandler) {
        window.removeEventListener('unhandledrejection', this.unhandledRejectionHandler);
      }
    }
    this.core = null;
    this.recentErrors = [];
  }

  private hookWindowOnError(): void {
    this.originalOnError = window.onerror;

    window.onerror = (message, source, lineno, colno, error) => {
      const errorMessage = typeof message === 'string' ? message : 'Unknown Error';
      const errorStack = error?.stack || `${source}:${lineno}:${colno}`;

      if (!this.isDuplicate(errorMessage, errorStack)) {
        this.core?.report({
          type: 'error',
          data: {
            errorMessage,
            errorType: error?.name || 'Error',
            errorStack,
          },
        });
      }

      if (this.originalOnError) {
        return this.originalOnError.call(window, message, source, lineno, colno, error);
      }
      return false;
    };
  }

  private hookUnhandledRejection(): void {
    this.unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      let errorMessage = 'Unhandled Promise Rejection';
      let errorStack = '';
      let errorType = 'UnhandledRejection';

      if (event.reason instanceof Error) {
        errorMessage = event.reason.message;
        errorStack = event.reason.stack || '';
        errorType = event.reason.name;
      } else if (typeof event.reason === 'string') {
        errorMessage = event.reason;
      } else {
        errorMessage = JSON.stringify(event.reason);
      }

      if (!this.isDuplicate(errorMessage, errorStack)) {
        this.core?.report({
          type: 'error',
          data: {
            errorMessage: `Uncaught (in promise) ${errorType}: ${errorMessage}`,
            errorType,
            errorStack,
          },
        });
      }
    };

    window.addEventListener('unhandledrejection', this.unhandledRejectionHandler);
  }

  private isDuplicate(message: string, stack: string): boolean {
    const now = Date.now();

    // 清理过期记录
    this.recentErrors = this.recentErrors.filter(
      (record) => now - record.timestamp < DEDUP_INTERVAL
    );

    const isDup = this.recentErrors.some(
      (record) => record.message === message && record.stack === stack
    );

    if (!isDup) {
      this.recentErrors.push({ message, stack, timestamp: now });
    }

    return isDup;
  }
}
