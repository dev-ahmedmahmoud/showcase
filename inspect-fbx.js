const { FBXLoader } = require("three/examples/jsm/loaders/FBXLoader.js");
const fs = require("fs");

function saveSummary(data) {
  fs.writeFileSync(
    "fbx-summary.json",
    JSON.stringify(data, null, 2),
    "utf-8"
  );
}

const loader = new FBXLoader();
loader.load(
  "public/models/character/mesh.fbx",
  (fbx) => {
    const summary = {
      animations: fbx.animations.map((anim, index) => ({
        index,
        name: anim.name,
        durationSeconds: Number(anim.duration.toFixed(2)),
      })),
      hasSkeleton: Boolean(fbx.skeleton),
      childCount: fbx.children.length,
    };
    saveSummary(summary);
  },
  undefined,
  (error) => {
    saveSummary({ error: error.message });
  }
);
