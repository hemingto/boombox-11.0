module.exports = {
  ci: {
    collect: {
      // URLs to test
      url: [
        'http://localhost:3000',
        'http://localhost:3000/getquote',
        'http://localhost:3000/howitworks',
        'http://localhost:3000/packing-supplies',
      ],
      // Number of runs per URL
      numberOfRuns: 3,
      // Settings for collection
      settings: {
        chromeFlags: '--no-sandbox --headless',
        // Emulate mobile device
        emulatedFormFactor: 'mobile',
        // Throttle network and CPU
        throttling: {
          rttMs: 150,
          throughputKbps: 1600,
          cpuSlowdownMultiplier: 4,
        },
      },
    },
    assert: {
      // Performance budgets - Boombox targets
      assertions: {
        // Core Web Vitals - aggressive targets
        'largest-contentful-paint': ['error', { maxNumericValue: 2000 }], // < 2.0s
        'first-input-delay': ['error', { maxNumericValue: 50 }], // < 50ms
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // < 0.1
        
        // Additional performance metrics
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }], // < 1.8s
        'speed-index': ['warn', { maxNumericValue: 2500 }], // < 2.5s
        'time-to-first-byte': ['warn', { maxNumericValue: 600 }], // < 600ms
        
        // Accessibility - WCAG 2.1 AA compliance
        'categories:accessibility': ['error', { minScore: 0.9 }], // 90%+
        
        // Best practices
        'categories:best-practices': ['warn', { minScore: 0.9 }], // 90%+
        
        // SEO
        'categories:seo': ['warn', { minScore: 0.9 }], // 90%+
        
        // PWA (if applicable)
        'categories:pwa': ['off'], // Not required for Boombox
        
        // Performance category overall
        'categories:performance': ['warn', { minScore: 0.8 }], // 80%+
        
        // Resource budgets
        'resource-summary:script:size': ['warn', { maxNumericValue: 500000 }], // 500KB JS
        'resource-summary:image:size': ['warn', { maxNumericValue: 1000000 }], // 1MB images
        'resource-summary:font:size': ['warn', { maxNumericValue: 100000 }], // 100KB fonts
        'resource-summary:total:size': ['warn', { maxNumericValue: 2000000 }], // 2MB total
        
        // Specific audits
        'unused-javascript': ['warn', { maxNumericValue: 20000 }], // 20KB unused JS
        'unused-css-rules': ['warn', { maxNumericValue: 20000 }], // 20KB unused CSS
        'modern-image-formats': 'error', // Use WebP/AVIF
        'offscreen-images': 'warn', // Lazy load images
        'render-blocking-resources': 'warn', // Minimize blocking resources
        'unminified-css': 'error', // Minify CSS
        'unminified-javascript': 'error', // Minify JS
        'efficient-animated-content': 'warn', // Optimize animations
        'uses-text-compression': 'error', // Enable gzip/brotli
        'uses-responsive-images': 'warn', // Responsive images
        'uses-optimized-images': 'warn', // Optimize images
      },
    },
    upload: {
      // Store results locally for now
      target: 'filesystem',
      outputDir: './lighthouse-results',
    },
    server: {
      // Start local server for testing
      command: 'pnpm run build && pnpm run start',
      port: 3000,
      // Wait for server to be ready
      timeout: 60000,
    },
  },
}; 