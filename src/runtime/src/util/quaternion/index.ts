
import { Quaternion as QuaternionBabylon } from '@babylonjs/core/Maths/math.vector';
import { IQuaternionLike } from '@babylonjs/core/Maths/math.like';
import { Quaternion as QuaternionCore } from '@polyzone/core/src/util/Quaternion';

export * from './WrappedQuaternionBabylon';

export function toQuaternionCore(quaternion: IQuaternionLike): QuaternionCore {
  return new QuaternionCore(
    quaternion.x,
    quaternion.y,
    quaternion.z,
    quaternion.w,
  );
}

export function toQuaternionBabylon(quaternion: IQuaternionLike): QuaternionBabylon {
  return new QuaternionBabylon(
    quaternion.x,
    quaternion.y,
    quaternion.z,
    quaternion.w,
  );
}
