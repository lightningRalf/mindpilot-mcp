#!/usr/bin/env node

/**
 * Prepare files for DXT packaging
 * Copies d3 src files that mermaid needs but DXT excludes
 */

const fs = require('fs');
const path = require('path');

// Ensure d3/src directory is copied to a location that won't be excluded
const d3SrcPath = path.join(__dirname, '../node_modules/d3/src');
const d3DistPath = path.join(__dirname, '../node_modules/d3/dist');

// Check if d3/src exists
if (fs.existsSync(d3SrcPath)) {
  // Copy index.js from src to dist as a workaround
  const srcIndex = path.join(d3SrcPath, 'index.js');
  const distIndex = path.join(d3DistPath, 'index.js');
  
  if (fs.existsSync(srcIndex) && !fs.existsSync(distIndex)) {
    console.log('Copying d3/src/index.js to d3/dist/index.js as workaround...');
    fs.copyFileSync(srcIndex, distIndex);
  }
  
  // Create a symlink or copy that mermaid can find
  const d3PackageJson = path.join(__dirname, '../node_modules/d3/package.json');
  const pkg = JSON.parse(fs.readFileSync(d3PackageJson, 'utf8'));
  
  // Log what we found
  console.log('d3 package main:', pkg.main);
  console.log('d3 package module:', pkg.module);
}

console.log('DXT preparation complete');