import { promises as fs } from 'fs';
import * as path from 'path';
import os from 'os';
import { collectFiles } from '../src/index';

describe('collectFiles', () => {
    let tmpDir: string;

    beforeAll(async () => {
        // Create a temporary directory structure
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hc-'));
        // tmpDir/
        //   a.txt
        //   sub/
        //     b.js
        await fs.writeFile(path.join(tmpDir, 'a.txt'), 'hello');
        await fs.mkdir(path.join(tmpDir, 'sub'));
        await fs.writeFile(path.join(tmpDir, 'sub', 'b.js'), 'console.log("b");');
    });

    afterAll(async () => {
        // Remove the temporary directory and its contents
        await fs.rm(tmpDir, { recursive: true, force: true });
    });

    it('should find all files recursively', async () => {
        const files = await collectFiles(tmpDir);
        const rel = files
            .map(f => path.relative(tmpDir, f).replace(/\\/g, '/'))
            .sort();
        expect(rel).toEqual(['a.txt', 'sub/b.js']);
    });
});