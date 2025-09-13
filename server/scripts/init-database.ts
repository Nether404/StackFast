#!/usr/bin/env tsx

/**
 * Database initialization script
 * Applies indexes and optimizations to the database
 */

import { DatabaseOptimizer } from '../services/database-optimizer';
import { db } from '../db';

async function initializeDatabase() {
  console.log('🚀 Initializing database optimizations...');
  
  try {
    // Apply database indexes
    console.log('📊 Applying database indexes...');
    await DatabaseOptimizer.applyIndexes();
    console.log('✅ Database indexes applied successfully');
    
    // Get database statistics
    console.log('📈 Gathering database statistics...');
    const stats = await DatabaseOptimizer.getDatabaseStats();
    
    console.log('\n📋 Database Statistics:');
    console.log(`   Tools: ${stats.toolCount}`);
    console.log(`   Categories: ${stats.categoryCount}`);
    console.log(`   Compatibilities: ${stats.compatibilityCount}`);
    console.log(`   Indexes: ${stats.indexInfo.length}`);
    
    console.log('\n🔍 Applied Indexes:');
    stats.indexInfo.forEach(index => {
      if (index.indexname.startsWith('idx_')) {
        console.log(`   ✓ ${index.indexname} on ${index.tablename}`);
      }
    });
    
    console.log('\n🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Always run when this file is executed
initializeDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

export { initializeDatabase };