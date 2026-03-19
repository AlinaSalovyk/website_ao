/**
 * Скрипт для масової конвертації зображень у формат WebP.
 * 
 * Що він робить:
 * 1. Проходить по всіх папках всередині директорії `public/images`.
 * 2. Знаходить всі зображення з розширеннями .jpg, .jpeg та .png.
 * 3. Конвертує їх у сучасний оптимізований формат .webp (з якістю 85%) для швидшого завантаження сайту.
 * 4. ВИДАЛЯЄ оригінальні файли (.jpg, .png) після успішної конвертації.
 * 
 * Як користуватися:
 * Запустіть скрипт у терміналі командою: 
 * node convert.mjs
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      await walkDir(fullPath);
    } else {
      const ext = path.extname(fullPath).toLowerCase();
      if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
        const newPath = fullPath.replace(/\.(png|jpe?g)$/i, '.webp');
        console.log(`Converting ${fullPath} to ${newPath}`);
        await sharp(fullPath).webp({ quality: 85 }).toFile(newPath);
        fs.unlinkSync(fullPath);
      }
    }
  }
}

walkDir('public/images')
  .then(() => console.log('Done converting images!'))
  .catch(console.error);
