// Script to update tool scores with real CSV data
const fs = require('fs');
const http = require('http');

// Read and parse CSV data
const csvData = fs.readFileSync('attached_assets/Coding tool profile database setup_1754841204572.csv', 'utf-8');
const lines = csvData.split('\n');

// Parse CSV and create updates
const updates = [];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  const values = line.split(',').map(v => v.replace(/"/g, ''));
  if (values.length < 13) continue;
  
  const [name, , , , , , , , , , maturityScoreStr, popularityScoreStr, pricing] = values;
  
  if (!name) continue;
  
  const parseScore = (str) => {
    if (!str || str.toLowerCase().includes('not specified')) return 7.0;
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 7.0 : parsed;
  };
  
  updates.push({
    name: name.trim(),
    maturityScore: parseScore(maturityScoreStr),
    popularityScore: parseScore(popularityScoreStr),
    pricing: pricing && pricing.toLowerCase() !== 'not specified' ? pricing : 'Pricing not specified'
  });
}

// Output the updates for manual application
console.log('Found', updates.length, 'tools to update');
console.log('Sample updates:');
updates.slice(0, 5).forEach(update => {
  console.log(`${update.name}: Maturity ${update.maturityScore}, Popularity ${update.popularityScore}, Pricing: ${update.pricing}`);
});