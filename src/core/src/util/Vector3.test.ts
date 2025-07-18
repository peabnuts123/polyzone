import { describe, expect, test } from '@jest/globals';

import { Vector3 as Vector3Core } from './Vector3';

/* @TODO Test backlog
  - Interoperability with WrappedVector3Babylon
  - lengthSquared()
  - crossSelf
  - cross
  - dot
  - isNormalized
*/

describe(Vector3Core.name, () => {
  test("set x updates x", () => {
    // Setup
    const initialX = 1;
    const initialY = 2;
    const initialZ = 3;
    const vector = new Vector3Core(initialX, initialY, initialZ);
    const newValue = 5;

    // Test
    vector.x = newValue;

    // Assert
    expect(vector.x).toBe(newValue);
    expect(vector.y).toBe(initialY);
    expect(vector.z).toBe(initialZ);
  });
  test("set y updates y", () => {
    // Setup
    const initialX = 1;
    const initialY = 2;
    const initialZ = 3;
    const vector = new Vector3Core(initialX, initialY, initialZ);
    const newValue = 5;

    // Test
    vector.y = newValue;

    // Assert
    expect(vector.x).toBe(initialX);
    expect(vector.y).toBe(newValue);
    expect(vector.z).toBe(initialZ);
  });
  test("set z updates z efficiently", () => {
    // Setup
    const initialX = 1;
    const initialY = 2;
    const initialZ = 3;
    const vector = new Vector3Core(initialX, initialY, initialZ);
    const newValue = 5;

    // Test
    vector.z = newValue;

    // Assert
    expect(vector.x).toBe(initialX);
    expect(vector.y).toBe(initialY);
    expect(vector.z).toBe(newValue);
  });

  test("setValue() updates all three XYZ values", () => {
    // Setup
    const vector = new Vector3Core(1, 2, 3);
    const newValue = new Vector3Core(4, 5, 6);

    // Test
    vector.setValue(newValue);

    // Assert
    expect(vector.x).toBe(newValue.x);
    expect(vector.y).toBe(newValue.y);
    expect(vector.z).toBe(newValue.z);
  });

  test("addSelf() adds a vector to itself", () => {
    // Setup
    const initialX = 1;
    const initialY = 2;
    const initialZ = 3;
    const vector = new Vector3Core(initialX, initialY, initialZ);
    const operand = new Vector3Core(2, 3, 4);

    const initialInstance = vector;

    // Test
    const result = vector.addSelf(operand);

    // Assert
    expect(initialInstance).toBe(result);
    expect(result.x).toBe(initialX + operand.x);
    expect(result.y).toBe(initialY + operand.y);
    expect(result.z).toBe(initialZ + operand.z);
  });
  test("add() adds a vector into a new vector", () => {
    // Setup
    const initialX = 1;
    const initialY = 2;
    const initialZ = 3;
    const vector = new Vector3Core(initialX, initialY, initialZ);
    const operand = new Vector3Core(2, 3, 4);

    const initialInstance = vector;

    // Test
    const result = vector.add(operand);

    // Assert
    expect(initialInstance).not.toBe(result);
    expect(result.x).toBe(initialX + operand.x);
    expect(result.y).toBe(initialY + operand.y);
    expect(result.z).toBe(initialZ + operand.z);
  });

  test("subtractSelf() subtracts a vector from itself", () => {
    // Setup
    const initialX = 1;
    const initialY = 2;
    const initialZ = 3;
    const vector = new Vector3Core(initialX, initialY, initialZ);
    const operand = new Vector3Core(2, 3, 4);

    const initialInstance = vector;

    // Test
    const result = vector.subtractSelf(operand);

    // Assert
    expect(initialInstance).toBe(result);
    expect(result.x).toBe(initialX - operand.x);
    expect(result.y).toBe(initialY - operand.y);
    expect(result.z).toBe(initialZ - operand.z);
  });
  test("subtract() subtracts a vector into a new vector", () => {
    // Setup
    const initialX = 1;
    const initialY = 2;
    const initialZ = 3;
    const vector = new Vector3Core(initialX, initialY, initialZ);
    const operand = new Vector3Core(2, 3, 4);

    const initialInstance = vector;

    // Test
    const result = vector.subtract(operand);

    // Assert
    expect(initialInstance).not.toBe(result);
    expect(result.x).toBe(initialX - operand.x);
    expect(result.y).toBe(initialY - operand.y);
    expect(result.z).toBe(initialZ - operand.z);
  });

  describe("multiply", () => {
    test("multiplySelf(), called with a scalar operand, multiplies each component of itself by the scalar", () => {
      // Setup
      const initialX = 1;
      const initialY = 2;
      const initialZ = 3;
      const vector = new Vector3Core(initialX, initialY, initialZ);
      const operand = 3;

      const initialInstance = vector;

      // Test
      const result = vector.multiplySelf(operand);

      // Assert
      expect(initialInstance).toBe(result);
      expect(result.x).toBe(initialX * operand);
      expect(result.y).toBe(initialY * operand);
      expect(result.z).toBe(initialZ * operand);
    });
    test("multiplySelf(), called with a vector operand, multiplies itself by the vector componentwise", () => {
      // Setup
      const initialX = 1;
      const initialY = 2;
      const initialZ = 3;
      const vector = new Vector3Core(initialX, initialY, initialZ);
      const operand = new Vector3Core(2, 3, 4);

      const initialInstance = vector;

      // Test
      const result = vector.multiplySelf(operand);

      // Assert
      expect(initialInstance).toBe(result);
      expect(result.x).toBe(initialX * operand.x);
      expect(result.y).toBe(initialY * operand.y);
      expect(result.z).toBe(initialZ * operand.z);
    });
    test("multiply(), called with a scalar operand, multiplies each component by the scalar into a new vector", () => {
      // Setup
      const initialX = 1;
      const initialY = 2;
      const initialZ = 3;
      const vector = new Vector3Core(initialX, initialY, initialZ);
      const operand = 4;

      const initialInstance = vector;

      // Test
      const result = vector.multiply(operand);

      // Assert
      expect(initialInstance).not.toBe(result);
      expect(result.x).toBe(initialX * operand);
      expect(result.y).toBe(initialY * operand);
      expect(result.z).toBe(initialZ * operand);
    });
    test("multiply(), called with a vector operand, multiplies each component by the vector componentwise into a new vector", () => {
      // Setup
      const initialX = 1;
      const initialY = 2;
      const initialZ = 3;
      const vector = new Vector3Core(initialX, initialY, initialZ);
      const operand = new Vector3Core(2, 3, 4);

      const initialInstance = vector;

      // Test
      const result = vector.multiply(operand);

      // Assert
      expect(initialInstance).not.toBe(result);
      expect(result.x).toBe(initialX * operand.x);
      expect(result.y).toBe(initialY * operand.y);
      expect(result.z).toBe(initialZ * operand.z);
    });
  });


  describe("divide", () => {
    test("divideSelf(), called with a typical scalar operand, divides each component of itself by the scalar", () => {
      // Setup
      const initialX = 1;
      const initialY = 2;
      const initialZ = 3;
      const vector = new Vector3Core(initialX, initialY, initialZ);
      const operand = 3;

      const initialInstance = vector;

      // Test
      const result = vector.divideSelf(operand);

      // Assert
      expect(initialInstance).toBe(result);
      expect(result.x).toBe(initialX / operand);
      expect(result.y).toBe(initialY / operand);
      expect(result.z).toBe(initialZ / operand);
    });
    test("divideSelf(), called with a typical vector operand, divides itself by the vector componentwise", () => {
      // Setup
      const initialX = 1;
      const initialY = 2;
      const initialZ = 3;
      const vector = new Vector3Core(initialX, initialY, initialZ);
      const operand = new Vector3Core(2, 3, 4);

      const initialInstance = vector;

      // Test
      const result = vector.divideSelf(operand);

      // Assert
      expect(initialInstance).toBe(result);
      expect(result.x).toBe(initialX / operand.x);
      expect(result.y).toBe(initialY / operand.y);
      expect(result.z).toBe(initialZ / operand.z);
    });
    test("divideSelf(), called with a zero scalar operand, throws an error", () => {
      // Setup
      const initialX = 1;
      const initialY = 2;
      const initialZ = 3;
      const vector = new Vector3Core(initialX, initialY, initialZ);
      const operand = 0;

      // Test
      const testFunc = (): void => {
        vector.divideSelf(operand);
      };

      // Assert
      expect(testFunc).toThrow("Cannot divide Vector3 by 0");
      expect(vector.x).toBe(initialX);
      expect(vector.y).toBe(initialY);
      expect(vector.z).toBe(initialZ);
    });
    test("divideSelf(), called with a vector operand containing zero, throws an error", () => {
      // Setup
      const initialX = 1;
      const initialY = 2;
      const initialZ = 3;
      const vector = new Vector3Core(initialX, initialY, initialZ);
      const operand = new Vector3Core(2, 0, 4);

      // Test
      const testFunc = (): void => {
        vector.divideSelf(operand);
      };

      // Assert
      expect(testFunc).toThrow(`Cannot divide Vector3 by 0: ${operand}`);
      expect(vector.x).toBe(initialX);
      expect(vector.y).toBe(initialY);
      expect(vector.z).toBe(initialZ);
    });
    test("divide(), called with a typical scalar operand, divides each component by the scalar into a new vector", () => {
      // Setup
      const initialX = 1;
      const initialY = 2;
      const initialZ = 3;
      const vector = new Vector3Core(initialX, initialY, initialZ);
      const operand = 4;

      const initialInstance = vector;

      // Test
      const result = vector.divide(operand);

      // Assert
      expect(initialInstance).not.toBe(result);
      expect(result.x).toBe(initialX / operand);
      expect(result.y).toBe(initialY / operand);
      expect(result.z).toBe(initialZ / operand);
    });
    test("divide(), called with a typical vector operand, divides each component by the vector componentwise into a new vector", () => {
      // Setup
      const initialX = 1;
      const initialY = 2;
      const initialZ = 3;
      const vector = new Vector3Core(initialX, initialY, initialZ);
      const operand = new Vector3Core(2, 3, 4);

      const initialInstance = vector;

      // Test
      const result = vector.divide(operand);

      // Assert
      expect(initialInstance).not.toBe(result);
      expect(result.x).toBe(initialX / operand.x);
      expect(result.y).toBe(initialY / operand.y);
      expect(result.z).toBe(initialZ / operand.z);
    });
    test("divide(), called with a zero scalar operand, throws an error", () => {
      // Setup
      const initialX = 1;
      const initialY = 2;
      const initialZ = 3;
      const vector = new Vector3Core(initialX, initialY, initialZ);
      const operand = 0;

      // Test
      const testFunc = (): void => {
        vector.divide(operand);
      };

      // Assert
      expect(testFunc).toThrow("Cannot divide Vector3 by 0");
    });
    test("divide(), called with a vector operand containing zero, throws an error", () => {
      // Setup
      const initialX = 1;
      const initialY = 2;
      const initialZ = 3;
      const vector = new Vector3Core(initialX, initialY, initialZ);
      const operand = new Vector3Core(2, 0, 4);

      // Test
      const testFunc = (): void => {
        vector.divide(operand);
      };

      // Assert
      expect(testFunc).toThrow(`Cannot divide Vector3 by 0: ${operand}`);
    });
  });


  test("normalizeSelf() adjusts a vector to have length 1", () => {
    // Setup
    const expectedLength = 7;
    const initialX = 2;
    const initialY = 3;
    const initialZ = 6;
    const vector = new Vector3Core(initialX, initialY, initialZ);

    const initialInstance = vector;

    // Test
    const result = vector.normalizeSelf();

    // Assert
    expect(initialInstance).toBe(result);
    expect(result.x).toBe(initialX / expectedLength);
    expect(result.y).toBe(initialY / expectedLength);
    expect(result.z).toBe(initialZ / expectedLength);
  });
  test("normalizeSelf() does not adjust a vector of length zero", () => {
    // Setup
    const initialX = 0;
    const initialY = 0;
    const initialZ = 0;
    const vector = new Vector3Core(initialX, initialY, initialZ);

    const initialInstance = vector;

    // Test
    const result = vector.normalizeSelf();

    // Assert
    expect(initialInstance).toBe(result);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
    expect(result.z).toBe(0);
  });
  test("normalize() creates a new vector with length 1", () => {
    // Setup
    const expectedLength = 7;
    const initialX = 2;
    const initialY = 3;
    const initialZ = 6;
    const vector = new Vector3Core(initialX, initialY, initialZ);

    const initialInstance = vector;

    // Test
    const result = vector.normalize();

    // Assert
    expect(initialInstance).not.toBe(result);
    expect(result.x).toBe(initialX / expectedLength);
    expect(result.y).toBe(initialY / expectedLength);
    expect(result.z).toBe(initialZ / expectedLength);
  });
  test("normalize(), called on a vector with length zero, returns a new zero vector", () => {
    // Setup
    const initialX = 0;
    const initialY = 0;
    const initialZ = 0;
    const vector = new Vector3Core(initialX, initialY, initialZ);

    const initialInstance = vector;

    // Test
    const result = vector.normalize();

    // Assert
    expect(initialInstance).not.toBe(result);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
    expect(result.z).toBe(0);
  });

  test("length() returns the correct length", () => {
    // Setup
    const initialX = 2;
    const initialY = 3;
    const initialZ = 6;
    const vector = new Vector3Core(initialX, initialY, initialZ);

    // Test
    const result = vector.length();

    // Assert
    expect(result).toBe(7);
  });

  test("clone() creates a new instance with the same values", () => {
    // Setup
    const initialX = 1;
    const initialY = 2;
    const initialZ = 3;
    const vector = new Vector3Core(initialX, initialY, initialZ);

    // Test
    const result = vector.clone();

    // Assert
    expect(result).not.toBe(vector);
    expect(result.x).toBe(initialX);
    expect(result.y).toBe(initialY);
    expect(result.z).toBe(initialZ);
  });

  test("withX() creates a new Vector3 with specified x value", () => {
    // Setup
    const initialX = 2;
    const initialY = 3;
    const initialZ = 6;
    const vector = new Vector3Core(initialX, initialY, initialZ);
    const newValue = 5;

    // Test
    const result = vector.withX(newValue);

    // Assert
    expect(result).not.toBe(vector);
    expect(result.x).toBe(newValue);
    expect(result.y).toBe(initialY);
    expect(result.z).toBe(initialZ);
  });
  test("withY() creates a new Vector3 with specified y value", () => {
    // Setup
    const initialX = 2;
    const initialY = 3;
    const initialZ = 6;
    const vector = new Vector3Core(initialX, initialY, initialZ);
    const newValue = 5;

    // Test
    const result = vector.withY(newValue);

    // Assert
    expect(result).not.toBe(vector);
    expect(result.x).toBe(initialX);
    expect(result.y).toBe(newValue);
    expect(result.z).toBe(initialZ);
  });
  test("withZ() creates a new Vector3 with specified z value", () => {
    // Setup
    const initialX = 2;
    const initialY = 3;
    const initialZ = 6;
    const vector = new Vector3Core(initialX, initialY, initialZ);
    const newValue = 5;

    // Test
    const result = vector.withZ(newValue);

    // Assert
    expect(result).not.toBe(vector);
    expect(result.x).toBe(initialX);
    expect(result.y).toBe(initialY);
    expect(result.z).toBe(newValue);
  });
});
