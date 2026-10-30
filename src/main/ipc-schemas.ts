// src/main/ipc-schemas.ts
// Zod schemas for IPC input validation + path traversal protection

import { z } from 'zod'
import { resolve, normalize, sep } from 'path'

// ─── Path validation helpers ───

/**
 * Validates a file path to prevent path traversal attacks.
 * Rejects paths containing '..' segments or null bytes.
 */
export function validateFilePath(filePath: string): string {
  if (typeof filePath !== 'string' || filePath.length === 0) {
    throw new Error('Invalid file path: empty or non-string')
  }
  if (filePath.includes('\0')) {
    throw new Error('Invalid file path: contains null byte')
  }
  const normalized = normalize(filePath)
  // Block parent directory traversal in relative paths
  if (normalized.includes('..')) {
    throw new Error(`Invalid file path: path traversal detected (${filePath})`)
  }
  return normalized
}

/**
 * Validates a directory path to prevent path traversal attacks.
 */
export function validateDirPath(dirPath: string): string {
  const validated = validateFilePath(dirPath)
  return resolve(validated)
}

// ─── IPC Schemas ───

export const readFileSchema = z.object({
  filePath: z.string().min(1).max(4096),
})

export const readCfDirectorySchema = z.object({
  dirPath: z.string().min(1).max(4096),
})

export const saveFileSchema = z.object({
  filePath: z.string().min(1).max(4096),
  content: z.string(),
})

export const saveDialogSchema = z.object({
  defaultName: z.string().min(1).max(255).optional().default('untitled'),
})

export const openFilesSchema = z.object({
  filters: z.array(
    z.object({
      name: z.string(),
      extensions: z.array(z.string()),
    })
  ).optional(),
})

export const iqtreeRunSchema = z.object({
  iqtreeCommand: z.string().min(1).max(255),
  speciesTree: z.string().min(1).max(4096),
  modelFile: z.string().min(1).max(4096),
  geneTrees: z.string().min(1).max(4096),
  outputDir: z.string().min(1).max(4096),
  scflQuartets: z.number().int().min(1).max(100000),
  threads: z.string().min(1).max(20).optional().default('AUTO'),
  iqtreeVersion: z.enum(['2', '3']).optional().default('2'),
})

export const exportVectorsSchema = z.object({
  vectors: z.array(z.record(z.string(), z.unknown())),
})

// ─── Helper: validate IPC arguments ───

/**
 * Wraps an IPC handler with Zod schema validation.
 * Usage:
 *   ipcMain.handle('channel', validateArgs(schema, async (e, data) => { ... }))
 */
export function validateArgs<T>(
  schema: z.ZodType<T>,
  handler: (event: Electron.IpcMainInvokeEvent, data: T) => Promise<any> | any
) {
  return async (event: Electron.IpcMainInvokeEvent, ...args: any[]) => {
    // For single-argument schemas, pass the first argument
    const input = args.length === 1 ? args[0] : args
    const parsed = schema.safeParse(input)
    if (!parsed.success) {
      const errorMessages = parsed.error.issues
        .map(i => `${i.path.join('.')}: ${i.message}`)
        .join('; ')
      throw new Error(`IPC validation error: ${errorMessages}`)
    }
    return handler(event, parsed.data)
  }
}
