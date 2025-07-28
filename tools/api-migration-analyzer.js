#!/usr/bin/env node

/**
 * @fileoverview API Migration Analyzer - Prevents duplicate utilities during API route migration
 * 
 * USAGE:
 * node tools/api-migration-analyzer.js analyze-domain <domain-name>
 * node tools/api-migration-analyzer.js check-duplicates
 * node tools/api-migration-analyzer.js suggest-consolidation
 * 
 * FUNCTIONALITY:
 * - Scans boombox-10.0 API routes for a domain before migration
 * - Identifies common patterns, utilities, and messaging logic
 * - Compares against existing boombox-11.0 utilities
 * - Suggests consolidation opportunities and reuse
 * - Generates migration plan with utility reuse strategy
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path configurations
const BOOMBOX_10_API_PATH = path.join(__dirname, '../../boombox-10.0/src/app/api');
const BOOMBOX_11_UTILS_PATH = path.join(__dirname, '../src/lib/utils');
const BOOMBOX_11_SERVICES_PATH = path.join(__dirname, '../src/lib/services');
const BOOMBOX_11_MESSAGING_PATH = path.join(__dirname, '../src/lib/messaging');

// Domain to API route mapping
const DOMAIN_ROUTES = {
  auth: ['auth/', 'admin/login', 'admin/signup', 'driver/verify-token'],
  payments: ['stripe/', 'webhooks/stripe', 'feedback/process-tip', 'packing-supplies/process-tip'],
  orders: ['accessStorageUnit', 'addAdditionalStorage', 'submitQuote', 'send-quote-email', 'availability', 'appointments/', 'packing-supplies/', 'storage-units/available-count', 'customer/mover-change-response', 'customer/verify-mover-change-token'],
  onfleet: ['onfleet/', 'webhooks/onfleet', 'test-onfleet', 'packing-supplies/assign-routes', 'packing-supplies/batch-optimize', 'packing-supplies/driver-offer', 'packing-supplies/driver-response', 'packing-supplies/handle-expired-offers', 'packing-supplies/process-route-payout', 'packing-supplies/route-details/', 'driver-assign/'],
  drivers: ['drivers/', 'driver/'],
  movingPartners: ['movers/', 'moving-partners/', 'third-party-moving-partners', 'mover/'],
  customers: ['users/', 'updatephonenumber', 'appointments/upcoming', 'storageUnitsByUser', 'tracking/'],
  admin: ['admin/', 'cron/', 'upload/', 'notifications/', 'twilio/inbound', 'ai/query-ai']
};

class ApiMigrationAnalyzer {
  constructor() {
    this.existingUtils = new Map();
    this.existingServices = new Map();
    this.existingTemplates = new Map();
    this.analysisResults = new Map();
  }

  /**
   * Analyze existing boombox-11.0 utilities and services
   */
  async analyzeExistingUtilities() {
    console.log('📊 Analyzing existing boombox-11.0 utilities...');
    
    // Scan utils directory
    await this.scanDirectory(BOOMBOX_11_UTILS_PATH, 'utils');
    
    // Scan services directory  
    await this.scanDirectory(BOOMBOX_11_SERVICES_PATH, 'services');
    
    // Scan messaging templates
    await this.scanDirectory(BOOMBOX_11_MESSAGING_PATH, 'messaging');
    
    console.log(`✅ Found ${this.existingUtils.size} utility functions`);
    console.log(`✅ Found ${this.existingServices.size} service functions`);
    console.log(`✅ Found ${this.existingTemplates.size} message templates`);
  }

  /**
   * Analyze a specific domain's API routes before migration
   */
  async analyzeDomain(domainName) {
    if (!DOMAIN_ROUTES[domainName]) {
      throw new Error(`Unknown domain: ${domainName}`);
    }

    console.log(`🔍 Analyzing ${domainName} domain routes...`);
    
    const routePaths = DOMAIN_ROUTES[domainName];
    const domainAnalysis = {
      domain: domainName,
      routes: [],
      potentialUtilities: [],
      messagePatterns: [],
      validationSchemas: [],
      consolidationOpportunities: [],
      reuseRecommendations: []
    };

    for (const routePath of routePaths) {
      const analysis = await this.analyzeRoute(routePath);
      if (analysis) {
        domainAnalysis.routes.push(analysis);
        
        // Extract patterns
        domainAnalysis.potentialUtilities.push(...analysis.utilities);
        domainAnalysis.messagePatterns.push(...analysis.messages);
        domainAnalysis.validationSchemas.push(...analysis.validations);
      }
    }

    // Check for consolidation opportunities
    domainAnalysis.consolidationOpportunities = this.findConsolidationOpportunities(domainAnalysis);
    
    // Check what can be reused
    domainAnalysis.reuseRecommendations = this.findReuseOpportunities(domainAnalysis);

    this.analysisResults.set(domainName, domainAnalysis);
    
    return domainAnalysis;
  }

  /**
   * Analyze individual API route file
   */
  async analyzeRoute(routePath) {
    const fullPath = path.join(BOOMBOX_10_API_PATH, routePath);
    
    // Handle both directory routes and specific files
    let routeFile;
    if (fs.existsSync(path.join(fullPath, 'route.ts'))) {
      routeFile = path.join(fullPath, 'route.ts');
    } else if (fs.existsSync(`${fullPath}/route.ts`)) {
      routeFile = `${fullPath}/route.ts`;
    } else if (fs.existsSync(`${fullPath}.ts`)) {
      routeFile = `${fullPath}.ts`;
    } else {
      console.log(`⚠️  Could not find route file for: ${routePath}`);
      return null;
    }

    if (!fs.existsSync(routeFile)) {
      return null;
    }

    const content = fs.readFileSync(routeFile, 'utf8');
    
    return {
      path: routePath,
      file: routeFile,
      utilities: this.extractPotentialUtilities(content),
      messages: this.extractMessagePatterns(content),
      validations: this.extractValidationPatterns(content),
      dependencies: this.extractDependencies(content)
    };
  }

  /**
   * Extract potential utility functions from route content
   */
  extractPotentialUtilities(content) {
    const utilities = [];
    
    // Common utility patterns to look for
    const patterns = [
      // Phone number handling
      { pattern: /normalizePhoneNumberToE164|formatPhoneNumber|phoneNumber\.replace/g, type: 'phone', category: 'phoneUtils' },
      
      // Date/time formatting
      { pattern: /new Date\(|\.toISOString\(|format.*Date|parseDate/g, type: 'date', category: 'dateUtils' },
      
      // Email validation
      { pattern: /@.*\..*|email.*validation|isValidEmail/g, type: 'email', category: 'validationUtils' },
      
      // SMS/Email sending
      { pattern: /twilio|sendgrid|\.send.*message|\.send.*email/gi, type: 'messaging', category: 'messaging' },
      
      // Business calculations
      { pattern: /calculate.*price|calculate.*cost|\.toFixed\(2\)|Math\.round/g, type: 'calculation', category: 'businessUtils' },
      
      // Database queries patterns
      { pattern: /prisma\.\w+\.findMany|prisma\.\w+\.update|prisma\.\w+\.create/g, type: 'database', category: 'queries' },
      
      // Validation patterns
      { pattern: /if\s*\(.*\.length|if\s*\(!.*\)|.*\?\s*.*\:\s*.*/g, type: 'validation', category: 'validationUtils' },
      
      // Token generation
      { pattern: /crypto\.randomBytes|Math\.random|generateToken|generateCode/g, type: 'token', category: 'formatUtils' }
    ];

    for (const { pattern, type, category } of patterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        utilities.push({
          type,
          category,
          count: matches.length,
          examples: matches.slice(0, 3) // First 3 examples
        });
      }
    }

    return utilities;
  }

  /**
   * Extract messaging patterns
   */
  extractMessagePatterns(content) {
    const messages = [];
    
    // Look for template strings with variables
    const templateMatches = content.match(/`[^`]*\$\{[^}]+\}[^`]*`/g);
    if (templateMatches) {
      templateMatches.forEach(template => {
        const variables = template.match(/\$\{([^}]+)\}/g);
        messages.push({
          template: template.slice(0, 100) + (template.length > 100 ? '...' : ''),
          variables: variables || [],
          type: template.toLowerCase().includes('sms') ? 'sms' : 'email'
        });
      });
    }

    return messages;
  }

  /**
   * Extract validation patterns
   */
  extractValidationPatterns(content) {
    const validations = [];
    
    // Look for Zod schemas
    const zodMatches = content.match(/z\.\w+\(\)|z\.object\({[\s\S]*?}\)/g);
    if (zodMatches) {
      validations.push(...zodMatches.map(schema => ({ type: 'zod', schema })));
    }

    // Look for manual validation
    const manualValidations = content.match(/if\s*\(.*validation|if\s*\(!.*\.test\(/g);
    if (manualValidations) {
      validations.push(...manualValidations.map(validation => ({ type: 'manual', validation })));
    }

    return validations;
  }

  /**
   * Extract dependencies (imports)
   */
  extractDependencies(content) {
    const importMatches = content.match(/import.*from\s+['"][^'"]+['"]/g);
    return importMatches || [];
  }

  /**
   * Find consolidation opportunities within domain
   */
  findConsolidationOpportunities(domainAnalysis) {
    const opportunities = [];
    const utilityTypes = {};

    // Group utilities by type
    domainAnalysis.routes.forEach(route => {
      route.utilities.forEach(util => {
        if (!utilityTypes[util.type]) {
          utilityTypes[util.type] = [];
        }
        utilityTypes[util.type].push({ route: route.path, ...util });
      });
    });

    // Find types that appear in multiple routes
    Object.entries(utilityTypes).forEach(([type, instances]) => {
      if (instances.length > 1) {
        opportunities.push({
          type,
          routes: instances.map(i => i.route),
          consolidateInto: instances[0].category,
          impact: instances.length
        });
      }
    });

    return opportunities;
  }

  /**
   * Find what can be reused from existing utilities
   */
  findReuseOpportunities(domainAnalysis) {
    const opportunities = [];
    
    domainAnalysis.routes.forEach(route => {
      route.utilities.forEach(util => {
        // Check if we already have utilities of this type
        const existing = Array.from(this.existingUtils.keys()).filter(key => 
          key.includes(util.type) || key.includes(util.category.replace('Utils', ''))
        );
        
        if (existing.length > 0) {
          opportunities.push({
            route: route.path,
            utilityType: util.type,
            canReuse: existing,
            recommendation: `Reuse existing ${util.category} instead of creating new`
          });
        }
      });
    });

    return opportunities;
  }

  /**
   * Scan directory for existing utilities/services
   */
  async scanDirectory(dirPath, type) {
    if (!fs.existsSync(dirPath)) return;

    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dirPath, file.name);
      
      if (file.isDirectory()) {
        await this.scanDirectory(fullPath, type);
      } else if (file.name.endsWith('.ts') && !file.name.endsWith('.d.ts')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const exports = this.extractExports(content);
        
        exports.forEach(exportName => {
          if (type === 'utils') {
            this.existingUtils.set(exportName, { file: fullPath, type });
          } else if (type === 'services') {
            this.existingServices.set(exportName, { file: fullPath, type });
          } else if (type === 'messaging') {
            this.existingTemplates.set(exportName, { file: fullPath, type });
          }
        });
      }
    }
  }

  /**
   * Extract export names from file content
   */
  extractExports(content) {
    const exports = [];
    
    // Function exports
    const functionExports = content.match(/export\s+(function|const|let)\s+(\w+)/g);
    if (functionExports) {
      exports.push(...functionExports.map(exp => exp.match(/(\w+)$/)[1]));
    }

    // Interface/type exports
    const typeExports = content.match(/export\s+(interface|type)\s+(\w+)/g);
    if (typeExports) {
      exports.push(...typeExports.map(exp => exp.match(/(\w+)$/)[1]));
    }

    return exports;
  }

  /**
   * Generate migration plan for domain
   */
  generateMigrationPlan(domainName) {
    const analysis = this.analysisResults.get(domainName);
    if (!analysis) {
      throw new Error(`No analysis found for domain: ${domainName}`);
    }

    console.log(`\n📋 Migration Plan for ${domainName.toUpperCase()} Domain\n`);
    
    // Consolidation opportunities
    if (analysis.consolidationOpportunities.length > 0) {
      console.log('🔧 CONSOLIDATION OPPORTUNITIES:');
      analysis.consolidationOpportunities.forEach((opp, i) => {
        console.log(`   ${i + 1}. ${opp.type} utilities (${opp.impact} routes)`);
        console.log(`      → Consolidate into: @/lib/utils/${opp.consolidateInto}.ts`);
        console.log(`      → Affected routes: ${opp.routes.join(', ')}\n`);
      });
    }

    // Reuse opportunities
    if (analysis.reuseRecommendations.length > 0) {
      console.log('♻️  REUSE OPPORTUNITIES:');
      analysis.reuseRecommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. Route: ${rec.route}`);
        console.log(`      → ${rec.recommendation}`);
        console.log(`      → Available: ${rec.canReuse.join(', ')}\n`);
      });
    }

    // New utilities needed
    const newUtilities = this.findNewUtilitiesNeeded(analysis);
    if (newUtilities.length > 0) {
      console.log('🆕 NEW UTILITIES TO CREATE:');
      newUtilities.forEach((util, i) => {
        console.log(`   ${i + 1}. ${util.name} (${util.category})`);
        console.log(`      → Purpose: ${util.purpose}`);
        console.log(`      → Used by: ${util.routes.join(', ')}\n`);
      });
    }

    return {
      domain: domainName,
      consolidationOpportunities: analysis.consolidationOpportunities,
      reuseRecommendations: analysis.reuseRecommendations,
      newUtilities
    };
  }

  /**
   * Find new utilities that need to be created
   */
  findNewUtilitiesNeeded(analysis) {
    const newUtils = [];
    const seenTypes = new Set();

    analysis.routes.forEach(route => {
      route.utilities.forEach(util => {
        // Skip if we already have this type or if it can be reused
        if (seenTypes.has(util.type)) return;
        
        const canReuse = analysis.reuseRecommendations.some(rec => 
          rec.route === route.path && rec.utilityType === util.type
        );
        
        if (!canReuse) {
          seenTypes.add(util.type);
          newUtils.push({
            name: `${util.type}Utils`,
            category: util.category,
            purpose: `Handle ${util.type} operations for ${analysis.domain} domain`,
            routes: [route.path],
            examples: util.examples
          });
        }
      });
    });

    return newUtils;
  }

  /**
   * Check for duplicates across all domains
   */
  async checkDuplicatesAcrossDomains() {
    console.log('🔍 Checking for potential duplicates across all domains...\n');
    
    const allUtilities = new Map();
    
    // Analyze all domains
    for (const domain of Object.keys(DOMAIN_ROUTES)) {
      if (!this.analysisResults.has(domain)) {
        await this.analyzeDomain(domain);
      }
      
      const analysis = this.analysisResults.get(domain);
      analysis.routes.forEach(route => {
        route.utilities.forEach(util => {
          const key = `${util.type}-${util.category}`;
          if (!allUtilities.has(key)) {
            allUtilities.set(key, []);
          }
          allUtilities.get(key).push({
            domain,
            route: route.path,
            examples: util.examples
          });
        });
      });
    }

    // Find cross-domain duplicates
    console.log('🚨 CROSS-DOMAIN DUPLICATES:');
    let hasDuplicates = false;
    
    allUtilities.forEach((instances, key) => {
      if (instances.length > 1) {
        const domains = [...new Set(instances.map(i => i.domain))];
        if (domains.length > 1) {
          hasDuplicates = true;
          console.log(`\n   ${key}:`);
          console.log(`      → Found in domains: ${domains.join(', ')}`);
          console.log(`      → Recommendation: Create shared utility in @/lib/utils/`);
          instances.forEach(instance => {
            console.log(`        • ${instance.domain}: ${instance.route}`);
          });
        }
      }
    });

    if (!hasDuplicates) {
      console.log('   ✅ No cross-domain duplicates found!');
    }

    return allUtilities;
  }
}

// CLI Interface
async function main() {
  const [,, command, ...args] = process.argv;
  const analyzer = new ApiMigrationAnalyzer();
  
  try {
    await analyzer.analyzeExistingUtilities();
    
    switch (command) {
      case 'analyze-domain':
        if (!args[0]) {
          console.error('Usage: analyze-domain <domain-name>');
          process.exit(1);
        }
        const analysis = await analyzer.analyzeDomain(args[0]);
        const plan = analyzer.generateMigrationPlan(args[0]);
        
        // Save results
        const outputPath = path.join(__dirname, `../docs/api-migration-${args[0]}.json`);
        fs.writeFileSync(outputPath, JSON.stringify({ analysis, plan }, null, 2));
        console.log(`\n💾 Analysis saved to: ${outputPath}`);
        break;
        
      case 'check-duplicates':
        await analyzer.checkDuplicatesAcrossDomains();
        break;
        
      case 'suggest-consolidation':
        console.log('🔧 Analyzing all domains for consolidation opportunities...');
        for (const domain of Object.keys(DOMAIN_ROUTES)) {
          await analyzer.analyzeDomain(domain);
          analyzer.generateMigrationPlan(domain);
        }
        await analyzer.checkDuplicatesAcrossDomains();
        break;
        
      default:
        console.log('Usage:');
        console.log('  analyze-domain <domain-name>     Analyze specific domain before migration');
        console.log('  check-duplicates                 Check for duplicates across all domains');
        console.log('  suggest-consolidation           Full analysis with consolidation suggestions');
        break;
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 