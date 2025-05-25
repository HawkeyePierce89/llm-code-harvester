#!/usr/bin/env node

/**
 * llm-code-harvester
 *
 * CLI tool to harvest code snippets from a specified directory,
 * prefix each file with its relative path, and output a combined stream
 * ready for LLM ingestion.
 *
 * Supports Node.js 16+.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

/**
 * Recursively collects all file paths under `dir`.
 *
 * @param dir - Absolute path to directory
 * @returns Array of absolute file paths
 */
async function collectFiles(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            // Recurse into subdirectory
            files.push(...await collectFiles(fullPath));
        } else if (entry.isFile()) {
            files.push(fullPath);
        }
    }

    return files;
}

/**
 * Attempts to copy `data` to clipboard using native OS utilities.
 * Falls back to writing to stdout if no clipboard command is found.
 *
 * @param data - String content to copy
 */
function copyToClipboard(data: string) {
    const platform = process.platform;

    // Determine clipboard command based on platform
    let proc;
    if (platform === 'darwin') {
        // macOS: pbcopy
        proc = spawn('pbcopy');
    } else if (platform === 'win32') {
        // Windows: clip
        proc = spawn('clip');
    } else {
        // Linux/other: try xclip, xsel, or fallback
        // You may need to install xclip or xsel on your system.
        try {
            proc = spawn('xclip', ['-selection', 'clipboard']);
        } catch {
            try {
                proc = spawn('xsel', ['--clipboard', '--input']);
            } catch {
                console.warn(
                    '⚠️  No native clipboard utility found (xclip/xsel). Output will be written to stdout.'
                );
                process.stdout.write(data);
                return;
            }
        }
    }

    // Pipe data into the clipboard utility
    if (proc.stdin) {
        proc.stdin.write(data);
        proc.stdin.end();
        proc.on('close', () => {
            console.log('✅ Content copied to clipboard.');
        });
    } else {
        // If for any reason stdin is unavailable, fallback
        process.stdout.write(data);
    }
}

/**
 * Main entry point: parses arguments, gathers files, builds output, and copies it.
 */
async function main() {
    const [target] = process.argv.slice(2);
    if (!target) {
        console.error('Usage: snippet-collector <path-to-directory>');
        process.exit(1);
    }

    const rootDir = process.cwd();
    const fullPath = path.resolve(rootDir, target);

    // Validate that the target exists and is a directory
    let stat;
    try {
        stat = await fs.stat(fullPath);
    } catch {
        console.error(`Error: Path not found: ${target}`);
        process.exit(1);
    }
    if (!stat.isDirectory()) {
        console.error(`Error: Not a directory: ${target}`);
        process.exit(1);
    }

    // Collect all files and build output chunks
    const files = await collectFiles(fullPath);
    const chunks: string[] = [];

    for (const file of files) {
        // Build path relative to project root, with POSIX separators
        const relPath = path.relative(rootDir, file).split(path.sep).join('/');
        const content = await fs.readFile(file, 'utf8');

        // Add header comment and file content
        chunks.push(`// ${relPath}`, '', content, '');
    }

    const output = chunks.join('\n');

    // Attempt to copy to clipboard; fallback prints to stdout
    copyToClipboard(output);
}

main().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
});

export { collectFiles };
