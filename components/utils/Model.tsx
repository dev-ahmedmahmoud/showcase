"use client";

import { useMemo } from "react";
import type { Object3D } from "three";
import type { ThreeElements } from "@react-three/fiber";

type ModelProps = Omit<ThreeElements["primitive"], "object"> & {
  object: Object3D;
};

// Clones a loaded GLTF scene once per mount. An inline `scene.clone()` creates a new
// object on every render, which makes R3F remove and re-add the whole model each time.
export default function Model({ object, ...props }: ModelProps) {
  const clone = useMemo(() => object.clone(), [object]);
  return <primitive object={clone} {...props} />;
}
