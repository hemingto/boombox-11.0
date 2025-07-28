#!/usr/bin/env node

/**
 * @fileoverview Utility Duplication Scanner - Finds redundant functions and patterns in current codebase
 * 
 * USAGE:
 * node tools/utility-duplication-scanner.js scan
 * node tools/utility-duplication-scanner.js detailed-report
 * 
 * FUNCTIONALITY:
 * - Scans boombox-11.0 for duplicate utility functions
 * - Identifies similar patterns across different files
 * - Reports redundant implementations
 * - Suggests consolidation opportunities
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target directories to scan
const SCAN_DIRECTORIES = [
  path.join(__dirname, '../src/lib/utils'),
  path.join(__dirname, '../src/lib/services'),
  path.join(__dirname, '../src/lib/messaging'),
  path.join(__dirname, '../src/app/api')
];

class UtilityDuplicationScanner {
  constructor() {
    this.duplicates = new Map();
    this.patterns = new Map();
    this.fileAnalysis = new Map();
  }

  /**
   * Main scanning function
   */
  async scan() {
    console.log('🔍 Scanning for utility duplications...\n');
    
    for (const dir of SCAN_DIRECTORIES) {
      if (fs.existsSync(dir)) {
        await this.scanDirectory(dir);
      }
    }

    this.analyzePatterns();
    this.reportDuplicates();
  }

  /**
   * Scan directory recursively
   */
  async scanDirectory(dirPath) {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      
      if (item.isDirectory()) {
        await this.scanDirectory(fullPath);
      } else if (item.name.endsWith('.ts') && !item.name.endsWith('.d.ts')) {
        await this.analyzeFile(fullPath);
      }
    }
  }

  /**
   * Analyze individual file for patterns
   */
  async analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(path.join(__dirname, '..'), filePath);
    
    const analysis = {
      path: relativePath,
      functions: this.extractFunctions(content),
      patterns: this.extractPatterns(content),
      phoneUtils: this.extractPhonePatterns(content),
      dateUtils: this.extractDatePatterns(content),
      currencyUtils: this.extractCurrencyPatterns(content),
      validationUtils: this.extractValidationPatterns(content)
    };
    
    this.fileAnalysis.set(relativePath, analysis);
  }

  /**
   * Extract function definitions
   */
  extractFunctions(content) {
    const functions = [];
    
    // Function declarations and exports
    const functionPatterns = [
      /export\s+function\s+(\w+)/g,
      /function\s+(\w+)/g,
      /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/g,
      /(\w+):\s*\([^)]*\)\s*=>/g
    ];

    for (const pattern of functionPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        functions.push({
          name: match[1],
          type: 'function'
        });
      }
    }

    return functions;
  }

  /**
   * Extract common utility patterns
   */
  extractPatterns(content) {
    const patterns = [];

    // Common patterns to detect
    const patternChecks = [
      {
        name: 'phoneNormalization',
        regex: /phone\.replace\(\/\\D\/g,\s*['"]['"]\)|digits\s*=\s*phone\.replace/g,
        description: 'Phone number normalization pattern'
      },
      {
        name: 'currencyFormat',
        regex: /toFixed\(2\)|formatCurrency|Intl\.NumberFormat.*currency/g,
        description: 'Currency formatting pattern'
      },
      {
        name: 'dateFormat',
        regex: /format\(.*date|toLocaleString|toISOString/g,
        description: 'Date formatting pattern'
      },
      {
        name: 'emailValidation',
        regex: /['"\/].*@.*\.['"\/]|email.*test\(|isValidEmail/g,
        description: 'Email validation pattern'
      },
      {
        name: 'timeFormat',
        regex: /formatTime|toLocaleTimeString|padStart\(2,\s*['"]0['"]\)/g,
        description: 'Time formatting pattern'
      },
      {
        name: 'urlValidation',
        regex: /https?:\/\/|url.*test\(|isValidURL/g,
        description: 'URL validation pattern'
      }
    ];

    for (const check of patternChecks) {
      const matches = content.match(check.regex);
      if (matches && matches.length > 0) {
        patterns.push({
          name: check.name,
          description: check.description,
          count: matches.length,
          examples: matches.slice(0, 3)
        });
      }
    }

    return patterns;
  }

  /**
   * Extract phone-specific patterns
   */
  extractPhonePatterns(content) {
    const patterns = [];
    
    const phoneChecks = [
      {
        name: 'normalizePhoneE164',
        regex: /normalizePhoneNumberToE164|formatPhoneNumberToE164/g,
        description: 'E.164 phone normalization'
      },
      {
        name: 'phoneReplace',
        regex: /phone\.replace\(.*\/\\D\/g|\.replace\(.*\[^0-9\+\]|digits\s*=.*replace/g,
        description: 'Phone number cleaning'
      },
      {
        name: 'phoneFormat',
        regex: /formatPhoneNumber|formatPhone/g,
        description: 'Phone number formatting'
      }
    ];

    for (const check of phoneChecks) {
      const matches = content.match(check.regex);
      if (matches) {
        patterns.push({
          name: check.name,
          count: matches.length,
          examples: matches.slice(0, 2)
        });
      }
    }

    return patterns;
  }

  /**
   * Extract date-specific patterns
   */
  extractDatePatterns(content) {
    const patterns = [];
    
    const dateChecks = [
      {
        name: 'formatDate',
        regex: /formatDate|format.*Date/g,
        description: 'Date formatting functions'
      },
      {
        name: 'formatTime',
        regex: /formatTime|format.*Time/g,
        description: 'Time formatting functions'
      },
      {
        name: 'formattedTime',
        regex: /formattedTime\s*=/g,
        description: 'Inline time formatting'
      }
    ];

    for (const check of dateChecks) {
      const matches = content.match(check.regex);
      if (matches) {
        patterns.push({
          name: check.name,
          count: matches.length,
          examples: matches.slice(0, 2)
        });
      }
    }

    return patterns;
  }

  /**
   * Extract currency-specific patterns
   */
  extractCurrencyPatterns(content) {
    const patterns = [];
    
    const currencyChecks = [
      {
        name: 'formatCurrency',
        regex: /formatCurrency/g,
        description: 'Currency formatting function calls'
      },
      {
        name: 'toFixed2',
        regex: /toFixed\(2\)/g,
        description: 'Manual currency formatting with toFixed(2)'
      },
      {
        name: 'dollarSign',
        regex: /\$\$\{.*toFixed\(2\)/g,
        description: 'Inline dollar formatting'
      }
    ];

    for (const check of currencyChecks) {
      const matches = content.match(check.regex);
      if (matches) {
        patterns.push({
          name: check.name,
          count: matches.length,
          examples: matches.slice(0, 2)
        });
      }
    }

    return patterns;
  }

  /**
   * Extract validation-specific patterns
   */
  extractValidationPatterns(content) {
    const patterns = [];
    
    const validationChecks = [
      {
        name: 'emailRegex',
        regex: /['"\/].*@.*\.['"\/]/g,
        description: 'Email validation regex patterns'
      },
      {
        name: 'phoneValidation',
        regex: /isValidPhone|phone.*test\(/g,
        description: 'Phone validation functions'
      },
      {
        name: 'urlValidation',
        regex: /isValidURL|url.*test\(/g,
        description: 'URL validation functions'
      }
    ];

    for (const check of validationChecks) {
      const matches = content.match(check.regex);
      if (matches) {
        patterns.push({
          name: check.name,
          count: matches.length,
          examples: matches.slice(0, 2)
        });
      }
    }

    return patterns;
  }

  /**
   * Analyze patterns across files for duplicates
   */
  analyzePatterns() {
    const patternGroups = new Map();
    
    // Group similar patterns across files
    for (const [filePath, analysis] of this.fileAnalysis) {
      analysis.patterns.forEach(pattern => {
        if (!patternGroups.has(pattern.name)) {
          patternGroups.set(pattern.name, []);
        }
        patternGroups.get(pattern.name).push({
          file: filePath,
          count: pattern.count,
          examples: pattern.examples
        });
      });
    }

    // Find patterns that appear in multiple files
    for (const [patternName, instances] of patternGroups) {
      if (instances.length > 1) {
        this.duplicates.set(patternName, {
          description: instances[0].description || 'Common pattern',
          files: instances,
          severity: this.calculateSeverity(patternName, instances)
        });
      }
    }
  }

  /**
   * Calculate severity of duplication
   */
  calculateSeverity(patternName, instances) {
    const fileCount = instances.length;
    const totalOccurrences = instances.reduce((sum, inst) => sum + inst.count, 0);
    
    // High severity patterns
    const highSeverityPatterns = ['phoneNormalization', 'formatCurrency', 'emailValidation'];
    
    if (highSeverityPatterns.includes(patternName)) {
      return 'HIGH';
    } else if (fileCount >= 3 || totalOccurrences >= 5) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }

  /**
   * Report duplications found
   */
  reportDuplicates() {
    console.log('📋 DUPLICATION ANALYSIS RESULTS\n');
    
    const highPriority = [];
    const mediumPriority = [];
    const lowPriority = [];
    
    for (const [pattern, data] of this.duplicates) {
      if (data.severity === 'HIGH') {
        highPriority.push({ pattern, ...data });
      } else if (data.severity === 'MEDIUM') {
        mediumPriority.push({ pattern, ...data });
      } else {
        lowPriority.push({ pattern, ...data });
      }
    }

    this.reportSection('🚨 HIGH PRIORITY DUPLICATES', highPriority);
    this.reportSection('⚠️  MEDIUM PRIORITY DUPLICATES', mediumPriority);
    this.reportSection('ℹ️  LOW PRIORITY DUPLICATES', lowPriority);
    
    this.generateConsolidationRecommendations();
  }

  /**
   * Report a section of duplicates
   */
  reportSection(title, duplicates) {
    if (duplicates.length === 0) {
      console.log(`${title}: None found ✅\n`);
      return;
    }

    console.log(`${title}:\n`);
    
    duplicates.forEach((dup, index) => {
      console.log(`   ${index + 1}. ${dup.pattern}`);
      console.log(`      Files affected: ${dup.files.length}`);
      console.log(`      Total occurrences: ${dup.files.reduce((sum, f) => sum + f.count, 0)}`);
      console.log(`      Files:`);
      
      dup.files.forEach(file => {
        console.log(`        • ${file.file} (${file.count} instances)`);
      });
      
      console.log();
    });
  }

  /**
   * Generate specific consolidation recommendations
   */
  generateConsolidationRecommendations() {
    console.log('💡 CONSOLIDATION RECOMMENDATIONS:\n');

    // Phone number duplicates
    const phoneFiles = [];
    for (const [filePath, analysis] of this.fileAnalysis) {
      if (analysis.phoneUtils.length > 0) {
        phoneFiles.push(filePath);
      }
    }

    if (phoneFiles.length > 1) {
      console.log('📞 PHONE NUMBER UTILITIES:');
      console.log('   FOUND IN:');
      phoneFiles.forEach(file => {
        console.log(`     • ${file}`);
      });
      console.log('   RECOMMENDATION: ✅ Already consolidated in src/lib/utils/phoneUtils.ts');
      console.log('   ACTION: Remove inline phone formatting, use import from phoneUtils\n');
    }

    // Date formatting duplicates
    const dateFiles = [];
    for (const [filePath, analysis] of this.fileAnalysis) {
      if (analysis.dateUtils.length > 0) {
        dateFiles.push(filePath);
      }
    }

    if (dateFiles.length > 1) {
      console.log('📅 DATE FORMATTING UTILITIES:');
      console.log('   FOUND IN:');
      dateFiles.forEach(file => {
        console.log(`     • ${file}`);
      });
      console.log('   RECOMMENDATION: ✅ Mostly consolidated in src/lib/utils/dateUtils.ts');
      console.log('   ACTION: Replace inline time formatting with centralized utilities\n');
    }

    // Currency formatting duplicates
    const currencyFiles = [];
    for (const [filePath, analysis] of this.fileAnalysis) {
      if (analysis.currencyUtils.length > 0) {
        currencyFiles.push(filePath);
      }
    }

    if (currencyFiles.length > 1) {
      console.log('💰 CURRENCY FORMATTING:');
      console.log('   FOUND IN:');
      currencyFiles.forEach(file => {
        console.log(`     • ${file}`);
      });
      console.log('   RECOMMENDATION: ✅ Consolidated in src/lib/utils/currencyUtils.ts');
      console.log('   ACTION: Replace .toFixed(2) patterns with formatCurrency() function\n');
    }

    this.generateSpecificFixRecommendations();
  }

  /**
   * Generate specific fix recommendations
   */
  generateSpecificFixRecommendations() {
    console.log('🔧 SPECIFIC FIXES NEEDED:\n');

    // Analyze phone normalization duplicates
    const phoneNormalizationFiles = [];
    for (const [filePath, analysis] of this.fileAnalysis) {
      const hasPhoneNormalization = analysis.phoneUtils.some(p => 
        p.name === 'normalizePhoneE164' || 
        p.name === 'phoneReplace'
      );
      if (hasPhoneNormalization && !filePath.includes('phoneUtils.ts')) {
        phoneNormalizationFiles.push(filePath);
      }
    }

    if (phoneNormalizationFiles.length > 0) {
      console.log('1. PHONE NORMALIZATION DUPLICATES:');
      phoneNormalizationFiles.forEach(file => {
        console.log(`   • ${file}`);
      });
      console.log('   FIX: Replace with import { normalizePhoneNumberToE164 } from "@/lib/utils/phoneUtils"\n');
    }

    // Analyze inline time formatting
    const inlineTimeFiles = [];
    for (const [filePath, analysis] of this.fileAnalysis) {
      const hasInlineTime = analysis.dateUtils.some(p => p.name === 'formattedTime');
      if (hasInlineTime && !filePath.includes('dateUtils.ts')) {
        inlineTimeFiles.push(filePath);
      }
    }

    if (inlineTimeFiles.length > 0) {
      console.log('2. INLINE TIME FORMATTING:');
      inlineTimeFiles.forEach(file => {
        console.log(`   • ${file}`);
      });
      console.log('   FIX: Replace with import { formatTime, formatAppointmentTime } from "@/lib/utils/dateUtils"\n');
    }

    // Analyze .toFixed(2) patterns
    const toFixedFiles = [];
    for (const [filePath, analysis] of this.fileAnalysis) {
      const hasToFixed = analysis.currencyUtils.some(p => p.name === 'toFixed2');
      if (hasToFixed && !filePath.includes('currencyUtils.ts')) {
        toFixedFiles.push(filePath);
      }
    }

    if (toFixedFiles.length > 0) {
      console.log('3. MANUAL CURRENCY FORMATTING (.toFixed(2)):');
      toFixedFiles.forEach(file => {
        console.log(`   • ${file}`);
      });
      console.log('   FIX: Replace with import { formatCurrency } from "@/lib/utils/currencyUtils"\n');
    }

    console.log('📈 ESTIMATED IMPACT:');
    console.log(`   • Reduced code duplication: ~${phoneNormalizationFiles.length + inlineTimeFiles.length + toFixedFiles.length} files`);
    console.log(`   • Improved maintainability: Centralized utility functions`);
    console.log(`   • Better consistency: Standardized formatting patterns`);
    console.log(`   • Easier testing: Unit test utilities once instead of multiple implementations\n`);
  }

  /**
   * Generate detailed report
   */
  generateDetailedReport() {
    console.log('📊 DETAILED UTILITY ANALYSIS\n');
    
    console.log('FILES ANALYZED:');
    for (const [filePath, analysis] of this.fileAnalysis) {
      console.log(`\n📁 ${filePath}`);
      console.log(`   Functions: ${analysis.functions.length}`);
      console.log(`   Patterns: ${analysis.patterns.length}`);
      
      if (analysis.phoneUtils.length > 0) {
        console.log(`   Phone utils: ${analysis.phoneUtils.map(p => p.name).join(', ')}`);
      }
      
      if (analysis.dateUtils.length > 0) {
        console.log(`   Date utils: ${analysis.dateUtils.map(p => p.name).join(', ')}`);
      }
      
      if (analysis.currencyUtils.length > 0) {
        console.log(`   Currency utils: ${analysis.currencyUtils.map(p => p.name).join(', ')}`);
      }
    }
  }
}

// CLI Interface
async function main() {
  const [,, command] = process.argv;
  const scanner = new UtilityDuplicationScanner();
  
  try {
    switch (command) {
      case 'scan':
        await scanner.scan();
        break;
        
      case 'detailed-report':
        await scanner.scan();
        scanner.generateDetailedReport();
        break;
        
      default:
        console.log('Usage:');
        console.log('  scan                 Find and report utility duplications');
        console.log('  detailed-report      Generate detailed analysis of all files');
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