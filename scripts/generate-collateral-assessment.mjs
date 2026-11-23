import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { createCollateralDemo } = await server.ssrLoadModule('/src/demo/collateral-assessment.ts');
  const { json, markdown } = createCollateralDemo();
  const output = resolve('examples');
  await mkdir(output, { recursive: true });
  await writeFile(resolve(output, 'collateral-committee-assessment.json'), `${JSON.stringify(json, null, 2)}\n`);
  await writeFile(resolve(output, 'collateral-committee-assessment.md'), markdown);
} finally {
  await server.close();
}
