/**
 * Скрипт для автоматичної заміни розширень зображень у вихідному коді на .webp.
 * 
 * Що він робить:
 * 1. Шукає вихідні файли (.tsx, .ts, .astro) у директорії `src/`.
 * 2. Знаходить у їхньому коді згадки старих форматів зображень (.png, .jpg, .jpeg).
 * 3. Автоматично переписує ці згадки на .webp, щоб код посилався на вже сконвертовані картинки.
 * 
 * Як користуватися:
 * Використовується відразу після `convert.mjs`.
 * Запустіть скрипт у терміналі командою: 
 * node replace.mjs
 */
import fs from 'fs'; 
import path from 'path';

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) walkDir(p);
    else if (p.endsWith('.tsx') || p.endsWith('.ts') || p.endsWith('.astro')) {
      let content = fs.readFileSync(p, 'utf8');
      const newContent = content.replace(/\.(png|jpe?g)(['"`\)])/gi, '.webp$2');
      if (content !== newContent) {
        fs.writeFileSync(p, newContent);
        console.log('Updated', p);
      }
    }
  }
}
walkDir('src/');
