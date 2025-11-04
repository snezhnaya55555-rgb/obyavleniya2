// Simple script to generate PWA icons
// Use: node scripts/generate-icons.js
// Or use the HTML file: public/generate-icons.html

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create simple PNG icons using base64 data URIs
// These are minimal valid PNG files

// 192x192 PNG: черный фон, желтый квадрат с буквой "О"
const png192 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// Для реальных иконок используйте онлайн генератор или запустите public/generate-icons.html в браузере
console.log('Для создания иконок используйте:');
console.log('1. Откройте public/generate-icons.html в браузере');
console.log('2. Или используйте онлайн генератор: https://realfavicongenerator.net/');
console.log('3. Или создайте PNG файлы 192x192 и 512x512 вручную');

// Создадим placeholder файлы если их нет
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Placeholder PNG (1x1 transparent)
const placeholder = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

if (!fs.existsSync(path.join(publicDir, 'pwa-192x192.png'))) {
  fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), placeholder);
  console.log('Создан placeholder: pwa-192x192.png');
}

if (!fs.existsSync(path.join(publicDir, 'pwa-512x512.png'))) {
  fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), placeholder);
  console.log('Создан placeholder: pwa-512x512.png');
}

console.log('\n⚠️  ВАЖНО: Замените placeholder файлы на реальные PNG иконки!');

