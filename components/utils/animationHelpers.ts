import type { AnimationAction, AnimationMixer } from 'three';

export type AvatarState = 'idle' | 'walking' | 'arrive' | 'pointing';

export class AnimationStateMachine {
  private currentState: AvatarState = 'idle';
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
      idle: 'idle',
      walking: 'walk',
      arrive: 'idle',
      pointing: 'pointing',
    };

    return this.actions.get(stateToAnimation[state]);
  }
}
