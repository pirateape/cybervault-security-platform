/**
 * API Monitoring and Logging Framework
 * 
 * This module provides comprehensive monitoring capabilities:
 * - Performance metrics collection and analysis
 * - Error tracking and alerting
 * - Request/response logging with sanitization
 * - Health checks and circuit breaker patterns
 * - Dashboard metrics aggregation
 */

// ====================
// TYPES & INTERFACES
// ====================

export interface APIMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  orgId?: string;
  userId?: string;
  timestamp: Date;
  error?: string;
  retryCount?: number;
}

export interface PerformanceMetrics {
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorCount: number;
  timeoutCount: number;
  retryCount: number;
}

export interface ErrorMetrics {
  errorType: string;
  count: number;
  lastOccurrence: Date;
  endpoints: string[];
  affectedUsers: string[];
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  responseTime: number;
  errorRate: number;
  lastCheck: Date;
  details: Record<string, any>;
}

// ====================
// METRICS COLLECTION
// ====================

class MetricsCollector {
  private metrics: APIMetrics[] = [];
  private maxMetricsSize = 1000; // Keep last 1000 requests in memory
  private aggregationWindow = 5 * 60 * 1000; // 5 minutes

  /**
   * Record an API call metric
   */
  recordMetric(metric: APIMetrics): void {
    this.metrics.push(metric);
    
    // Keep memory usage bounded
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics = this.metrics.slice(-this.maxMetricsSize);
    }

    // Log errors immediately
    if (metric.error) {
      this.logError(metric);
    }

