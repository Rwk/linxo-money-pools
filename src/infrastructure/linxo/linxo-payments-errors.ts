export class LinxoPaymentsConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LinxoPaymentsConfigurationError";
  }
}

export class LinxoPaymentsTokenError extends Error {
  readonly status: number | null;
  readonly code?: string;
  readonly description?: string;
  readonly requestId?: string;

  constructor(options: {
    message: string;
    status?: number | null;
    code?: string;
    description?: string;
    requestId?: string;
  }) {
    super(options.message);
    this.name = "LinxoPaymentsTokenError";
    this.status = options.status ?? null;
    this.code = options.code;
    this.description = options.description;
    this.requestId = options.requestId;
  }
}

export class LinxoPaymentsApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly description?: string;
  readonly requestId?: string;

  constructor(options: {
    message: string;
    status: number;
    code?: string;
    description?: string;
    requestId?: string;
  }) {
    super(options.message);
    this.name = "LinxoPaymentsApiError";
    this.status = options.status;
    this.code = options.code;
    this.description = options.description;
    this.requestId = options.requestId;
  }
}

export class LinxoPaymentsNetworkError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "LinxoPaymentsNetworkError";
  }
}
