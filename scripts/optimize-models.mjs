// Optimizes GLB models for the web without visible quality loss.
//
// usage: npm run optimize-models -- <file.glb | dir> [outDir=public/models]
//
// Per file:
// - textures larger than 2048 px are downscaled; colour textures become WebP q90, data maps
//   (normal / roughness / occlusion …) lossless WebP
// - geometry is simplified only where the change stays below 0.01 % of the mesh size, with normals,
//   UVs, tangents and vertex colours counted in the error, so shading and texture mapping stay put
// - geometry is meshopt-compressed (decoded by drei's useGLTF without any code change)
//
// Already-optimized files (meshopt-compressed) and skinned models are skipped: re-encoding would
// re-compress the WebP textures, and skinned meshes are not simplified.
import { Logger, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTTextureWebP } from "@gltf-transform/extensions";
import {
  dedup,
  prune,
  meshopt,
  weld,
  compactPrimitive,
  getTextureColorSpace,
} from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const MAX_TEXTURE_SIZE = 2048;
const SIMPLIFY_ERROR = 1e-4; // relative to mesh extent
const ATTRIBUTE_WEIGHT = 1;

const [input, outDir = "public/models"] = process.argv.slice(2);
if (!input) {
  console.error("usage: npm run optimize-models -- <file.glb | dir> [outDir]");
  process.exit(1);
}

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().setLogger(new Logger(Logger.Verbosity.WARN)).registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "meshopt.encoder": MeshoptEncoder,
  "meshopt.decoder": MeshoptDecoder,
});

async function compressTextures(doc) {
  for (const texture of doc.getRoot().listTextures()) {
    const image = texture.getImage();
    const size = texture.getSize();
    if (!image || !size) continue;

    const needsResize = Math.max(...size) > MAX_TEXTURE_SIZE;
    let img = sharp(Buffer.from(image));
    if (needsResize) {
      const k = MAX_TEXTURE_SIZE / Math.max(...size);
      img = img.resize(Math.round(size[0] * k), Math.round(size[1] * k), { fit: "fill", kernel: "lanczos3" });
    }
    const isColor = getTextureColorSpace(texture) === "srgb";
    const webp = isColor
      ? await img.webp({ quality: 90, effort: 6 }).toBuffer()
      : await img.webp({ lossless: true, effort: 6 }).toBuffer();

    if (!needsResize && webp.byteLength >= image.byteLength) continue; // original is already smaller
    texture.setImage(new Uint8Array(webp)).setMimeType("image/webp");
    if (texture.getURI()) texture.setURI(texture.getURI().replace(/\.(png|jpe?g)$/i, ".webp"));
  }
  if (doc.getRoot().listTextures().some((t) => t.getMimeType() === "image/webp")) {
    doc.createExtension(EXTTextureWebP).setRequired(true);
  }
}

// gltf-transform's own simplify() only bounds position error, which visibly shifted shading on
// fabric meshes; simplifyWithAttributes also bounds normal / UV / tangent / colour error.
function simplifyWithAttributes() {
  return async (doc) => {
    await doc.transform(weld({ overwrite: false })); // merges bitwise-identical vertices only
    for (const mesh of doc.getRoot().listMeshes()) {
      for (const prim of mesh.listPrimitives()) {
        if (prim.getMode() !== 4 || !prim.getIndices() || prim.listTargets().length) continue;

        const position = prim.getAttribute("POSITION");
        const count = position.getCount();
        const attributes = [["NORMAL", 3], ["TANGENT", 3], ["COLOR_0", 3]];
        for (const semantic of prim.listSemantics()) {
          if (semantic.startsWith("TEXCOORD_")) attributes.push([semantic, 2]);
        }
        const used = attributes.filter(([semantic]) => prim.getAttribute(semantic));
        const stride = used.reduce((sum, [, size]) => sum + size, 0);

        const positions = new Float32Array(count * 3);
        const values = new Float32Array(count * stride);
        const element = [];
        for (let i = 0; i < count; i++) {
          position.getElement(i, element);
          positions.set(element.slice(0, 3), i * 3);
          let offset = i * stride;
          for (const [semantic, size] of used) {
            prim.getAttribute(semantic).getElement(i, element);
            for (let c = 0; c < size; c++) values[offset + c] = element[c];
            offset += size;
          }
        }

        const indices = prim.getIndices();
        const src = new Uint32Array(indices.getArray());
        const [dst] = MeshoptSimplifier.simplifyWithAttributes(
          src, positions, 3, values, stride, new Array(stride).fill(ATTRIBUTE_WEIGHT),
          null, 0, SIMPLIFY_ERROR, []
        );
        if (dst.length === src.length) continue;

        prim.setIndices(doc.createAccessor().setType("SCALAR").setArray(dst).setBuffer(indices.getBuffer()));
        if (!indices.listParents().some((p) => p !== doc.getRoot())) indices.dispose();
        compactPrimitive(prim);
        if (prim.getAttribute("POSITION").getCount() <= 65535) {
          prim.getIndices().setArray(new Uint16Array(prim.getIndices().getArray()));
        }
      }
    }
  };
}

const files = fs.statSync(input).isDirectory()
  ? fs.readdirSync(input).filter((f) => f.endsWith(".glb")).sort().map((f) => path.join(input, f))
  : [input];
fs.mkdirSync(outDir, { recursive: true });

for (const src of files) {
  const dst = path.join(outDir, path.basename(src));
  const doc = await io.read(src);
  const extensions = doc.getRoot().listExtensionsUsed().map((e) => e.extensionName);
  if (extensions.includes("EXT_meshopt_compression") || doc.getRoot().listSkins().length) {
    console.log(`${path.basename(src)}: skipped (already optimized or skinned)`);
    if (path.resolve(src) !== path.resolve(dst)) fs.copyFileSync(src, dst);
    continue;
  }

  const before = fs.statSync(src).size;
  await compressTextures(doc);
  await doc.transform(
    dedup(),
    simplifyWithAttributes(),
    prune({ keepLeaves: true, keepAttributes: true, keepIndices: true, keepSolidTextures: true, keepExtras: true }),
    meshopt({ encoder: MeshoptEncoder, level: "medium" })
  );
  await io.write(dst, doc);
  console.log(`${path.basename(src)}: ${(before / 1e6).toFixed(2)} → ${(fs.statSync(dst).size / 1e6).toFixed(2)} MB`);
}
