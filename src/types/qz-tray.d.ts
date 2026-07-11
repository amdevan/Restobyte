declare module 'qz-tray' {
  type QzPromiseFactory = <T>(
    resolver: (
      resolve: (value: T | PromiseLike<T>) => void,
      reject: (reason?: unknown) => void
    ) => void
  ) => Promise<T>;

  interface QzApi {
    setPromiseType(promiser: QzPromiseFactory): void;
  }

  interface QzSecurity {
    setCertificatePromise(
      promiseHandler: (() => Promise<string> | string) | Promise<string>,
      options?: { rejectOnFailure?: boolean }
    ): void;
    setSignaturePromise(promiseFactory: (dataToSign: string) => Promise<string> | string): void;
  }

  interface QzWebsocket {
    isActive(): boolean;
    connect(options?: Record<string, unknown>): Promise<void>;
    disconnect(): Promise<void>;
  }

  interface QzPrinters {
    find(query?: string): Promise<string[]>;
  }

  interface QzConfigs {
    create(printer: string, options?: Record<string, unknown>): Record<string, unknown>;
  }

  interface QzPrintData {
    type?: string;
    format?: string;
    flavor?: string;
    data: string;
    options?: Record<string, unknown>;
  }

  interface QzModule {
    api: QzApi;
    security: QzSecurity;
    websocket: QzWebsocket;
    printers: QzPrinters;
    configs: QzConfigs;
    print(config: Record<string, unknown>, data: Array<QzPrintData | string>): Promise<void>;
  }

  const qz: QzModule;
  export default qz;
}
