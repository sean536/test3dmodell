// Inspect the GLB JSON before decoding textures or uploading geometry to the GPU.
export function inspectGLB(buffer) {
  const view = new DataView(buffer);
  if (buffer.byteLength < 20 || view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2 || view.getUint32(8, true) !== buffer.byteLength) throw Error('Invalid GLB 2.0 header');
  const length = view.getUint32(12, true);
  if (view.getUint32(16, true) !== 0x4e4f534a || 20 + length > buffer.byteLength) throw Error('Missing GLB JSON chunk');
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 20, length)).trim());
  const report = { bytes: buffer.byteLength, meshDefinitions: json.meshes?.length ?? 0, meshInstances: 0, triangles: 0, materials: (json.materials ?? []).map((m, i) => ({ name: m.name ?? `Material ${i}`, metallicFactor: m.pbrMetallicRoughness?.metallicFactor ?? 1, roughnessFactor: m.pbrMetallicRoughness?.roughnessFactor ?? 1 })), textures: json.textures?.length ?? 0, images: (json.images ?? []).map(i => ({ mimeType: i.mimeType ?? 'external', embeddedBytes: json.bufferViews?.[i.bufferView]?.byteLength ?? null })), accessorBounds: (json.meshes ?? []).map(m => ({ name: m.name ?? null, primitives: m.primitives.map(p => ({ min: json.accessors?.[p.attributes.POSITION]?.min ?? null, max: json.accessors?.[p.attributes.POSITION]?.max ?? null })) })), requiredExtensions: json.extensionsRequired ?? [] };
  for (const node of json.nodes ?? []) {
    if (node.mesh === undefined) continue;
    const mesh = json.meshes?.[node.mesh];
    const attributes = node.extensions?.EXT_mesh_gpu_instancing?.attributes;
    const instances = attributes ? json.accessors[Object.values(attributes)[0]].count : 1;
    report.meshInstances += (mesh?.primitives.length ?? 0) * instances;
    for (const p of mesh?.primitives ?? []) {
      const count = json.accessors?.[p.indices ?? p.attributes.POSITION]?.count ?? 0;
      const mode = p.mode ?? 4;
      report.triangles += (mode === 4 ? count / 3 : mode === 5 || mode === 6 ? Math.max(0, count - 2) : 0) * instances;
    }
  }
  return report;
}
