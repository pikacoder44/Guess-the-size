import path from "node:path";
import { normalizeSvgFile } from "./normalizeSvg";

const RAW_SILHOUETTES: Record<string, string> = {
  "burj_khalifa.svg": `<svg viewBox="0 0 200 828" xmlns="http://www.w3.org/2000/svg">
  <path d="M 98 0 L 102 0 L 102 120 L 106 120 L 106 200 L 110 200 L 110 300 L 115 300 L 115 420 L 122 420 L 122 550 L 132 550 L 132 700 L 145 700 L 145 828 L 55 828 L 55 700 L 68 700 L 68 550 L 78 550 L 78 420 L 85 420 L 85 300 L 90 300 L 90 200 L 94 200 L 94 120 L 98 120 Z" />
</svg>`,

  "eiffel_tower.svg": `<svg viewBox="0 0 200 330" xmlns="http://www.w3.org/2000/svg">
  <path d="M 98 0 L 102 0 L 102 30 L 105 30 L 105 60 L 108 60 L 114 160 L 125 160 L 125 175 L 115 175 L 122 250 L 138 250 L 138 270 L 124 270 L 145 330 L 125 330 L 112 285 Q 100 240 88 285 L 75 330 L 55 330 L 76 270 L 62 270 L 62 250 L 78 250 L 85 175 L 75 175 L 75 160 L 86 160 L 92 60 L 95 60 L 95 30 L 98 30 Z" />
</svg>`,

  "moon.svg": `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M 50 0 A 50 50 0 1 1 49.99 0 Z" />
</svg>`,

  "saturn_v.svg": `<svg viewBox="0 0 200 450" xmlns="http://www.w3.org/2000/svg">
  <path d="M 99 0 L 101 0 L 101 25 L 98 40 L 98 48 L 94 65 L 94 150 L 91 165 L 91 380 L 80 400 L 80 435 L 88 435 L 91 415 L 109 415 L 112 435 L 120 435 L 120 400 L 109 380 L 109 165 L 106 150 L 106 65 L 102 48 L 102 40 L 99 25 Z" />
</svg>`,

  "blue_whale.svg": `<svg viewBox="0 0 300 110" xmlns="http://www.w3.org/2000/svg">
  <path d="M 0 55 Q 15 20 60 15 Q 140 10 220 22 Q 250 27 265 38 L 275 22 Q 279 38 278 48 Q 284 52 300 42 L 296 55 L 300 68 Q 284 58 278 62 Q 279 72 275 88 L 265 72 Q 230 76 185 82 Q 130 90 95 90 Q 50 90 25 78 Q 12 70 0 55 Z M 110 75 Q 135 110 145 108 Q 148 102 135 78 Z" />
</svg>`,

  "human.svg": `<svg viewBox="0 0 100 175" xmlns="http://www.w3.org/2000/svg">
  <path d="M 45 12 A 12 12 0 1 1 55 12 A 12 12 0 0 1 45 12 Z M 35 32 L 65 32 Q 72 32 72 40 L 70 85 Q 70 90 64 90 Q 58 90 58 84 L 60 52 L 56 52 L 55 105 L 56 175 L 48 175 L 47 115 L 45 115 L 44 175 L 36 175 L 37 105 L 36 52 L 32 52 L 34 84 Q 34 90 28 90 Q 22 90 22 85 L 20 40 Q 20 32 27 32 Z" />
</svg>`,

  "dog.svg": `<svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
  <path d="M 20 30 L 70 30 L 78 18 L 76 8 L 84 4 L 90 10 L 98 14 L 96 20 L 86 22 L 82 34 L 80 78 L 74 78 L 72 48 L 34 48 L 32 78 L 26 78 L 24 48 Q 18 44 18 36 L 6 22 L 10 20 Z" />
</svg>`,

  "car_sedan.svg": `<svg viewBox="0 0 200 65" xmlns="http://www.w3.org/2000/svg">
  <path d="M 8 44 L 8 34 Q 10 28 22 26 L 52 22 L 76 6 Q 82 2 92 2 L 134 2 Q 144 2 152 10 L 170 24 Q 192 27 196 34 L 196 46 Q 196 50 190 50 L 168 50 A 16 16 0 0 0 136 50 L 64 50 A 16 16 0 0 0 32 50 L 12 50 Q 8 50 8 44 Z" />
  <circle cx="48" cy="50" r="14" />
  <circle cx="152" cy="50" r="14" />
</svg>`,
};

export async function generateAndNormalizeSilhouettes(targetDir: string) {
  for (const [filename, rawContent] of Object.entries(RAW_SILHOUETTES)) {
    const filePath = path.join(targetDir, filename);
    const tempPath = filePath + ".tmp";
    const fs = await import("node:fs/promises");
    await fs.writeFile(tempPath, rawContent, "utf-8");
    const result = await normalizeSvgFile(tempPath, filePath);
    await fs.unlink(tempPath);
    console.log(`[normalizeSvg] Processed ${filename} -> viewBox: "${result.viewBox}"`);
  }
}

if (process.argv[1]?.endsWith("generateSilhouettes.ts")) {
  const targetDir = path.resolve(process.cwd(), "public/silhouettes");
  generateAndNormalizeSilhouettes(targetDir).catch((err) => {
    console.error("Failed to generate silhouettes:", err);
    process.exit(1);
  });
}
