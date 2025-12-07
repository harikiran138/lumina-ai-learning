'use server';

import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

interface LocalAIResponse {
    success: boolean;
    data?: any;
    error?: string;
}

/**
 * Uploads a file and processes it via local Python + Ollama script.
 */
export async function processFileWithLocalAI(formData: FormData): Promise<LocalAIResponse> {
    const file = formData.get('file') as File;
    if (!file) {
        return { success: false, error: 'No file provided' };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to temp directory
    const tempFileName = `${uuidv4()}-${file.name}`;
    const tempFilePath = join(tmpdir(), tempFileName);

    try {
        await writeFile(tempFilePath, buffer);
        console.log(`File saved to ${tempFilePath}, starting Python processing...`);

        // Spawn Python process
        // Ensure "python3" matches the environment (or "python" on Windows)
        // We assume the script is at project root/scripts/process_course.py
        const scriptPath = join(process.cwd(), 'scripts', 'process_course.py');

        const pythonProcess = spawn('python3', [scriptPath, tempFilePath]);

        let stdoutData = '';
        let stderrData = '';

        return new Promise<{ success: boolean; data?: any; error?: string }>((resolve) => {
            pythonProcess.stdout.on('data', (data) => {
                stdoutData += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                stderrData += data.toString();
                // Log stderr but don't fail immediately, some libs print warnings
                console.error(`[Python API]: ${data}`);
            });

            pythonProcess.on('close', async (code) => {
                // Cleanup temp file
                await unlink(tempFilePath).catch(console.error);

                if (code !== 0) {
                    console.error(`Python script exited with code ${code}`);
                    resolve({ success: false, error: `Processing failed: ${stderrData}` });
                    return;
                }

                try {
                    // Try to parse the last line or full output as JSON
                    // The script is designed to print a JSON object at the end
                    const result = JSON.parse(stdoutData.trim());

                    if (result.error) {
                        resolve({ success: false, error: result.error });
                    } else if (result.success && result.data) {
                        resolve({ success: true, data: result.data });
                    } else {
                        // Direct JSON output fallback
                        resolve({ success: true, data: result });
                    }
                } catch (e: any) {
                    console.error('Failed to parse Python output:', stdoutData);
                    resolve({ success: false, error: 'Invalid response from AI engine' });
                }
            });
        });

    } catch (error: any) {
        console.error('Upload/Process Error:', error);
        return { success: false, error: error.message };
    }
}
