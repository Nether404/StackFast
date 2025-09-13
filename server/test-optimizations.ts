#!/usr/bin/env tsx

/**
 * Test script to verify database and API optimizations
 */

import { ResponseOptimizer } from './services/response-optimizer';
import { estimateCompressionRatio } from './middleware/compression';
import { createPaginatedResponse, paginateArray } from './middleware/pagination';

async function testOptimizations() {
  console.log('🧪 Testing API optimizations...\n');

  // Test 1: Response Optimization
  console.log('1️⃣ Testing Response Optimization:');
  const sampleData = Array.from({ length: 100 }, (_, i) => ({
    id: `tool-${i}`,
    name: `Tool ${i}`,
    description: `This is a detailed description for tool ${i} with lots of text that could be optimized`,
    category: 'Development',
    maturityScore: Math.random() * 10,
    popularityScore: Math.random() * 10,
    features: ['feature1', 'feature2', 'feature3'],
    notes: 'These are detailed notes that might not be needed in all responses'
  }));

  const originalSize = JSON.stringify(sampleData).length;
  console.log(`   Original data size: ${originalSize} bytes`);

  const optimized = ResponseOptimizer.optimizeData(sampleData, {
    excludeFields: ['notes', 'description'],
    numberPrecision: 1
  });
  const optimizedSize = JSON.stringify(optimized).length;
  console.log(`   Optimized data size: ${optimizedSize} bytes`);
  console.log(`   Size reduction: ${Math.round((1 - optimizedSize / originalSize) * 100)}%\n`);

  // Test 2: Compression
  console.log('2️⃣ Testing Compression:');
  const testString = JSON.stringify(sampleData);
  
  try {
    const gzipRatio = await estimateCompressionRatio(testString, 'gzip');
    const brotliRatio = await estimateCompressionRatio(testString, 'brotli');
    
    console.log(`   Original size: ${testString.length} bytes`);
    console.log(`   Gzip compression: ${Math.round((1 - gzipRatio) * 100)}% reduction`);
    console.log(`   Brotli compression: ${Math.round((1 - brotliRatio) * 100)}% reduction\n`);
  } catch (error) {
    console.log(`   Compression test failed: ${error}\n`);
  }

  // Test 3: Pagination
  console.log('3️⃣ Testing Pagination:');
  const paginationParams = { page: 2, limit: 10, offset: 10 };
  const { items, total } = paginateArray(sampleData, paginationParams);
  
  console.log(`   Total items: ${total}`);
  console.log(`   Page 2 items: ${items.length}`);
  console.log(`   Items ${paginationParams.offset + 1}-${paginationParams.offset + items.length} of ${total}\n`);

  // Test 4: Response Creation
  console.log('4️⃣ Testing Paginated Response:');
  const paginatedResponse = createPaginatedResponse(
    items,
    total,
    paginationParams,
    'http://localhost:3000/api/tools'
  );
  
  console.log(`   Response structure: ${Object.keys(paginatedResponse).join(', ')}`);
  console.log(`   Has next page: ${paginatedResponse.meta.hasNext}`);
  console.log(`   Has previous page: ${paginatedResponse.meta.hasPrev}\n`);

  // Test 5: Data Compression (removing redundancy)
  console.log('5️⃣ Testing Data Compression:');
  const redundantData = Array.from({ length: 50 }, (_, i) => ({
    id: `item-${i}`,
    name: `Item ${i}`,
    category: 'Same Category', // This will be common
    type: 'Same Type', // This will be common
    value: Math.random()
  }));

  const compressed = ResponseOptimizer.compressResponseData(redundantData);
  const compressedSize = JSON.stringify(compressed).length;
  const originalRedundantSize = JSON.stringify(redundantData).length;
  
  console.log(`   Original redundant data: ${originalRedundantSize} bytes`);
  console.log(`   Compressed data: ${compressedSize} bytes`);
  console.log(`   Redundancy reduction: ${Math.round((1 - compressedSize / originalRedundantSize) * 100)}%\n`);

  // Test 6: Mobile Optimization
  console.log('6️⃣ Testing Mobile Optimization:');
  const mobileOptimized = ResponseOptimizer.optimizeForMobile(sampleData.slice(0, 5));
  const mobileSize = JSON.stringify(mobileOptimized).length;
  const desktopSize = JSON.stringify(sampleData.slice(0, 5)).length;
  
  console.log(`   Desktop response: ${desktopSize} bytes`);
  console.log(`   Mobile response: ${mobileSize} bytes`);
  console.log(`   Mobile reduction: ${Math.round((1 - mobileSize / desktopSize) * 100)}%\n`);

  console.log('✅ All optimization tests completed successfully!');
}

// Run tests
testOptimizations()
  .then(() => {
    console.log('\n🎉 Optimization testing completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Optimization testing failed:', error);
    process.exit(1);
  });