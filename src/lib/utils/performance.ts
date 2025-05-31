// Performance monitoring utilities for the global feed optimizations

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, any> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Track DOM node count
  trackDOMNodes(context: string = 'global-feed'): number {
    const nodeCount = document.querySelectorAll('*').length;
    this.metrics.set(`dom-nodes-${context}`, {
      count: nodeCount,
      timestamp: Date.now()
    });
    return nodeCount;
  }

  // Track component render count
  trackRender(componentName: string): void {
    const key = `renders-${componentName}`;
    const current = this.metrics.get(key) || { count: 0, lastRender: 0 };
    this.metrics.set(key, {
      count: current.count + 1,
      lastRender: Date.now()
    });
  }

  // Track memory usage
  trackMemory(context: string = 'global'): any {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const data = {
        used: memInfo.usedJSHeapSize,
        total: memInfo.totalJSHeapSize,
        limit: memInfo.jsHeapSizeLimit,
        timestamp: Date.now()
      };
      this.metrics.set(`memory-${context}`, data);
      return data;
    }
    return null;
  }

  // Track scroll performance
  trackScrollPerformance(elementSelector: string): void {
    const element = document.querySelector(elementSelector);
    if (!element) return;

    let scrollMetrics = {
      frameDrops: 0,
      avgFrameTime: 0,
      measurements: [] as number[]
    };

    const measureFrame = () => {
      const start = performance.now();
      requestAnimationFrame(() => {
        const frameTime = performance.now() - start;
        scrollMetrics.measurements.push(frameTime);
        
        if (frameTime > 16.67) { // 60fps threshold
          scrollMetrics.frameDrops++;
        }
        
        if (scrollMetrics.measurements.length > 100) {
          scrollMetrics.measurements.shift(); // Keep last 100 measurements
        }
        
        scrollMetrics.avgFrameTime = scrollMetrics.measurements.reduce((a, b) => a + b, 0) / scrollMetrics.measurements.length;
      });
    };

    element.addEventListener('scroll', measureFrame);
    this.metrics.set('scroll-performance', scrollMetrics);
  }

  // Track image lazy loading effectiveness
  trackImageLoading(): void {
    let loadedImages = 0;
    let totalImages = 0;

    const images = document.querySelectorAll('img[src]');
    totalImages = images.length;
    
    images.forEach(img => {
      if (img.complete) {
        loadedImages++;
      } else {
        img.addEventListener('load', () => {
          loadedImages++;
          this.metrics.set('image-loading', {
            loaded: loadedImages,
            total: totalImages,
            percentage: (loadedImages / totalImages) * 100,
            timestamp: Date.now()
          });
        });
      }
    });

    this.metrics.set('image-loading', {
      loaded: loadedImages,
      total: totalImages,
      percentage: totalImages > 0 ? (loadedImages / totalImages) * 100 : 0,
      timestamp: Date.now()
    });
  }

  // Get performance summary
  getSummary(): any {
    return {
      domNodes: this.metrics.get('dom-nodes-global-feed'),
      memory: this.metrics.get('memory-global'),
      scrollPerformance: this.metrics.get('scroll-performance'),
      imageLoading: this.metrics.get('image-loading'),
      renders: Array.from(this.metrics.entries())
        .filter(([key]) => key.startsWith('renders-'))
        .reduce((acc, [key, value]) => {
          acc[key.replace('renders-', '')] = value.count;
          return acc;
        }, {} as Record<string, number>)
    };
  }

  // Log performance metrics to console (for development)
  logPerformance(): void {
    const summary = this.getSummary();
    console.group('🚀 Performance Metrics');
    console.log('DOM Nodes:', summary.domNodes?.count || 'N/A');
    console.log('Memory Usage:', summary.memory ? `${(summary.memory.used / 1024 / 1024).toFixed(2)} MB` : 'N/A');
    console.log('Component Renders:', summary.renders);
    console.log('Image Loading:', summary.imageLoading);
    console.log('Scroll Performance:', summary.scrollPerformance ? 
      `${summary.scrollPerformance.frameDrops} frame drops, ${summary.scrollPerformance.avgFrameTime?.toFixed(2)}ms avg` : 'N/A'
    );
    console.groupEnd();
  }

  // Reset all metrics
  reset(): void {
    this.metrics.clear();
  }
}

// Hook for React components to track performance
export const usePerformanceMonitor = (componentName: string) => {
  const monitor = PerformanceMonitor.getInstance();
  
  // Track render on each call
  monitor.trackRender(componentName);
  
  return {
    trackDOMNodes: () => monitor.trackDOMNodes(),
    trackMemory: () => monitor.trackMemory(),
    reset: () => monitor.reset()
  };
};

// Utility to compare before/after performance
export const createPerformanceComparison = () => {
  const monitor = PerformanceMonitor.getInstance();
  
  return {
    baseline: () => {
      monitor.reset();
      const domNodes = monitor.trackDOMNodes('baseline');
      const memory = monitor.trackMemory('baseline');
      monitor.trackImageLoading();
      return { domNodes, memory, timestamp: Date.now() };
    },
    
    optimized: () => {
      const domNodes = monitor.trackDOMNodes('optimized');
      const memory = monitor.trackMemory('optimized');
      monitor.trackImageLoading();
      return { domNodes, memory, timestamp: Date.now() };
    },
    
    compare: () => {
      const baseline = monitor.metrics.get('dom-nodes-baseline');
      const optimized = monitor.metrics.get('dom-nodes-optimized');
      const baselineMemory = monitor.metrics.get('memory-baseline');
      const optimizedMemory = monitor.metrics.get('memory-optimized');
      
      return {
        domReduction: baseline && optimized ? 
          ((baseline.count - optimized.count) / baseline.count * 100).toFixed(1) + '%' : 'N/A',
        memoryChange: baselineMemory && optimizedMemory ?
          (((optimizedMemory.used - baselineMemory.used) / baselineMemory.used) * 100).toFixed(1) + '%' : 'N/A',
        summary: monitor.getSummary()
      };
    }
  };
}; 

