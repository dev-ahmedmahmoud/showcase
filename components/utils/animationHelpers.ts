import {
  Euler,
  Quaternion,
  type AnimationAction,
  type AnimationMixer,
  type Camera,
  Vector3,
} from "three";
import gsap from "gsap";
import { HotspotId } from "./SceneContext";
import { isEmulatedMobile, isMobile } from "./helperFunc";

enum DeviceType {
  Mobile = "mobile",
  NoneMobile = "noneMobile",
}

export const DEFAULT_CAMERA_LOOK_AT_FOR_MOBILE_DEVICES = new Vector3(
  -1.85,
  0,
  -4.25
);

const CAMERA_DEFAULT_POSITION_X = 7.080344659541124;
const CAMERA_DEFAULT_POSITION_Y = 2.3193437876556016;
const CAMERA_DEFAULT_POSITION_Z = -4.342386631550139;
const CAMERA_DEFAULT_ROTATION_X = -1.530379167201849;
const CAMERA_DEFAULT_ROTATION_Y = 1.3707991258152388;
const CAMERA_DEFAULT_ROTATION_Z = 1.5295580746151831;

// Camera default position
const CAMERA_POSITIONS = {
  position: {
    noneMobile: new Vector3(
      CAMERA_DEFAULT_POSITION_X,
      CAMERA_DEFAULT_POSITION_Y,
      CAMERA_DEFAULT_POSITION_Z
    ),
    mobile: new Vector3(
      CAMERA_DEFAULT_POSITION_X,
      CAMERA_DEFAULT_POSITION_Y,
      CAMERA_DEFAULT_POSITION_Z
    ),
  },
  rotation: new Vector3(
    CAMERA_DEFAULT_ROTATION_X,
    CAMERA_DEFAULT_ROTATION_Y,
    CAMERA_DEFAULT_ROTATION_Z
  ),
};

// Camera positions for each hotspot (centered and zoomed on target)
const HOTSPOT_POSITINOS: Record<
  HotspotId,
  { position: Record<DeviceType, Vector3>; rotation?: Vector3 }
> = {
  pc: {
    position: {
      noneMobile: new Vector3(-1.2, 2.6, -6.6),
      mobile: new Vector3(2, 2.6, -6.6),
    },
    rotation: new Vector3(0, Math.PI / 2, 0),
  },
  ps5: {
    position: {
      noneMobile: new Vector3(1.9, 1.6, -2.0),
      mobile: new Vector3(1.9, 1.6, -3.0),
    },
    rotation: new Vector3(0, Math.PI, 0),
  },
  phone: {
    position: {
      noneMobile: new Vector3(2.5, 1.7, -1.0),
      mobile: new Vector3(2.0, 1.7, -1.0),
    },
    rotation: new Vector3(-Math.PI / 4, 0, 0),
  },
  portrait: {
    position: {
      noneMobile: new Vector3(1.4, 2.2, -7.0),
      mobile: new Vector3(1.4, 2.2, -5.0),
    },
    rotation: new Vector3(0, 0, 0),
  },
};

export type AvatarState = "idle" | "walking" | "arrive" | "pointing";

export class AnimationStateMachine {
  private currentState: AvatarState = "idle";
  private actions: Map<string, AnimationAction> = new Map();
  private mixer: AnimationMixer;

  constructor(mixer: AnimationMixer) {
    this.mixer = mixer;
  }

  registerAction(name: string, action: AnimationAction) {
    this.actions.set(name, action);
  }

  setState(newState: AvatarState, fadeTime: number = 0.3) {
    const currentAction = this.getActionForState(this.currentState);
    const newAction = this.getActionForState(newState);

    if (currentAction && newAction && currentAction !== newAction) {
      currentAction.fadeOut(fadeTime);
      newAction.reset().fadeIn(fadeTime).play();
    } else if (newAction) {
      newAction.play();
    }

    this.currentState = newState;
  }

  getCurrentState(): AvatarState {
    return this.currentState;
  }

  update(deltaTime: number) {
    this.mixer.update(deltaTime);
  }

  private getActionForState(state: AvatarState): AnimationAction | undefined {
    // Map state to animation names (customizable based on loaded animations)
    const stateToAnimation: Record<AvatarState, string> = {
      idle: "idle",
      walking: "walk",
      arrive: "idle",
      pointing: "pointing",
    };

    return this.actions.get(stateToAnimation[state]);
  }
}

export const animateCamera = (
  camera: Camera,
  targetId?: HotspotId,
  onComplete?: () => void
) => {
  const target = targetId ? HOTSPOT_POSITINOS[targetId] : CAMERA_POSITIONS;
  // Animate position and rotation together using GSAP timeline
  const tl = gsap.timeline();

  const mobileOrNot =
    isMobile() || isEmulatedMobile()
      ? DeviceType.Mobile
      : DeviceType.NoneMobile;

  tl.to(
    camera.position,
    {
      x: target.position[mobileOrNot].x,
      y: target.position[mobileOrNot].y,
      z: target.position[mobileOrNot].z,
      duration: 1.5,
      ease: "power2.inOut",
      onUpdate: () => {
        camera.updateMatrixWorld(); // make sure camera updates
      },
      onComplete: () => {
        onComplete?.();
      },
    },
    0
  ); // start at 0 seconds

  if (!target.rotation) return;

  // Current and target quaternions
  const startQuat = camera.quaternion.clone();
  const targetQuat = new Quaternion().setFromEuler(
    new Euler(target.rotation.x, target.rotation.y, target.rotation.z)
  );
  // Rotation animation using slerp
  tl.to(
    { t: 0 },
    {
      t: 1,
      duration: 1.5,
      ease: "power2.inOut",
      onUpdate: function () {
        camera.quaternion.slerpQuaternions(
          startQuat,
          targetQuat,
          this.targets()[0].t
        );
        camera.updateMatrixWorld();
      },
      onComplete: function () {
        onComplete?.();
      },
    },
    0
  ); // also start at 0 seconds (simultaneously)
};
