import { execFileSync } from "child_process";
import ffmpegPath from "ffmpeg-static";
import { readdirSync } from "fs";
import { join } from "path";

const dir = join(process.cwd(), "public", "images", "Labs", "robo");
const movFiles = readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".mov"));

for (const file of movFiles) {
  const input = join(dir, file);
  const output = join(dir, file.replace(/\.MOV$/i, ".mp4"));
  console.log(`Converting ${file} -> ${file.replace(/\.MOV$/i, ".mp4")}`);
  execFileSync(ffmpegPath, [
    "-i", input,
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "23",
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    "-y",
    output,
  ], { stdio: "inherit" });
}

console.log("Done! All .MOV files converted to .mp4");
