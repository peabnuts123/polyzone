import { IQuaternionLike, IVector3Like } from "@babylonjs/core/Maths/math.like";
import { expect } from "vitest";

export function expectVector3ToEqual(actual: IVector3Like, expected: IVector3Like, reason?: string): void {
  expect({
    x: actual.x,
    y: actual.y,
    z: actual.z,
  }, reason).toEqual({
    x: expected.x,
    y: expected.y,
    z: expected.z,
  });
};

export function expectQuaternionToEqual(actual: IQuaternionLike, expected: IQuaternionLike, reason?: string): void {
  expect({
    x: actual.x,
    y: actual.y,
    z: actual.z,
    w: actual.w,
  }, reason).toEqual({
    x: expected.x,
    y: expected.y,
    z: expected.z,
    w: expected.w,
  });
}