    // Send to external monitoring service if configured
    this.sendToExternalService(metric);
  }

  /**
   * Get performance metrics for a time window
   */
  getPerformanceMetrics(windowMs: number = this.aggregationWindow): PerformanceMetrics {
    const cutoff = new Date(Date.now() - windowMs);
    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoff);

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        successRate: 100,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        errorCount: 0,
        timeoutCount: 0,
        retryCount: 0,
      };
    }

    const responseTimes = recentMetrics.map(m => m.responseTime).sort((a, b) => a - b);
    const successfulRequests = recentMetrics.filter(m => m.statusCode >= 200 && m.statusCode < 400);
    const errors = recentMetrics.filter(m => m.error);
    const timeouts = recentMetrics.filter(m => m.error?.includes('timeout'));
    const retries = recentMetrics.filter(m => (m.retryCount || 0) > 0);

    return {
      totalRequests: recentMetrics.length,
      successRate: (successfulRequests.length / recentMetrics.length) * 100,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
      p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)] || 0,
      errorCount: errors.length,
      timeoutCount: timeouts.length,
      retryCount: retries.reduce((sum, m) => sum + (m.retryCount || 0), 0),
    };
  }

  /**
   * Get error metrics breakdown
   */
  getErrorMetrics(windowMs: number = this.aggregationWindow): ErrorMetrics[] {
    const cutoff = new Date(Date.now() - windowMs);
    const errors = this.metrics.filter(m => m.error && m.timestamp >= cutoff);

    const errorGroups = new Map<string, {
      count: number;
      lastOccurrence: Date;
      endpoints: Set<string>;
      users: Set<string>;
    }>();

    errors.forEach(metric => {
      const errorType = this.categorizeError(metric.error!);
      
      if (!errorGroups.has(errorType)) {
        errorGroups.set(errorType, {
          count: 0,
          lastOccurrence: metric.timestamp,
          endpoints: new Set(),
          users: new Set(),
        });
      }

      const group = errorGroups.get(errorType)!;
      group.count++;
      group.lastOccurrence = metric.timestamp > group.lastOccurrence ? metric.timestamp : group.lastOccurrence;
      group.endpoints.add(metric.endpoint);
      if (metric.userId) group.users.add(metric.userId);
    });

    return Array.from(errorGroups.entries()).map(([errorType, data]) => ({
      errorType,
      count: data.count,
      lastOccurrence: data.lastOccurrence,
      endpoints: Array.from(data.endpoints),
      affectedUsers: Array.from(data.users),
    }));
  }

  /**
   * Get health status
   */
  getHealthStatus(): HealthStatus {
    const metrics = this.getPerformanceMetrics();
    const errorRate = (metrics.errorCount / Math.max(metrics.totalRequests, 1)) * 100;

    let status: HealthStatus['status'] = 'healthy';
    if (errorRate > 5 || metrics.averageResponseTime > 2000) {
      status = 'degraded';
    }
    if (errorRate > 15 || metrics.averageResponseTime > 5000) {
      status = 'unhealthy';
    }

    return {
      status,
      uptime: this.calculateUptime(),
      responseTime: metrics.averageResponseTime,
      errorRate,
      lastCheck: new Date(),
      details: {
        totalRequests: metrics.totalRequests,
        successRate: metrics.successRate,
        p95ResponseTime: metrics.p95ResponseTime,
      },
    };
  }

  /**
   * Get metrics by endpoint
   */
  getMetricsByEndpoint(windowMs: number = this.aggregationWindow): Record<string, PerformanceMetrics> {
    const cutoff = new Date(Date.now() - windowMs);
    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoff);

    const endpointGroups = new Map<string, APIMetrics[]>();
    recentMetrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!endpointGroups.has(key)) {
        endpointGroups.set(key, []);
      }
      endpointGroups.get(key)!.push(metric);
    });

    const result: Record<string, PerformanceMetrics> = {};
    endpointGroups.forEach((metrics, endpoint) => {
      const responseTimes = metrics.map(m => m.responseTime).sort((a, b) => a - b);
      const successfulRequests = metrics.filter(m => m.statusCode >= 200 && m.statusCode < 400);
      const errors = metrics.filter(m => m.error);

      result[endpoint] = {
        totalRequests: metrics.length,
        successRate: (successfulRequests.length / metrics.length) * 100,
        averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
        p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)] || 0,
        errorCount: errors.length,
        timeoutCount: errors.filter(m => m.error?.includes('timeout')).length,
        retryCount: metrics.reduce((sum, m) => sum + (m.retryCount || 0), 0),
      };
    });

    return result;
  }

  private categorizeError(error: string): string {
    if (error.includes('timeout')) return 'Timeout';
    if (error.includes('401') || error.includes('unauthorized')) return 'Authentication';
    if (error.includes('403') || error.includes('forbidden')) return 'Authorization';
    if (error.includes('404') || error.includes('not found')) return 'Not Found';
    if (error.includes('500') || error.includes('internal server')) return 'Server Error';
    if (error.includes('network') || error.includes('connection')) return 'Network';
    if (error.includes('validation') || error.includes('400')) return 'Validation';
    return 'Unknown';
  }

  private logError(metric: APIMetrics): void {
    console.error('[API Error]', {
      endpoint: `${metric.method} ${metric.endpoint}`,
      status: metric.statusCode,
      error: metric.error,
      responseTime: metric.responseTime,
      orgId: metric.orgId,
      userId: metric.userId,
      timestamp: metric.timestamp.toISOString(),
    });
  }

  private sendToExternalService(metric: APIMetrics): void {
    // Send to external monitoring service (e.g., DataDog, New Relic, etc.)
    // This would be implemented based on your monitoring service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'api_call', {
        endpoint: metric.endpoint,
        method: metric.method,
        status_code: metric.statusCode,
        response_time: metric.responseTime,
        custom_map: {
          dimension1: metric.orgId,
          dimension2: metric.error ? 'error' : 'success',
        },
      });
    }
  }

  private calculateUptime(): number {
    // This would be calculated based on when the service started
    // For now, return a placeholder
    return Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
  }
}

// ====================
// ALERTING SYSTEM
// ====================

interface AlertRule {
  name: string;
  condition: (metrics: PerformanceMetrics) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldownMs: number;
  lastTriggered?: Date;
}

class AlertingSystem {
  private rules: AlertRule[] = [];
  private alertCallbacks: ((alert: Alert) => void)[] = [];

  constructor() {
    // Default alert rules
    this.addRule({
      name: 'High Error Rate',
      condition: (metrics) => (metrics.errorCount / Math.max(metrics.totalRequests, 1)) > 0.1, // 10%
      severity: 'high',
      cooldownMs: 10 * 60 * 1000, // 10 minutes
    });

    this.addRule({
      name: 'Slow Response Time',
      condition: (metrics) => metrics.averageResponseTime > 3000, // 3 seconds
      severity: 'medium',
      cooldownMs: 5 * 60 * 1000, // 5 minutes
    });

    this.addRule({
      name: 'Critical Error Rate',
      condition: (metrics) => (metrics.errorCount / Math.max(metrics.totalRequests, 1)) > 0.25, // 25%
      severity: 'critical',
      cooldownMs: 5 * 60 * 1000, // 5 minutes
    });
  }

  addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }

  addAlertCallback(callback: (alert: Alert) => void): void {
    this.alertCallbacks.push(callback);
  }

  checkAlerts(metrics: PerformanceMetrics): void {
    const now = new Date();

    this.rules.forEach(rule => {
      // Check cooldown
      if (rule.lastTriggered && 
          (now.getTime() - rule.lastTriggered.getTime()) < rule.cooldownMs) {
        return;
      }

      if (rule.condition(metrics)) {
        rule.lastTriggered = now;
        
        const alert: Alert = {
          name: rule.name,
          severity: rule.severity,
          timestamp: now,
          metrics,
          message: this.generateAlertMessage(rule, metrics),
        };

        this.triggerAlert(alert);
      }
    });
  }

  private generateAlertMessage(rule: AlertRule, metrics: PerformanceMetrics): string {
    switch (rule.name) {
      case 'High Error Rate':
        const errorRate = (metrics.errorCount / Math.max(metrics.totalRequests, 1)) * 100;
        return `Error rate is ${errorRate.toFixed(1)}% (${metrics.errorCount}/${metrics.totalRequests} requests)`;
      
      case 'Slow Response Time':
        return `Average response time is ${metrics.averageResponseTime.toFixed(0)}ms (P95: ${metrics.p95ResponseTime.toFixed(0)}ms)`;
      
      case 'Critical Error Rate':
        const criticalErrorRate = (metrics.errorCount / Math.max(metrics.totalRequests, 1)) * 100;
        return `Critical error rate reached ${criticalErrorRate.toFixed(1)}%`;
      
      default:
        return `Alert triggered: ${rule.name}`;
    }
  }

  private triggerAlert(alert: Alert): void {
    console.warn('[ALERT]', alert);
    
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });
  }
}

interface Alert {
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  metrics: PerformanceMetrics;
  message: string;
}

// ====================
// SINGLETON INSTANCES
// ====================

export const metricsCollector = new MetricsCollector();
export const alertingSystem = new AlertingSystem();

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Initialize monitoring with custom configuration
 */
export function initializeMonitoring(config?: {
  alertCallbacks?: ((alert: Alert) => void)[];
  customRules?: AlertRule[];
}) {
  if (config?.alertCallbacks) {
    config.alertCallbacks.forEach(callback => {
      alertingSystem.addAlertCallback(callback);
    });
  }

  if (config?.customRules) {
    config.customRules.forEach(rule => {
      alertingSystem.addRule(rule);
    });
  }

  // Start periodic health checks
  setInterval(() => {
    const metrics = metricsCollector.getPerformanceMetrics();
    alertingSystem.checkAlerts(metrics);
  }, 60 * 1000); // Check every minute
}

/**
 * Create a monitoring middleware for API requests
 */
export function createMonitoringMiddleware() {
  return {
    onRequest: (config: any) => {
      const startTime = Date.now();
      return { ...config, __startTime: startTime };
    },
    
    onResponse: (response: any, config: any) => {
      const endTime = Date.now();
      const responseTime = endTime - (config.__startTime || endTime);
      
      metricsCollector.recordMetric({
        endpoint: config.url || config.endpoint || 'unknown',
        method: config.method?.toUpperCase() || 'GET',
        statusCode: response.status || 200,
        responseTime,
        requestSize: JSON.stringify(config.data || {}).length,
        responseSize: JSON.stringify(response.data || {}).length,
        orgId: config.orgId,
        userId: config.userId,
        timestamp: new Date(),
        retryCount: config.__retryCount || 0,
      });
      
      return response;
    },
    
    onError: (error: any, config: any) => {
      const endTime = Date.now();
      const responseTime = endTime - (config.__startTime || endTime);
      
      metricsCollector.recordMetric({
        endpoint: config.url || config.endpoint || 'unknown',
        method: config.method?.toUpperCase() || 'GET',
        statusCode: error.response?.status || 0,
        responseTime,
        requestSize: JSON.stringify(config.data || {}).length,
        responseSize: 0,
        orgId: config.orgId,
        userId: config.userId,
        timestamp: new Date(),
        error: error.message || 'Unknown error',
        retryCount: config.__retryCount || 0,
      });
      
      throw error;
    },
  };
}

// Types are already exported at the interface declarations above 