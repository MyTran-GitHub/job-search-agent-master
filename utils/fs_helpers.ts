import fs from "node:fs/promises";
import path from "node:path";
import { logger } from "./logger.js";

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export async function writeJsonFile(
  filePath: string,
  data: unknown
): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export async function readTextFile(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

export async function writeTextFile(
  filePath: string,
  content: string
): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf-8");
}

export async function listJsonFiles(dirPath: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath);
    return entries.filter((f) => f.endsWith(".json")).map((f) => path.join(dirPath, f));
  } catch {
    return [];
  }
}

export async function clearDirectory(dirPath: string): Promise<void> {
  try {
    const entries = await fs.readdir(dirPath);
    await Promise.all(
      entries.map((entry) =>
        fs.rm(path.join(dirPath, entry), { recursive: true, force: true })
      )
    );
    logger.info(`Cleared directory: ${dirPath}`);
  } catch {
    await ensureDir(dirPath);
  }
}

export function parseYamlFrontmatter(content: string): Record<string, unknown> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const result: Record<string, unknown> = {};
  const lines = match[1].split("\n");
  let currentKey = "";
  let currentArray: string[] | null = null;

  for (const line of lines) {
    const arrayMatch = line.match(/^\s+-\s+(.+)$/);
    if (arrayMatch && currentArray) {
      currentArray.push(arrayMatch[1].trim());
      continue;
    }

    const kvMatch = line.match(/^(\w+):\s*(.*)$/);
    if (kvMatch) {
      if (currentKey && currentArray) {
        result[currentKey] = currentArray;
      }
      currentKey = kvMatch[1];
      const value = kvMatch[2].trim();
      if (value === "") {
        currentArray = [];
      } else if (value === "true") {
        result[currentKey] = true;
        currentArray = null;
      } else if (value === "false") {
        result[currentKey] = false;
        currentArray = null;
      } else {
        result[currentKey] = value.replace(/^["']|["']$/g, "");
        currentArray = null;
      }
    }
  }

  if (currentKey && currentArray) {
    result[currentKey] = currentArray;
  }

  return result;
}
