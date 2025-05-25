import { promises as fs } from 'fs';
import * as path from 'path';
import os from 'os';
import { execSync } from 'child_process';

describe('CLI integration', () => {
    let tmpDir: string;

    beforeAll(async () => {
        // Prepare a temporary directory with one file
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hc-'));
        await fs.writeFile(path.join(tmpDir, 'foo.txt'), 'FOO');
    });

    afterAll(async () => {
        // Clean up the temporary directory
        await fs.rm(tmpDir, { recursive: true, force: true });
    });

    it('should output header and content to stdout when clipboard is unavailable', () => {
        // Run the compiled CLI directly; on CI, no pbcopy/xclip => goes to stdout
        const cmd = `node ${path.resolve(__dirname, '../dist/index.js')} ${tmpDir}`;
        const out = execSync(cmd, { encoding: 'utf8' });
        const relPath = path
            .relative(process.cwd(), path.join(tmpDir, 'foo.txt'))
            .replace(/\\/g, '/');

        // Check that header comment and file contents appear
        expect(out).toContain(`// ${relPath}`);
        expect(out).toContain('FOO');
    });
});