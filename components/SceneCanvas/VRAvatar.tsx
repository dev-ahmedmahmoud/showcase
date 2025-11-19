"use client";

import { useRef, useMemo } from "react";
import { useFBX } from "@react-three/drei";
import { useXR, XRInputSourceState } from "@react-three/xr";
import { Group, Matrix4 } from "three";
import { useFrame } from "@react-three/fiber";

// VRAvatar: Renders animated hands (from FBX) attached to VR controllers, and also supports hand tracking
export default function VRAvatar() {
  // Load the rigged hands model (FBX)
  const handModel = useFBX("/models/hands.fbx");
  // Map of handedness to group refs for controllers and hands
  const controllerRefs = useMemo(() => ({ left: useRef<Group>(null), right: useRef<Group>(null) }), []);
  const handRefs = useMemo(() => ({ left: useRef<Group>(null), right: useRef<Group>(null) }), []);

  // Get input source states, session, and referenceSpace from XR
  const { inputSourceStates, session, originReferenceSpace } = useXR();

  // Helper to attach hand mesh to controller/hand object
  const renderHandModel = (side: "left" | "right") => {
    const hand = handModel.clone();
    if (side === "left") {
      hand.scale.set(1, 1, 1);
    } else {
      hand.scale.set(-1, 1, 1);
    }
    return hand;
  };

  // Update group transforms from XR pose each frame
  useFrame((_, __, xrFrame) => {
    if (!xrFrame || !session || !originReferenceSpace) return;
    // Controllers
    inputSourceStates
      .filter((state) => state.type === "controller")
      .forEach((ctrl) => {
        const handedness = ctrl.inputSource.handedness as "left" | "right";
        const ref = controllerRefs[handedness];
        if (ref?.current && ctrl.inputSource.gripSpace) {
          const pose = xrFrame.getPose(ctrl.inputSource.gripSpace, originReferenceSpace);
          if (pose) {
            ref.current.matrix.fromArray(pose.transform.matrix);
            ref.current.matrix.decompose(ref.current.position, ref.current.quaternion, ref.current.scale);
          }
        }
      });
    // Hands
    inputSourceStates
      .filter((state) => state.type === "hand")
      .forEach((hand) => {
        const handedness = hand.inputSource.handedness as "left" | "right";
        const ref = handRefs[handedness];
        if (ref?.current && hand.inputSource.targetRaySpace) {
          const pose = xrFrame.getPose(hand.inputSource.targetRaySpace, originReferenceSpace);
          if (pose) {
            ref.current.matrix.fromArray(pose.transform.matrix);
            ref.current.matrix.decompose(ref.current.position, ref.current.quaternion, ref.current.scale);
          }
        }
      });
  });

  // Render hand models as children of groups that are updated each frame
  return (
    <>
      {/* Controllers */}
      {(["left", "right"] as const).map((side) => (
        <group ref={controllerRefs[side]} key={side} matrixAutoUpdate={false}>
          <primitive object={renderHandModel(side)} />
        </group>
      ))}
      {/* Hands (hand-tracking) */}
      {(["left", "right"] as const).map((side) => (
        <group ref={handRefs[side]} key={side + "-hand"} matrixAutoUpdate={false}>
          <primitive object={renderHandModel(side)} />
        </group>
      ))}
    </>
  );
}

// Preload the hand model
useFBX.preload("/models/hands.fbx");
