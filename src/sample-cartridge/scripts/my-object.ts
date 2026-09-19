import { CameraComponent, CustomScript } from '@polyzone/core/objects';
import { InputButton } from '@polyzone/core/input';
import { Vector2, Vector3 } from '@polyzone/core/math';

const MOVE_SPEED_PER_SECOND = 3.0;
const GRAVITY_PER_SECOND = 0.15;
const JUMP_POWER = 0.04;
const CAMERA_SPEED = 0.1;

export default class MyObject extends CustomScript {
  private camera!: CameraComponent;
  private velocity: Vector3 = Vector3.zero();
  private jumpRequested: boolean = false;
  private cameraPoint: Vector3 = Vector3.zero();

  public override init(): void {
    this.camera = this.scene.query(({ path }) => path("Main Camera").component(CameraComponent));
  }

  public override onUpdate(deltaTime: number): void {
    const moveDelta = new Vector2(0, 0);

    /* MOVEMENT */
    if (this.input.isButtonDown(InputButton.Right)) moveDelta.x += 1;
    if (this.input.isButtonDown(InputButton.Left)) moveDelta.x -= 1;

    if (this.input.isButtonDown(InputButton.Up)) moveDelta.y += 1;
    if (this.input.isButtonDown(InputButton.Down)) moveDelta.y -= 1;

    if (this.input.wasButtonPressed(InputButton.A)) {
      this.requestJump();
    }

    if (this.isOnGround && this.jumpRequested) {
      this.jump();
    }

    // Normalize movement to speed per second
    moveDelta.normalizeSelf().scaleSelf(MOVE_SPEED_PER_SECOND * deltaTime);

    // @TODO I don't love `subtract` here. Is it just because of the camera?
    this.gameObject.position.subtractSelf(moveDelta);

    /* GRAVITY */
    const gravityMultiplier = this.velocity.z < 0 ? 1.3 : 1;
    this.velocity.z -= GRAVITY_PER_SECOND * deltaTime * gravityMultiplier;

    if (this.isOnGround && this.velocity.z <= 0) {
      // Snap to ground
      this.gameObject.position.z = 0;
      this.velocity.z = 0;
    } else {
      // Falling
      this.gameObject.position.z += this.velocity.z;
    }

    /* CAMERA */
    const cameraDelta = this.gameObject.absolutePosition.subtract(this.cameraPoint);
    this.cameraPoint = this.cameraPoint.addSelf(
      cameraDelta.scaleSelf(CAMERA_SPEED),
    );
    this.camera.pointAt(this.cameraPoint);
  }

  private requestJump(): void {
    this.jumpRequested = true;
    setTimeout(() => {
      this.jumpRequested = false;
    }, 100);
  }

  private jump(): void {
    this.velocity.z = JUMP_POWER;
    this.jumpRequested = false;
  }

  private get isOnGround(): boolean {
    // @NOTE Treat y=0 as ground (since PolyZone doesn't support collision yet)
    return this.gameObject.position.z < 0.05;
  }
}
