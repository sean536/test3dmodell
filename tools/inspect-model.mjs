import { readFile } from 'node:fs/promises';
import { inspectGLB } from '../src/model-inspection.js';
const path = process.argv[2];
if (!path) { console.error('Usage: node tools/inspect-model.mjs path/to/model.glb'); process.exit(1); }
const data = await readFile(path);
console.log(JSON.stringify(inspectGLB(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)), null, 2));
console.log('Accessor bounds are local-space. World bounds and texture dimensions are measured after loading (window.modelReport).');
