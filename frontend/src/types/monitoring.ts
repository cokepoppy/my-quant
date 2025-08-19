// 监控相关类型
export interface SystemMetrics {
  timestamp: string;
  cpu: {
    usage: number;
    cores: number;
    frequency: number;
    temperature: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    cached: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
    readSpeed: number;
    writeSpeed: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
    connections: number;
  };
  database: {
    connections: number;
    queries: number;
    slowQueries: number;
    avgQueryTime: number;
  };
  redis: {
    memory: number;
    connections: number;
    operations: number;
    hitRate: number;
  };
  trading: {
    activeOrders: number;
    openPositions: number;
    dailyVolume: number;
    pnl: number;
  };
  strategies: {
    active: number;
    total: number;
    errors: number;
    performance: number;
  };
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  level: "info" | "warning" | "error" | "critical";
  type: "system" | "trading" | "strategy" | "security" | "performance";
  source: string;
  timestamp: string;
  status: "active" | "resolved" | "acknowledged";
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  metadata: Record<string, any>;
  tags: string[];
  severity: "low" | "medium" | "high" | "critical";
  description?: string;
  actions?: AlertAction[];
}

export interface AlertAction {
  id: string;
  name: string;
  type: "link" | "button" | "api";
  url?: string;
  method?: string;
  payload?: any;
  icon?: string;
  color?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  source: string;
  service: string;
  environment: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  metadata: Record<string, any>;
  stackTrace?: string;
  tags: string[];
}

export interface DashboardData {
  summary: {
    totalUsers: number;
    activeUsers: number;
    totalStrategies: number;
    activeStrategies: number;
    dailyVolume: number;
    totalPnL: number;
    systemStatus: "healthy" | "warning" | "critical";
    uptime: number;
  };
  charts: {
    cpuUsage: Array<{ timestamp: string; value: number }>;
    memoryUsage: Array<{ timestamp: string; value: number }>;
    tradingVolume: Array<{ timestamp: string; value: number }>;
    strategyPerformance: Array<{ timestamp: string; value: number }>;
    userActivity: Array<{ timestamp: string; value: number }>;
    errorRate: Array<{ timestamp: string; value: number }>;
  };
  alerts: {
    critical: number;
    warning: number;
    info: number;
    recent: Alert[];
  };
  services: ServiceStatus[];
  performance: PerformanceMetrics;
}

export interface ServiceStatus {
  name: string;
  status: "running" | "stopped" | "error" | "starting" | "stopping";
  version: string;
  uptime: number;
  cpu: number;
  memory: number;
  health: "healthy" | "warning" | "critical";
  lastCheck: string;
  endpoints: EndpointStatus[];
}

export interface EndpointStatus {
  path: string;
  method: string;
  status: "up" | "down" | "slow";
  responseTime: number;
  errorRate: number;
  lastRequest: string;
}

export interface PerformanceMetrics {
  responseTime: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
  throughput: {
    requests: number;
    errors: number;
    rate: number;
  };
  availability: {
    uptime: number;
    downtime: number;
    sla: number;
  };
  resources: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
}

export interface RealtimeData {
  timestamp: string;
  metrics: SystemMetrics;
  activeAlerts: Alert[];
  recentLogs: LogEntry[];
  marketData: MarketData[];
  strategyUpdates: StrategyUpdate[];
}

export interface StrategyUpdate {
  strategyId: string;
  strategyName: string;
  status: string;
  performance: number;
  timestamp: string;
  message: string;
  details: Record<string, any>;
}

export interface HealthCheck {
  status: "healthy" | "warning" | "critical";
  timestamp: string;
  version: string;
  services: Record<
    string,
    {
      status: string;
      message?: string;
      details?: any;
    }
  >;
  metrics: {
    uptime: number;
    memory: number;
    cpu: number;
    disk: number;
  };
}

export interface ResourceUsage {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    in: number;
    out: number;
  };
  diskIO: {
    read: number;
    write: number;
  };
  processes: number;
  connections: number;
  loadAverage: number;
}
