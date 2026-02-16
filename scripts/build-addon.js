/**
 * Build script for Home Assistant Addon
 * Creates a clean folder with only necessary files
 *
 * Run with: node scripts/build-addon.js
 */

import { cpSync, mkdirSync, rmSync, existsSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const outputDir = join(rootDir, 'deploy', 'home-inventory');

console.log('Building Home Assistant Addon...\n');

// Clean output directory
if (existsSync(outputDir)) {
  console.log('Cleaning previous build...');
  rmSync(outputDir, { recursive: true });
}
mkdirSync(outputDir, { recursive: true });

// Files to copy (relative to root)
const filesToCopy = [
  'config.yaml',
  'build.yaml',
  'Dockerfile',
  'index.html',
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'tailwind.config.ts',
  'postcss.config.js',
  'components.json',
];

// Directories to copy
const dirsToCopy = [
  'src',
  'server',
  'public',
];

// Copy individual files
console.log('Copying files...');
filesToCopy.forEach(file => {
  const src = join(rootDir, file);
  const dest = join(outputDir, file);
  if (existsSync(src)) {
    cpSync(src, dest);
    console.log(`  ✓ ${file}`);
  } else {
    console.log(`  ✗ ${file} (not found)`);
  }
});

// Copy directories
console.log('\nCopying directories...');
dirsToCopy.forEach(dir => {
  const src = join(rootDir, dir);
  const dest = join(outputDir, dir);
  if (existsSync(src)) {
    cpSync(src, dest, { recursive: true });
    console.log(`  ✓ ${dir}/`);
  } else {
    console.log(`  ✗ ${dir}/ (not found)`);
  }
});

// Create a minimal package.json for production
console.log('\nCreating production package.json...');
const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));

const prodPackageJson = {
  name: packageJson.name,
  version: packageJson.version,
  type: packageJson.type,
  scripts: {
    build: packageJson.scripts.build,
    server: packageJson.scripts.server,
    start: packageJson.scripts.start,
  },
  dependencies: packageJson.dependencies,
  devDependencies: packageJson.devDependencies,
};

writeFileSync(
  join(outputDir, 'package.json'),
  JSON.stringify(prodPackageJson, null, 2)
);
console.log('  ✓ package.json (cleaned)');

// Remove unnecessary files from public that got copied
const unnecessaryPublicFiles = [
  'generate-icons.html', // Icon generator - not needed in production
];

console.log('\nCleaning up...');
unnecessaryPublicFiles.forEach(file => {
  const filePath = join(outputDir, 'public', file);
  if (existsSync(filePath)) {
    rmSync(filePath);
    console.log(`  ✓ Removed public/${file}`);
  }
});

console.log('\n' + '='.repeat(50));
console.log('Build complete!');
console.log('='.repeat(50));
console.log(`\nOutput folder: ${outputDir}`);

console.log('\nNext steps:');
console.log('1. Copy "deploy/home-inventory" to your Home Assistant addons folder');
console.log('   - Via Samba: copy to \\\\your-ha-ip\\addons\\');
console.log('   - Via SSH: copy to /addons/');
console.log('2. In HA: Settings → Add-ons → Add-on Store → ⋮ → Check for updates');
console.log('3. Find "Home Inventory Tracker" in Local add-ons');
console.log('4. Click Install/Rebuild, then Start');
console.log('5. Access via HA sidebar or http://your-ha-ip:3000');
