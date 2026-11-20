import { readdir, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ignored = new Set(['.git', 'node_modules', 'dist', '.vercel']);
const markdown = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) markdown.push(full);
  }
}

await walk(root);
const errors = [];
for (const file of markdown) {
  const content = await readFile(file, 'utf8');
  for (const match of content.matchAll(/\]\(([^)]+)\)/g)) {
    const target = match[1].split('#')[0].trim();
    if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('//')) continue;
    const resolved = path.resolve(path.dirname(file), decodeURIComponent(target));
    try { await access(resolved); }
    catch { errors.push(`${path.relative(root, file)}: missing ${target}`); }
  }
}
if (errors.length) {
  process.stderr.write(`${errors.join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Checked internal Markdown links in ${markdown.length} files.\n`);
}
