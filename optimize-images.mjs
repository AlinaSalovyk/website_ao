import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const base = "public/images";

const resizeTasks = [
  { file: "Home/3d-black-chrome-shape.webp", width: 800, height: 834 },
  { file: "logo/logo-icon.webp", width: 160, height: 160 },
  { file: "InstituteManagement/shulyk.webp", width: 84, height: 84 },
  { file: "InstituteManagement/cherniavskyi.webp", width: 84, height: 84 },
  { file: "InstituteManagement/Kozak.webp", width: 84, height: 84 },
  { file: "InstituteManagement/haletska.webp", width: 84, height: 84 },
  { file: "InstituteManagement/novak.webp", width: 84, height: 84 },
];

const recompressTasks = [
  { file: "EducationalPrograms/PostgraduateStudies.webp" },
  { file: "EducationalPrograms/Magistracy.webp" },
];

for (const t of resizeTasks) {
  const fp = join(base, t.file);
  const input = readFileSync(fp);
  const meta = await sharp(input).metadata();
  console.log(`Resizing ${t.file} from ${meta.width}x${meta.height} to ${t.width}x${t.height}`);
  const buf = await sharp(input).resize(t.width, t.height, { fit: "cover" }).webp({ quality: 85 }).toBuffer();
  writeFileSync(fp, buf);
  console.log(`  -> ${(buf.length / 1024).toFixed(1)} KiB`);
}

for (const t of recompressTasks) {
  const fp = join(base, t.file);
  const input = readFileSync(fp);
  const meta = await sharp(input).metadata();
  console.log(`Recompressing ${t.file} (${meta.width}x${meta.height})`);
  const buf = await sharp(input).webp({ quality: 75 }).toBuffer();
  writeFileSync(fp, buf);
  console.log(`  -> ${(buf.length / 1024).toFixed(1)} KiB`);
}

console.log("Done!");
