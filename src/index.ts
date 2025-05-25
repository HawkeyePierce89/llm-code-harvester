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
 * Attempts to copy `data` to the clipboard using native OS utilities.
 * If the utility is not found or errors, falls back to stdout.
 */
function copyToClipboard(data: string) {
    const platform = process.platform;
    let proc: import('child_process').ChildProcessWithoutNullStreams;

    // pick the appropriate command for the platform
    if (platform === 'darwin') {
        proc = spawn('pbcopy');
    } else if (platform === 'win32') {
        proc = spawn('clip');
    } else {
        proc = spawn('xclip', ['-selection', 'clipboard']);
    }

    // handle errors (e.g. command not found) by writing directly
    proc.on('error', () => {
        process.stdout.write(data);
    });

    // if spawn succeeded, pipe data
    if (proc.stdin) {
        proc.stdin.write(data);
        proc.stdin.end();
        proc.on('close', () => {
            console.log('✅ Content copied to clipboard.');
        });
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
