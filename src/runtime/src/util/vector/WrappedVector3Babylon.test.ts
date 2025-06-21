import { Vector3 as Vector3Babylon } from '@babylonjs/core/Maths/math.vector';
import { describe, expect, test } from '@jest/globals';

import { Vector3 as Vector3Core } from '@polyzone/core/src';

import { WrappedVector3Babylon } from './WrappedVector3Babylon';

describe(WrappedVector3Babylon.name, () => {
  test("addSelf", () => {
    // Setup
    const initialValue = new Vector3Babylon(1, 2, 3);
    const operand = new Vector3Core(2, 3, 4);
    const vector = createVector(initialValue);

    const initialInstance = vector;

    // Test
    const result = vector.addSelf(operand);

    // Assert
    expect(initialInstance).toBe(result);
    expect(result.x).toBe(initialValue.x + operand.x);
    expect(result.y).toBe(initialValue.y + operand.y);
    expect(result.z).toBe(initialValue.z + operand.z);
  });
  test("add", () => {
    // Setup
    const initialValue = new Vector3Babylon(1, 2, 3);
    const operand = new Vector3Core(2, 3, 4);
    const vector = createVector(initialValue);

    const initialInstance = vector;

    // Test
    const result = vector.add(operand);

    // Assert
    expect(initialInstance).not.toBe(result);
    expect(result.x).toBe(initialValue.x + operand.x);
    expect(result.y).toBe(initialValue.y + operand.y);
    expect(result.z).toBe(initialValue.z + operand.z);
  });

  test("subtractSelf", () => {
    // Setup
    const initialValue = new Vector3Babylon(1, 2, 3);
    const operand = new Vector3Core(2, 3, 4);
    const vector = createVector(initialValue);

    const initialInstance = vector;

    // Test
    const result = vector.subtractSelf(operand);

    // Assert
    expect(initialInstance).toBe(result);
    expect(result.x).toBe(initialValue.x - operand.x);
    expect(result.y).toBe(initialValue.y - operand.y);
    expect(result.z).toBe(initialValue.z - operand.z);
  });
  test("subtract", () => {
    // Setup
    const initialValue = new Vector3Babylon(1, 2, 3);
    const operand = new Vector3Core(2, 3, 4);
    const vector = createVector(initialValue);

    const initialInstance = vector;

    // Test
    const result = vector.subtract(operand);

    // Assert
    expect(initialInstance).not.toBe(result);
    expect(result.x).toBe(initialValue.x - operand.x);
    expect(result.y).toBe(initialValue.y - operand.y);
    expect(result.z).toBe(initialValue.z - operand.z);
  });

  test("multiplySelf - scalar operand", () => {
    // Setup
    const initialValue = new Vector3Babylon(1, 2, 3);
    const operand = 3;
    const vector = createVector(initialValue);

    const initialInstance = vector;

    // Test
    const result = vector.multiplySelf(operand);

    // Assert
    expect(initialInstance).toBe(result);
    expect(result.x).toBe(initialValue.x * operand);
    expect(result.y).toBe(initialValue.y * operand);
    expect(result.z).toBe(initialValue.z * operand);
  });
  test("multiplySelf - vector operand", () => {
    // Setup
    const initialValue = new Vector3Babylon(1, 2, 3);
    const operand = new Vector3Core(2, 3, 4);
    const vector = createVector(initialValue);

    const initialInstance = vector;

    // Test
    const result = vector.multiplySelf(operand);

    // Assert
    expect(initialInstance).toBe(result);
    expect(result.x).toBe(initialValue.x * operand.x);
    expect(result.y).toBe(initialValue.y * operand.y);
    expect(result.z).toBe(initialValue.z * operand.z);
  });
  test("multiply - vector scalar", () => {
    // Setup
    const initialValue = new Vector3Babylon(1, 2, 3);
    const operand = 4;
    const vector = createVector(initialValue);

    const initialInstance = vector;

    // Test
    const result = vector.multiply(operand);

    // Assert
    expect(initialInstance).not.toBe(result);
    expect(result.x).toBe(initialValue.x * operand);
    expect(result.y).toBe(initialValue.y * operand);
    expect(result.z).toBe(initialValue.z * operand);
  });
  test("multiply - vector operand", () => {
    // Setup
    const initialValue = new Vector3Babylon(1, 2, 3);
    const operand = new Vector3Core(2, 3, 4);
    const vector = createVector(initialValue);

    const initialInstance = vector;

    // Test
    const result = vector.multiply(operand);

    // Assert
    expect(initialInstance).not.toBe(result);
    expect(result.x).toBe(initialValue.x * operand.x);
    expect(result.y).toBe(initialValue.y * operand.y);
    expect(result.z).toBe(initialValue.z * operand.z);
  });

  test("divideSelf - scalar operand", () => {
    // Setup
    const initialValue = new Vector3Babylon(1, 2, 3);
    const operand = 3;
    const vector = createVector(initialValue);

    const initialInstance = vector;

    // Test
    const result = vector.divideSelf(operand);

    // Assert
    expect(initialInstance).toBe(result);
    expect(result.x).toBe(initialValue.x / operand);
    expect(result.y).toBe(initialValue.y / operand);
    expect(result.z).toBe(initialValue.z / operand);
  });
  test("divideSelf - vector operand", () => {
    // Setup
    const initialValue = new Vector3Babylon(1, 2, 3);
    const operand = new Vector3Core(2, 3, 4);
    const vector = createVector(initialValue);

    const initialInstance = vector;

    // Test
    const result = vector.divideSelf(operand);

    // Assert
    expect(initialInstance).toBe(result);
    expect(result.x).toBe(initialValue.x / operand.x);
    expect(result.y).toBe(initialValue.y / operand.y);
    expect(result.z).toBe(initialValue.z / operand.z);
  });
  test("divide - vector scalar", () => {
    // Setup
    const initialValue = new Vector3Babylon(1, 2, 3);
    const operand = 4;
    const vector = createVector(initialValue);

    const initialInstance = vector;

    // Test
    const result = vector.divide(operand);

    // Assert
    expect(initialInstance).not.toBe(result);
    expect(result.x).toBe(initialValue.x / operand);
    expect(result.y).toBe(initialValue.y / operand);
    expect(result.z).toBe(initialValue.z / operand);
  });
  test("divide - vector operand", () => {
    // Setup
    const initialValue = new Vector3Babylon(1, 2, 3);
    const operand = new Vector3Core(2, 3, 4);
    const vector = createVector(initialValue);

    const initialInstance = vector;

    // Test
    const result = vector.divide(operand);

    // Assert
    expect(initialInstance).not.toBe(result);
    expect(result.x).toBe(initialValue.x / operand.x);
    expect(result.y).toBe(initialValue.y / operand.y);
    expect(result.z).toBe(initialValue.z / operand.z);
  });

  test("normalizeSelf", () => {
    // Setup
    const expectedLength = 7;
    const initialValue = new Vector3Babylon(2, 3, 6);
    const vector = createVector(initialValue);

    const initialInstance = vector;

    // Test
    const result = vector.normalizeSelf();

    // Assert
    expect(initialInstance).toBe(result);
    expect(result.x).toBe(initialValue.x / expectedLength);
    expect(result.y).toBe(initialValue.y / expectedLength);
    expect(result.z).toBe(initialValue.z / expectedLength);
  });
  test("normalize", () => {
    // Setup
    const expectedLength = 7;
    const initialValue = new Vector3Babylon(2, 3, 6);
    const vector = createVector(initialValue);

    const initialInstance = vector;

    // Test
    const result = vector.normalize();

    // Assert
    expect(initialInstance).not.toBe(result);
    expect(result.x).toBe(initialValue.x / expectedLength);
    expect(result.y).toBe(initialValue.y / expectedLength);
    expect(result.z).toBe(initialValue.z / expectedLength);
  });

  test("length", () => {
    // Setup
    const initialValue = new Vector3Babylon(2, 3, 6);
    const vector = createVector(initialValue);

    // Test
    const result = vector.length();

    // Assert
    expect(result).toBe(7);
  });

  test("clone", () => {
    // Setup
    const initialValue = new Vector3Babylon(2, 3, 6);
    const vector = createVector(initialValue);

    // Test
    const result = vector.clone();

    // Assert
    expect(result).not.toBe(vector);
    expect(result.x).toBe(initialValue.x);
    expect(result.y).toBe(initialValue.y);
    expect(result.z).toBe(initialValue.z);
  });

  test("withX", () => {
    // Setup
    const newValue = 5;
    const initialValue = new Vector3Babylon(2, 3, 6);
    const vector = createVector(initialValue);

    // Test
    const result = vector.withX(newValue);

    // Assert
    expect(result).not.toBe(vector);
    expect(result.x).toBe(newValue);
    expect(result.y).toBe(initialValue.y);
    expect(result.z).toBe(initialValue.z);
  });
  test("withY", () => {
    // Setup
    const newValue = 5;
    const initialValue = new Vector3Babylon(2, 3, 6);
    const vector = createVector(initialValue);

    // Test
    const result = vector.withY(newValue);

    // Assert
    expect(result).not.toBe(vector);
    expect(result.x).toBe(initialValue.x);
    expect(result.y).toBe(newValue);
    expect(result.z).toBe(initialValue.z);
  });
  test("withZ", () => {
    // Setup
    const newValue = 5;
    const initialValue = new Vector3Babylon(2, 3, 6);
    const vector = createVector(initialValue);

    // Test
    const result = vector.withZ(newValue);

    // Assert
    expect(result).not.toBe(vector);
    expect(result.x).toBe(initialValue.x);
    expect(result.y).toBe(initialValue.y);
    expect(result.z).toBe(newValue);
  });
});

function createVector(initialValue: Vector3Babylon): WrappedVector3Babylon {
  let internalValue = initialValue;

  return new WrappedVector3Babylon(
    () => internalValue,
    (vector) => internalValue = vector,
  );
}
