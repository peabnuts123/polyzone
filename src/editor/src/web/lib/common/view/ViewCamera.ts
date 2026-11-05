import { CameraNode } from '@lopoly/engine/scene';

import { Vector3 } from '@polyzone/core/math';
import { clamp, IInputSystem, Matrix4, NumberZeroToOne, PointerState } from '@lopoly/engine';

export interface ClaimedPointerCallbacks {
  onUpdate?: (pointer: PointerState) => void;
  onRelease?: (pointer: PointerState) => void;
}
// export type PointerUpdateFn = ;
export type OnClickPressFn = (pointer: PointerState) => ClaimedPointerCallbacks | undefined;
export type OnClickSelectFn = (pointer: PointerState) => void;

export class ViewCamera extends CameraNode {
  // Config
  private static readonly MoveSpeed: number = 5;
  private static readonly ButtonRotateSpeed = 150;
  private static readonly CursorRotateFactor = 0.1;
  /** Number of pixels the mouse can move and still be considered a "selection" click */
  private static readonly SelectionPixelMovementThreshold = 10;


  // References
  public onClickPress: OnClickPressFn | undefined;
  public onClickSelect: OnClickSelectFn | undefined;

  // State
  // @TODO Camera mode WASD vs orbit
  private readonly moveDelta = Vector3.zero();
  private pointerCallbacks: ClaimedPointerCallbacks | 'self' | undefined;
  /**
   * The total number of pixels moved since the start of a click.
   * Note that this is not a signed number, so a movement of 10 pixels
   * right and then 10 pixels left produces a total of 20 pixels moved.
   */
  private totalClickAbsoluteMovement: number = 0;

  // public constructor(scene: IScene, name: string, fov: number, ) {
  //   super(scene, name, fov);
  //   // this.scene.engine.inputSystem.lockPointer();
  // }

  /*
    @TODO
    - Intercept click through this thing, decide what the API is here
    - If gizmo (or other?) wants the click, assign control to the gizmo
    - Otherwise this camera gets the click
    - Camera look is handled by whomever owns the click
   */
  public override onUpdate(dt: number, time: number): void {
    // Claim pointer on click
    const pointer = this.input.getPointer();
    if (this.input.wasButtonPressed('mouse:click')) {
      if (this.onClickPress !== undefined) {
        this.pointerCallbacks = this.onClickPress(pointer);
      }

      // If nobody handled click - assign ownership to camera
      if (this.pointerCallbacks === undefined) {
        this.totalClickAbsoluteMovement = 0;
        this.pointerCallbacks = 'self';
      }
    }

    // Release pointer callback when button released
    if (this.input.wasButtonReleased('mouse:click')) {
      // Detect non-moving "selection" clicks
      // Only possible if the user didn't click on anything particular AND didn't move their mouse much
      if (this.pointerCallbacks === 'self') {
        if (this.totalClickAbsoluteMovement <= ViewCamera.SelectionPixelMovementThreshold) {
          this.onClickSelect?.(pointer);
        }
      } else if (this.pointerCallbacks !== undefined) {
        this.pointerCallbacks.onRelease?.(pointer);
      }

      this.pointerCallbacks = undefined;
    }

    // Invoke callback for whomever owns pointer click
    if (this.input.isButtonDown(`mouse:click`) && this.pointerCallbacks !== undefined) {
      if (this.pointerCallbacks === 'self') {
        // Callback owned by camera - use pointer to mouse look
        this.rotation.euler.z -= pointer.xDelta * ViewCamera.CursorRotateFactor;
        this.rotation.euler.x = clamp(this.rotation.euler.x - pointer.yDelta * ViewCamera.CursorRotateFactor, -89, 89);

        // Tally mouse movement (to detect "selection" clicks)
        this.totalClickAbsoluteMovement += Math.hypot(pointer.xDelta, pointer.yDelta);
      } else {
        // Callback owned elsewhere
        this.pointerCallbacks.onUpdate?.(pointer);
      }
    }

    /* Moving */
    this.moveDelta.setValue(
      this.input.getAxisValue('camera:move:x'),
      this.input.getAxisValue('camera:move:y'),
      this.input.getAxisValue('camera:move:z'),
    ).scaleSelf(ViewCamera.MoveSpeed);
    this.absolutePosition.addSelf(
      // Transform vector relative to the camera's orientation
      this.rotation.q.rotateVectorInPlace(this.moveDelta)
        .scaleSelf(dt),
    );

    super.onUpdate(dt, time);
  }

  private tmp_RayCastFromCameraDirection = Vector3.zero();
  private tmp_RayCastFromCameraInverseViewProjectionMatrix = new Matrix4();
  public rayCastFromCamera<T>(screenX: number, screenY: number, callbackFn: (rayOrigin: Vector3, rayDirection: Vector3) => T): T {
    /** Normalised X coordinate between 0 (inclusive) and 1 (exclusive) */
    const x: NumberZeroToOne = screenX / this.scene.engine.canvas.width;
    /** Normalised Y coordinate between 0 (inclusive) and 1 (exclusive) */
    const y: NumberZeroToOne = screenY / this.scene.engine.canvas.height;

    // if (x > 1 || x < 0 || y > 1 || y < 0) {
    //   // @NOTE No-op this can legitimately happen when panning
    //   return undefined;
    // }

    const rayDirection = this.tmp_RayCastFromCameraInverseViewProjectionMatrix
      .setValue(this.viewProjectionMatrix)
      .invertSelf()
      .transformPointInPlace(
        this.tmp_RayCastFromCameraDirection.setValue(
          x * 2 - 1,
          1 - y * 2, // @NOTE Invert Y because on screens top=0
          1, // @NOTE Near plane in NDC
        ),
      )
      .subtractSelf(this.absolutePosition)
      .normalizeSelf();

    return callbackFn(this.absolutePosition, rayDirection);
  }

  private get input(): IInputSystem { return this.scene.engine.inputSystem; }
}
