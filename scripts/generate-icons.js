/**
 * Icon Generator Script
 * Run with: node scripts/generate-icons.js
 *
 * Requires: npm install canvas
 */

import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = join(__dirname, '..', 'public', 'icons');

// Ensure output directory exists
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  const radius = size * 0.125;
  ctx.fillStyle = '#0ea5e9';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fill();

  // Scale factor
  const scale = size / 512;

  // Draw box icon
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 24 * scale;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Main box
  ctx.beginPath();
  ctx.roundRect(96 * scale, 160 * scale, 320 * scale, 240 * scale, 16 * scale);
  ctx.stroke();

  // Handle
  ctx.beginPath();
  ctx.roundRect(176 * scale, 120 * scale, 160 * scale, 56 * scale, 8 * scale);
  ctx.stroke();

  // Lines inside box
  ctx.beginPath();
  ctx.moveTo(160 * scale, 240 * scale);
  ctx.lineTo(352 * scale, 240 * scale);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(160 * scale, 310 * scale);
  ctx.lineTo(288 * scale, 310 * scale);
  ctx.stroke();

  return canvas.toBuffer('image/png');
}

// Generate all sizes
sizes.forEach(size => {
  const buffer = generateIcon(size);
  const filename = `icon-${size}.png`;
  writeFileSync(join(outputDir, filename), buffer);
  console.log(`Generated ${filename}`);
});

console.log('All icons generated!');
