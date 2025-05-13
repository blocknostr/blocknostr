
/**
 * Performance data collected for each relay
 */
export interface RelayPerformanceData {
  url: string;
  score: number;
  avgResponseTime: number;
  successCount: number;
  failureCount: number;
  lastUpdated: number;
  operations: {
    [operation: string]: {
      successCount: number;
      failureCount: number;
      totalTime: number;
    }
  };
}

export interface OperationMetrics {
  successCount: number;
  failureCount: number;
  totalTime: number;
}
