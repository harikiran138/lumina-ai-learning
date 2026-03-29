import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

type TextbookRecord = {
  id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: string;
  status: "raw";
};

const dataDir = path.join(process.cwd(), "data");
const textbookStorePath = path.join(dataDir, "textbooks.json");

async function readRecords(): Promise<TextbookRecord[]> {
  try {
    const raw = await readFile(textbookStorePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error: unknown) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function writeRecords(records: TextbookRecord[]): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  await writeFile(textbookStorePath, JSON.stringify(records, null, 2));
}

export async function saveTextbookRecord(input: {
  title: string;
  content: string;
  userId?: string;
}): Promise<TextbookRecord> {
  const records = await readRecords();
  const record: TextbookRecord = {
    id: randomUUID(),
    title: input.title,
    content: input.content,
    userId: input.userId || "anonymous",
    createdAt: new Date().toISOString(),
    status: "raw",
  };
  records.push(record);
  await writeRecords(records);
  return record;
}

export async function getTextbookRecord(
  textbookId: string,
): Promise<TextbookRecord | null> {
  const records = await readRecords();
  return records.find((record) => record.id === textbookId) ?? null;
}
