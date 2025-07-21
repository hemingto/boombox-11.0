/**
 * @fileoverview Performance monitoring utilities
 * Core Web Vitals tracking and bundle optimization tools
 */

// Define metric interface to avoid any types
interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

/**
 * Core Web Vitals thresholds (Boombox targets)
 */
export const PERFORMANCE_THRESHOLDS = {
  // Largest Contentful Paint - aggressive target
  LCP: {
    good: 2000,      // < 2.0s (vs standard 2.5s)
    poor: 2500,      // > 2.5s
  },
  // First Input Delay - aggressive target  
  FID: {
    good: 50,        // < 50ms (vs standard 100ms)
    poor: 100,       // > 100ms
  },
  // Cumulative Layout Shift - standard target
  CLS: {
    good: 0.1,       // < 0.1
    poor: 0.25,      // > 0.25
  },
  // First Contentful Paint
  FCP: {
    good: 1800,      // < 1.8s
    poor: 3000,      // > 3.0s
  },
  // Time to First Byte
  TTFB: {
    good: 600,       // < 600ms
    poor: 1500,      // > 1.5s
  },
} as const;

/**
 * Performance metric types
 */
export type PerformanceMetric = 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';

export interface PerformanceReport {
  metric: PerformanceMetric;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  threshold: {
    good: number;
    poor: number;
  };
  timestamp: number;
  url: string;
}

/**
 * Track Core Web Vitals and send to analytics
 * Note: Import and use web-vitals library in your _app.tsx or layout.tsx
 */
export function createWebVitalsReporter(onMetric?: (metric: PerformanceReport) => void) {
  return (metric: WebVitalMetric) => {
    const report: PerformanceReport = {
      metric: metric.name as PerformanceMetric,
      value: metric.value,
      rating: metric.rating,
      threshold: PERFORMANCE_THRESHOLDS[metric.name as PerformanceMetric],
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    // Send to analytics (Google Analytics, custom endpoint, etc.)
    if (onMetric) {
      onMetric(report);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Web Vital:', report);
    }

    // Send to analytics service
    sendToAnalytics(report);
  };
}

/**
 * Send performance data to analytics
 */
function sendToAnalytics(report: PerformanceReport) {
  // Google Analytics 4 example
  if (typeof window !== 'undefined' && 'gtag' in window) {
    const gtag = (window as { gtag: (...args: unknown[]) => void }).gtag;
    gtag('event', report.metric, {
      event_category: 'Web Vitals',
      event_label: report.url,
      value: Math.round(report.metric === 'CLS' ? report.value * 1000 : report.value),
      non_interaction: true,
    });
  }

  // Custom analytics endpoint example
  if (process.env.NEXT_PUBLIC_ANALYTICS_URL) {
    fetch(process.env.NEXT_PUBLIC_ANALYTICS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'web-vital',
        ...report,
      }),
    }).catch(console.error);
  }
}

/**
 * Performance observer for custom metrics
 */
export class CustomPerformanceObserver {
  private observers: Map<string, PerformanceObserver> = new Map();

  /**
   * Track custom timing metrics
   */
  trackTiming(name: string, startTime?: number) {
    const start = startTime || performance.now();
    
    return {
      end: () => {
        const duration = performance.now() - start;
        this.reportCustomMetric(name, duration);
        return duration;
      },
    };
  }

  /**
   * Track resource loading times
   */
  trackResourceLoad(selector: string) {
    if (typeof window === 'undefined') return;
    
    const observer = new window.PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name.includes(selector)) {
          this.reportCustomMetric(`resource-${selector}`, entry.duration);
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
    this.observers.set(selector, observer);
  }

  /**
   * Track component render times
   */
  trackComponentRender(componentName: string, renderFn: () => void) {
    const start = performance.now();
    renderFn();
    const duration = performance.now() - start;
    
    this.reportCustomMetric(`component-${componentName}`, duration);
    return duration;
  }

  /**
   * Report custom performance metric
   */
  private reportCustomMetric(name: string, value: number) {
    const report = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.href,
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('Custom Metric:', report);
    }

    // Send to analytics
    if (process.env.NEXT_PUBLIC_ANALYTICS_URL) {
      fetch(process.env.NEXT_PUBLIC_ANALYTICS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'custom-metric',
          ...report,
        }),
      }).catch(console.error);
    }
  }

  /**
   * Clean up observers
   */
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

/**
 * Bundle size monitoring utilities
 */
export const bundleMonitoring = {
  /**
   * Log bundle information in development
   */
  logBundleInfo() {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      const nextData = (window as { __NEXT_DATA__?: { buildId?: string; page?: string; props?: unknown } }).__NEXT_DATA__;
      console.log('Bundle Info:', {
        buildId: nextData?.buildId,
        page: nextData?.page,
        props: nextData?.props ? 'Present' : 'None',
      });
    }
  },

  /**
   * Track dynamic import performance
   */
  trackDynamicImport<T>(importFn: () => Promise<T>, componentName: string): Promise<T> {
    const start = performance.now();
    
    return importFn().then((module) => {
      const duration = performance.now() - start;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Dynamic Import [${componentName}]:`, `${duration.toFixed(2)}ms`);
      }

      // Report to analytics
      if (process.env.NEXT_PUBLIC_ANALYTICS_URL) {
        fetch(process.env.NEXT_PUBLIC_ANALYTICS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'dynamic-import',
            component: componentName,
            duration,
            timestamp: Date.now(),
          }),
        }).catch(console.error);
      }

      return module;
    });
  },
};

/**
 * Performance budget warnings
 */
export const performanceBudget = {
  /**
   * Check if performance metrics are within budget
   */
  checkBudget(reports: PerformanceReport[]) {
    const violations: string[] = [];

    reports.forEach(report => {
      if (report.rating === 'poor') {
        violations.push(
          `${report.metric} is ${report.value} (threshold: ${report.threshold.good})`
        );
      }
    });

    if (violations.length > 0 && process.env.NODE_ENV === 'development') {
      console.warn('Performance Budget Violations:', violations);
    }

    return violations;
  },

  /**
   * Generate performance recommendations
   */
  generateRecommendations(reports: PerformanceReport[]): string[] {
    const recommendations: string[] = [];

    reports.forEach(report => {
      if (report.rating !== 'good') {
        switch (report.metric) {
          case 'LCP':
            recommendations.push('Optimize images and critical resources for faster loading');
            break;
          case 'FID':
            recommendations.push('Reduce JavaScript execution time and optimize interactions');
            break;
          case 'CLS':
            recommendations.push('Reserve space for images and dynamic content');
            break;
          case 'FCP':
            recommendations.push('Optimize critical rendering path and reduce blocking resources');
            break;
          case 'TTFB':
            recommendations.push('Optimize server response time and caching');
            break;
        }
      }
    });

    return [...new Set(recommendations)];
  },
};

/**
 * Global performance observer instance
 */
export const globalPerformanceObserver = new CustomPerformanceObserver(); 