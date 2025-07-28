#!/usr/bin/env node

/**
 * @fileoverview Automated refactor tracking comment scanner
 * @description Scans codebase for @REFACTOR-P9-* comments and generates reports
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// ES modules equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SCAN_DIRECTORIES = ['src', 'docs', 'tests'];
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.md'];
const REFACTOR_COMMENT_PATTERN = /@REFACTOR-P9-(\w+):\s*(.+?)(?:\n\/\/\s*Priority:\s*(\w+)\s*\|\s*Est:\s*([\w\s]+)\s*\|\s*Dependencies:\s*(.+?))?/gs;

// Refactor comment types
const REFACTOR_TYPES = {
  TEMP: 'Temporary Implementation',
  IMPORT: 'Import Path Issue',
  TYPES: 'Type System Improvement',
  PERF: 'Performance Optimization',
  CONSOLIDATE: 'Code Consolidation',
  LINT: 'ESLint/TypeScript Fix',
  LEGACY: 'Legacy Code Removal'
};

// Priority levels
const PRIORITY_LEVELS = {
  High: { order: 1, emoji: '🔥', color: '\x1b[31m' },
  Medium: { order: 2, emoji: '⚠️', color: '\x1b[33m' },
  Low: { order: 3, emoji: '💡', color: '\x1b[34m' }
};

const RESET_COLOR = '\x1b[0m';

class RefactorScanner {
  constructor() {
    this.items = [];
    this.stats = {
      total: 0,
      byType: {},
      byPriority: {},
      withoutTracking: 0
    };
  }

  /**
   * Scan all files in the specified directories
   */
  scanFiles() {
    console.log('🔍 Scanning for refactor tracking comments...\n');
    
    for (const dir of SCAN_DIRECTORIES) {
      const fullPath = path.join(process.cwd(), dir);
      if (fs.existsSync(fullPath)) {
        this.scanDirectory(fullPath, dir);
      }
    }

    this.generateStats();
    return this.items;
  }

  /**
   * Recursively scan directory for files
   */
  scanDirectory(dirPath, relativePath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const entryRelativePath = path.join(relativePath, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules, .git, and other ignored directories
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          this.scanDirectory(fullPath, entryRelativePath);
        }
      } else if (entry.isFile()) {
        // Check if file has relevant extension
        const ext = path.extname(entry.name);
        if (FILE_EXTENSIONS.includes(ext)) {
          this.scanFile(fullPath, entryRelativePath);
        }
      }
    }
  }

  /**
   * Scan individual file for refactor comments
   */
  scanFile(filePath, relativePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      let match;
      REFACTOR_COMMENT_PATTERN.lastIndex = 0; // Reset regex
      
      while ((match = REFACTOR_COMMENT_PATTERN.exec(content)) !== null) {
        const [fullMatch, type, description, priority, estimate, dependencies] = match;
        
        // Find line number
        const lineNumber = content.substring(0, match.index).split('\n').length;
        
        this.items.push({
          file: relativePath,
          line: lineNumber,
          type: type,
          typeLabel: REFACTOR_TYPES[type] || type,
          description: description.trim(),
          priority: priority || 'Medium',
          estimate: estimate ? estimate.trim() : 'Unknown',
          dependencies: dependencies ? dependencies.trim() : 'None',
          fullMatch
        });
        
        this.stats.total++;
      }

      // Also check for temporary implementations without tracking
      this.checkUntrackedTemporaryCode(content, relativePath, lines);
      
    } catch (error) {
      console.error(`Error reading file ${relativePath}: ${error.message}`);
    }
  }

  /**
   * Check for untracked temporary code patterns
   */
  checkUntrackedTemporaryCode(content, relativePath, lines) {
    const patterns = [
      /PLACEHOLDER[:\s]/g,
      /TODO[:\s]/g,
      /FIXME[:\s]/g,
      /console\.log.*placeholder/gi,
      /eslint-disable.*no-explicit-any/g
    ];

    for (const pattern of patterns) {
      let match;
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(content)) !== null) {
        // Check if this line already has a @REFACTOR-P9 comment near it
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const hasTracking = this.items.some(item => 
          item.file === relativePath && Math.abs(item.line - lineNumber) <= 2
        );
        
        if (!hasTracking) {
          this.stats.withoutTracking++;
        }
      }
    }
  }

  /**
   * Generate statistics from scanned items
   */
  generateStats() {
    for (const item of this.items) {
      // Count by type
      if (!this.stats.byType[item.type]) {
        this.stats.byType[item.type] = 0;
      }
      this.stats.byType[item.type]++;

      // Count by priority
      if (!this.stats.byPriority[item.priority]) {
        this.stats.byPriority[item.priority] = 0;
      }
      this.stats.byPriority[item.priority]++;
    }
  }

  /**
   * Generate a comprehensive report
   */
  generateReport() {
    console.log('\n📊 REFACTOR TRACKING REPORT');
    console.log('═'.repeat(60));
    
    this.printSummary();
    this.printByPriority();
    this.printByType();
    this.printDetailedItems();
    this.printReadyToFix();
    this.printUntrackedItems();
  }

  /**
   * Print summary statistics
   */
  printSummary() {
    console.log('\n📈 SUMMARY');
    console.log(`Total tracked items: ${this.stats.total}`);
    console.log(`Items without tracking: ${this.stats.withoutTracking}`);
    console.log(`Total estimated cleanup time: ${this.calculateTotalTime()}`);
  }

  /**
   * Print items grouped by priority
   */
  printByPriority() {
    console.log('\n🎯 BY PRIORITY');
    
    const sortedPriorities = Object.entries(this.stats.byPriority)
      .sort(([a], [b]) => PRIORITY_LEVELS[a].order - PRIORITY_LEVELS[b].order);
    
    for (const [priority, count] of sortedPriorities) {
      const config = PRIORITY_LEVELS[priority];
      console.log(`${config.color}${config.emoji} ${priority}: ${count} items${RESET_COLOR}`);
    }
  }

  /**
   * Print items grouped by type
   */
  printByType() {
    console.log('\n🔧 BY TYPE');
    
    for (const [type, count] of Object.entries(this.stats.byType)) {
      const label = REFACTOR_TYPES[type] || type;
      console.log(`${type}: ${count} items (${label})`);
    }
  }

  /**
   * Print detailed list of all items
   */
  printDetailedItems() {
    console.log('\n📋 DETAILED ITEMS');
    
    // Sort by priority, then by type
    const sortedItems = [...this.items].sort((a, b) => {
      const priorityDiff = PRIORITY_LEVELS[a.priority].order - PRIORITY_LEVELS[b.priority].order;
      if (priorityDiff !== 0) return priorityDiff;
      return a.type.localeCompare(b.type);
    });

    for (const item of sortedItems) {
      const config = PRIORITY_LEVELS[item.priority];
      console.log(`\n${config.color}${config.emoji} [${item.priority}] ${item.typeLabel}${RESET_COLOR}`);
      console.log(`   📁 ${item.file}:${item.line}`);
      console.log(`   📝 ${item.description}`);
      console.log(`   ⏱️  Est: ${item.estimate} | 🔗 Deps: ${item.dependencies}`);
    }
  }

  /**
   * Check which items are ready to fix (dependencies resolved)
   */
  printReadyToFix() {
    console.log('\n✅ READY TO FIX (No dependencies or completed phases)');
    
    const readyItems = this.items.filter(item => 
      item.dependencies === 'None' || 
      item.dependencies.includes('API_001') || // Assume completed phases
      item.dependencies.includes('API_002')
    );
    
    if (readyItems.length === 0) {
      console.log('No items ready for immediate fixing.');
    } else {
      for (const item of readyItems) {
        const config = PRIORITY_LEVELS[item.priority];
        console.log(`${config.emoji} ${item.file}:${item.line} - ${item.description}`);
      }
    }
  }

  /**
   * Warn about untracked temporary code
   */
  printUntrackedItems() {
    if (this.stats.withoutTracking > 0) {
      console.log(`\n⚠️  WARNING: Found ${this.stats.withoutTracking} potential temporary code items without tracking comments.`);
      console.log('Consider adding @REFACTOR-P9-* comments to track these for Phase 9 cleanup.');
    }
  }

  /**
   * Calculate total estimated time
   */
  calculateTotalTime() {
    let totalHours = 0;
    let totalMinutes = 0;
    
    for (const item of this.items) {
      if (item.estimate !== 'Unknown') {
        const match = item.estimate.match(/(\d+)\s*(h|hour|hr|min|minute)/i);
        if (match) {
          const amount = parseInt(match[1]);
          const unit = match[2].toLowerCase();
          
          if (unit.startsWith('h')) {
            totalHours += amount;
          } else if (unit.startsWith('min')) {
            totalMinutes += amount;
          }
        }
      }
    }
    
    totalHours += Math.floor(totalMinutes / 60);
    totalMinutes = totalMinutes % 60;
    
    return `${totalHours}h ${totalMinutes}m`;
  }

  /**
   * Update the tracking documentation
   */
  updateTrackingDoc() {
    console.log('\n📝 Updating REFACTOR_TRACKING.md...');
    
    const docPath = path.join(process.cwd(), 'docs', 'REFACTOR_TRACKING.md');
    
    if (!fs.existsSync(docPath)) {
      console.log('REFACTOR_TRACKING.md not found, skipping update.');
      return;
    }
    
    // Generate markdown tables for each priority
    let tables = '';
    
    for (const [priority] of Object.entries(PRIORITY_LEVELS)) {
      const items = this.items.filter(item => item.priority === priority);
      
      if (items.length > 0) {
        tables += `\n### ${priority} Priority Items\n\n`;
        tables += '| File | Line | Type | Description | Dependencies | Est Time |\n';
        tables += '|------|------|------|-------------|--------------|----------|\n';
        
        for (const item of items) {
          tables += `| \`${item.file}\` | ${item.line} | ${item.type} | ${item.description} | ${item.dependencies} | ${item.estimate} |\n`;
        }
      }
    }
    
    // Update the tracking document (simplified approach - in real implementation would be more sophisticated)
    console.log('Generated updated tracking tables. Manual update of REFACTOR_TRACKING.md recommended.');
  }
}

// CLI handling - ES modules check for direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const scanner = new RefactorScanner();
  const command = process.argv[2];
  
  switch (command) {
    case 'scan':
    case undefined:
      scanner.scanFiles();
      scanner.generateReport();
      break;
      
    case 'ready':
      scanner.scanFiles();
      scanner.printReadyToFix();
      break;
      
    case 'update':
      scanner.scanFiles();
      scanner.updateTrackingDoc();
      break;
      
    case 'help':
    default:
      console.log(`
Usage: node tools/refactor-scanner.js [command]

Commands:
  scan     Scan for all @REFACTOR-P9-* comments and generate full report (default)
  ready    Show only items ready to fix (no dependencies)  
  update   Update REFACTOR_TRACKING.md with current scan results
  help     Show this help message

Examples:
  npm run refactor:scan
  npm run refactor:ready
  npm run refactor:update
      `);
  }
}

export default RefactorScanner; 