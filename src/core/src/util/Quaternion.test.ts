import { describe, expect, test } from "@jest/globals";
import { Quaternion as QuaternionBabylon, Vector3 as Vector3Babylon } from '@babylonjs/core';
import { Quaternion } from './Quaternion';
import { Vector3 } from "./Vector3";

/*
@TODO Test backlog
  - Interoperability with WrappedQuaternionBabylon
  - You know, like, the rest of Quaternion's functions
 */

describe("Quaternion", () => {
  describe("fromLookDirection() returns correct Quaternion", () => {
    // Test cases
    ([
      { description: "Forward, upright", forward: new Vector3(0, 0, 1), up: new Vector3(0, 1, 0) },
      { description: "Forward, rolled to the right", forward: new Vector3(0, 0, 1), up: new Vector3(1, 0, 0) },
      { description: "Odd orientation", forward: new Vector3(1, 0, 1), up: new Vector3(-1, 1, 1) },
      { description: "Extremely odd orientation", forward: new Vector3(0.1, 0.4, 0.8), up: new Vector3(0.28, -0.57, 0.25) },
      { description: "Real world test case", forward: new Vector3(4.771367937694393, 0.038125054850356666, 1.4882121107312969), up: new Vector3(-0.1819086643358319, 24.980727283385345, -0.05673816835059576) },
    ]).forEach(({ description, forward, up }) => {
      // Ensure test cases are valid
      forward.normalizeSelf();
      up.normalizeSelf();

      test(description, (): void => {
        // Setup / Test
        const resultCore = Quaternion.fromLookDirection(forward, up);
        const resultBabylon = QuaternionBabylon.FromLookDirectionRH(
          new Vector3Babylon(forward.x, forward.y, forward.z),
          new Vector3Babylon(up.x, up.y, up.z),
        );

        // Assert
        // @NOTE For this functionality, we assert correctness by assuming Babylon's implementation is correct
        // and comparing against that.
        const PrecisionDp = 7;
        expect(resultCore.x).toBeCloseTo(resultBabylon.x, PrecisionDp);
        expect(resultCore.y).toBeCloseTo(resultBabylon.y, PrecisionDp);
        expect(resultCore.z).toBeCloseTo(resultBabylon.z, PrecisionDp);
        expect(resultCore.w).toBeCloseTo(resultBabylon.w, PrecisionDp);
      });
    });
  });

  describe("slerp() correctly interpolates between two Quaternions", () => {
    // Test cases
    ([
      { description: "0° to 180° around yaw", left: Quaternion.fromEuler(0, 0, 0), right: Quaternion.fromEuler(0, Math.PI, 0) },
      { description: "0° to 180° around every axis", left: Quaternion.fromEuler(0, 0, 0), right: Quaternion.fromEuler(Math.PI, Math.PI, Math.PI) },
      { description: "-180° to 180° around every axis", left: Quaternion.fromEuler(-Math.PI, -Math.PI, -Math.PI), right: Quaternion.fromEuler(Math.PI, Math.PI, Math.PI) },
      { description: "Real world example", left: new Quaternion(-0.00004205914934946938, 0.6831066896835496, 0.00003934021016353102, 0.7303185869590875), right: new Quaternion(-0.00004205914934946938, 0.6831066896835496, 0.00003934021016353102, 0.7303185869590875) },
      //
    ]).forEach(({ description, left, right }) => {
      test(description, () => {
        // @NOTE Multiple asserts for different t values
        for (let t = 0; t <= 1; t += 0.2) {
          // Setup / Test
          const resultCore = Quaternion.slerp(left, right, t);
          const resultBabylon = QuaternionBabylon.Slerp(
            new QuaternionBabylon(left.x, left.y, left.z, left.w),
            new QuaternionBabylon(right.x, right.y, right.z, right.w),
            t,
          );

          // Assert
          // @NOTE For this functionality, we assert correctness by assuming Babylon's implementation is correct
          // and comparing against that.
          const PrecisionDp = 7;
          expect(resultCore.x).toBeCloseTo(resultBabylon.x, PrecisionDp);
          expect(resultCore.y).toBeCloseTo(resultBabylon.y, PrecisionDp);
          expect(resultCore.z).toBeCloseTo(resultBabylon.z, PrecisionDp);
          expect(resultCore.w).toBeCloseTo(resultBabylon.w, PrecisionDp);
        }
      });
    });
  });
});
