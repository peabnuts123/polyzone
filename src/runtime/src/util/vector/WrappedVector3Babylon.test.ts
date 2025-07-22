import { Vector3 as Vector3Babylon } from '@babylonjs/core/Maths/math.vector';
import { describe, expect, test } from 'vitest';

import { Vector3 as Vector3Core } from '@polyzone/core/src';

import { WrappedVector3Babylon } from './WrappedVector3Babylon';

describe(WrappedVector3Babylon.name, () => {
  test("set x updates x efficiently", () => {
    // Setup
    const initialX = 1;
    const initialY = 2;
    const initialZ = 3;
    const initialValue = new Vector3Babylon(initialX, initialY, initialZ);
    const metadata = createVector(initialValue);
    const vector = metadata.vector;
    const newValue = 5;

    // Test
    vector.x = newValue;
    const { getCount, setCount } = metadata;

    // Assert
    expect(vector.x).toBe(newValue);
    expect(vector.y).toBe(initialY);
    expect(vector.z).toBe(initialZ);
    expect(getCount).toBe(1);
    expect(setCount).toBe(1);
  });
  test("set y updates y efficiently", () => {
    // Setup
    const initialX = 1;
    const initialY = 2;
    const initialZ = 3;
    const initialValue = new Vector3Babylon(initialX, initialY, initialZ);
    const metadata = createVector(initialValue);
    const vector = metadata.vector;
    const newValue = 5;

    // Test
    vector.y = newValue;
    const { getCount, setCount } = metadata;

    // Assert
    expect(vector.x).toBe(initialX);
    expect(vector.y).toBe(newValue);
    expect(vector.z).toBe(initialZ);
    expect(getCount).toBe(1);
    expect(setCount).toBe(1);
  });
  test("set z updates z efficiently", () => {
    // Setup
    const initialX = 1;
    const initialY = 2;
    const initialZ = 3;
    const initialValue = new Vector3Babylon(initialX, initialY, initialZ);
    const metadata = createVector(initialValue);
    const vector = metadata.vector;
    const newValue = 5;

    // Test
    vector.z = newValue;
    const { getCount, setCount } = metadata;

    // Assert
    expect(vector.x).toBe(initialX);
    expect(vector.y).toBe(initialY);
    expect(vector.z).toBe(newValue);
    expect(getCount).toBe(1);
    expect(setCount).toBe(1);
  });

  test("setValue() updates all three XYZ values efficiently", () => {
    // Setup
    const initialValue = new Vector3Babylon(1, 2, 3);
    const metadata = createVector(initialValue);
    const vector = metadata.vector;
    const newValue = new Vector3Core(4, 5, 6);

    // Test
    vector.setValue(newValue);
    const { getCount, setCount } = metadata;

    // Assert
    expect(vector.x).toBe(newValue.x);
    expect(vector.y).toBe(newValue.y);
    expect(vector.z).toBe(newValue.z);
    expect(getCount).toBe(0);
    expect(setCount).toBe(1);
  });

  test("addSelf() adds a vector to itself efficiently", () => {
    // Setup
    const initialValue = new Vector3Babylon(1, 2, 3);
    const operand = new Vector3Core(2, 3, 4);
    const metadata = createVector(initialValue);
    const vector = metadata.vector;

    const initialInstance = vector;

    // Test
    const result = vector.addSelf(operand);
    const { getCount, setCount } = metadata;

    // Assert
    expect(initialInstance).toBe(result);
    expect(result.x).toBe(initialValue.x + operand.x);
    expect(result.y).toBe(initialValue.y + operand.y);
    expect(result.z).toBe(initialValue.z + operand.z);
    expect(getCount).toBe(1);
    expect(setCount).toBe(1);
  });
  test("add() adds a vector into a new vector efficiently", () => {
    // Setup
    const initialValue = new Vector3Babylon(1, 2, 3);
    const operand = new Vector3Core(2, 3, 4);
    const metadata = createVector(initialValue);
    const vector = metadata.vector;

    const initialInstance = vector;

    // Test
    const result = vector.add(operand);
    const { getCount, setCount } = metadata;

    // Assert
    expect(initialInstance).not.toBe(result);
    expect(result.x).toBe(initialValue.x + operand.x);
    expect(result.y).toBe(initialValue.y + operand.y);
    expect(result.z).toBe(initialValue.z + operand.z);
    expect(getCount).toBe(1);
    expect(setCount).toBe(0);
  });

  test("subtractSelf() subtracts a vector from itself efficiently", () => {
    // Setup
    const initialValue = new Vector3Babylon(1, 2, 3);
    const operand = new Vector3Core(2, 3, 4);
    const metadata = createVector(initialValue);
    const vector = metadata.vector;

    const initialInstance = vector;

    // Test
    const result = vector.subtractSelf(operand);
    const { getCount, setCount } = metadata;

    // Assert
    expect(initialInstance).toBe(result);
    expect(result.x).toBe(initialValue.x - operand.x);
    expect(result.y).toBe(initialValue.y - operand.y);
    expect(result.z).toBe(initialValue.z - operand.z);
    expect(getCount).toBe(1);
    expect(setCount).toBe(1);
  });
  test("subtract() subtracts a vector into a new vector efficiently", () => {
    // Setup
    const initialValue = new Vector3Babylon(1, 2, 3);
    const operand = new Vector3Core(2, 3, 4);
    const metadata = createVector(initialValue);
    const vector = metadata.vector;

    const initialInstance = vector;

    // Test
    const result = vector.subtract(operand);
    const { getCount, setCount } = metadata;

    // Assert
    expect(initialInstance).not.toBe(result);
    expect(result.x).toBe(initialValue.x - operand.x);
    expect(result.y).toBe(initialValue.y - operand.y);
    expect(result.z).toBe(initialValue.z - operand.z);
    expect(getCount).toBe(1);
    expect(setCount).toBe(0);
  });

  describe("multiply", () => {
    test("multiplySelf(), called with a scalar operand, multiplies each component of itself by the scalar efficiently", () => {
      // Setup
      const initialValue = new Vector3Babylon(1, 2, 3);
      const operand = 3;
      const metadata = createVector(initialValue);
      const vector = metadata.vector;

      const initialInstance = vector;

      // Test
      const result = vector.multiplySelf(operand);
      const { getCount, setCount } = metadata;

      // Assert
      expect(initialInstance).toBe(result);
      expect(result.x).toBe(initialValue.x * operand);
      expect(result.y).toBe(initialValue.y * operand);
      expect(result.z).toBe(initialValue.z * operand);
      expect(getCount).toBe(1);
      expect(setCount).toBe(1);
    });
    test("multiplySelf(), called with a vector operand, multiplies itself by the vector componentwise efficiently", () => {
      // Setup
      const initialValue = new Vector3Babylon(1, 2, 3);
      const operand = new Vector3Core(2, 3, 4);
      const metadata = createVector(initialValue);
      const vector = metadata.vector;

      const initialInstance = vector;

      // Test
      const result = vector.multiplySelf(operand);
      const { getCount, setCount } = metadata;

      // Assert
      expect(initialInstance).toBe(result);
      expect(result.x).toBe(initialValue.x * operand.x);
      expect(result.y).toBe(initialValue.y * operand.y);
      expect(result.z).toBe(initialValue.z * operand.z);
      expect(getCount).toBe(1);
      expect(setCount).toBe(1);
    });
    test("multiply(), called with a scalar operand, multiplies each component by the scalar into a new vector efficiently", () => {
      // Setup
      const initialValue = new Vector3Babylon(1, 2, 3);
      const operand = 4;
      const metadata = createVector(initialValue);
      const vector = metadata.vector;

      const initialInstance = vector;

      // Test
      const result = vector.multiply(operand);
      const { getCount, setCount } = metadata;

      // Assert
      expect(initialInstance).not.toBe(result);
      expect(result.x).toBe(initialValue.x * operand);
      expect(result.y).toBe(initialValue.y * operand);
      expect(result.z).toBe(initialValue.z * operand);
      expect(getCount).toBe(1);
      expect(setCount).toBe(0);
    });
    test("multiply(), called with a vector operand, multiplies each component by the vector componentwise into a new vector efficiently", () => {
      // Setup
      const initialValue = new Vector3Babylon(1, 2, 3);
      const operand = new Vector3Core(2, 3, 4);
      const metadata = createVector(initialValue);
      const vector = metadata.vector;

      const initialInstance = vector;

      // Test
      const result = vector.multiply(operand);
      const { getCount, setCount } = metadata;

      // Assert
      expect(initialInstance).not.toBe(result);
      expect(result.x).toBe(initialValue.x * operand.x);
      expect(result.y).toBe(initialValue.y * operand.y);
      expect(result.z).toBe(initialValue.z * operand.z);
      expect(getCount).toBe(1);
      expect(setCount).toBe(0);
    });
  });


  describe("divide", () => {
    test("divideSelf(), called with a typical scalar operand, divides each component of itself by the scalar efficiently", () => {
      // Setup
      const initialValue = new Vector3Babylon(1, 2, 3);
      const operand = 3;
      const metadata = createVector(initialValue);
      const vector = metadata.vector;

      const initialInstance = vector;

      // Test
      const result = vector.divideSelf(operand);
      const { getCount, setCount } = metadata;

      // Assert
      expect(initialInstance).toBe(result);
      expect(result.x).toBe(initialValue.x / operand);
      expect(result.y).toBe(initialValue.y / operand);
      expect(result.z).toBe(initialValue.z / operand);
      expect(getCount).toBe(1);
      expect(setCount).toBe(1);
    });
    test("divideSelf(), called with a typical vector operand, divides itself by the vector componentwise efficiently", () => {
      // Setup
      const initialValue = new Vector3Babylon(1, 2, 3);
      const operand = new Vector3Core(2, 3, 4);
      const metadata = createVector(initialValue);
      const vector = metadata.vector;

      const initialInstance = vector;

      // Test
      const result = vector.divideSelf(operand);
      const { getCount, setCount } = metadata;

      // Assert
      expect(initialInstance).toBe(result);
      expect(result.x).toBe(initialValue.x / operand.x);
      expect(result.y).toBe(initialValue.y / operand.y);
      expect(result.z).toBe(initialValue.z / operand.z);
      expect(getCount).toBe(1);
      expect(setCount).toBe(1);
    });
    test("divideSelf(), called with a zero scalar operand, throws an error", () => {
      // Setup
      const initialValue = new Vector3Babylon(1, 2, 3);
      const operand = 0;
      const metadata = createVector(initialValue);
      const vector = metadata.vector;

      // Test
      const testFunc = (): void => {
        vector.divideSelf(operand);
      };

      // Assert
      expect(testFunc).toThrow("Cannot divide Vector3 by 0");
      const { getCount, setCount } = metadata;
      expect(vector.x).toBe(initialValue.x);
      expect(vector.y).toBe(initialValue.y);
      expect(vector.z).toBe(initialValue.z);
      expect(getCount).toBe(0);
      expect(setCount).toBe(0);
    });
    test("divideSelf(), called with a vector operand containing zero, throws an error", () => {
      // Setup
      const initialValue = new Vector3Babylon(1, 2, 3);
      const operand = new Vector3Core(2, 0, 4);
      const metadata = createVector(initialValue);
      const vector = metadata.vector;

      // Test
      const testFunc = (): void => {
        vector.divideSelf(operand);
      };
      const { getCount, setCount } = metadata;

      // Assert
      expect(testFunc).toThrow(`Cannot divide Vector3 by 0: ${operand}`);
      expect(vector.x).toBe(initialValue.x);
      expect(vector.y).toBe(initialValue.y);
      expect(vector.z).toBe(initialValue.z);
      expect(getCount).toBe(0);
      expect(setCount).toBe(0);
    });
    test("divide(), called with a typical scalar operand, divides each component by the scalar into a new vector efficiently", () => {
      // Setup
      const initialValue = new Vector3Babylon(1, 2, 3);
      const operand = 4;
      const metadata = createVector(initialValue);
      const vector = metadata.vector;

      const initialInstance = vector;

      // Test
      const result = vector.divide(operand);
      const { getCount, setCount } = metadata;

      // Assert
      expect(initialInstance).not.toBe(result);
      expect(result.x).toBe(initialValue.x / operand);
      expect(result.y).toBe(initialValue.y / operand);
      expect(result.z).toBe(initialValue.z / operand);
      expect(getCount).toBe(1);
      expect(setCount).toBe(0);
    });
    test("divide(), called with a typical vector operand, divides each component by the vector componentwise into a new vector efficiently", () => {
      // Setup
      const initialValue = new Vector3Babylon(1, 2, 3);
      const operand = new Vector3Core(2, 3, 4);
      const metadata = createVector(initialValue);
      const vector = metadata.vector;

      const initialInstance = vector;

      // Test
      const result = vector.divide(operand);
      const { getCount, setCount } = metadata;

      // Assert
      expect(initialInstance).not.toBe(result);
      expect(result.x).toBe(initialValue.x / operand.x);
      expect(result.y).toBe(initialValue.y / operand.y);
      expect(result.z).toBe(initialValue.z / operand.z);
      expect(getCount).toBe(1);
      expect(setCount).toBe(0);
    });
    test("divide(), called with a zero scalar operand, throws an error", () => {
      // Setup
      const initialValue = new Vector3Babylon(1, 2, 3);
      const operand = 0;
      const metadata = createVector(initialValue);
      const vector = metadata.vector;

      // Test
      const testFunc = (): void => {
        vector.divide(operand);
      };

      // Assert
      expect(testFunc).toThrow("Cannot divide Vector3 by 0");
      const { getCount, setCount } = metadata;
      expect(getCount).toBe(0);
      expect(setCount).toBe(0);
    });
    test("divide(), called with a vector operand containing zero, throws an error", () => {
      // Setup
      const initialValue = new Vector3Babylon(1, 2, 3);
      const operand = new Vector3Core(2, 0, 4);
      const metadata = createVector(initialValue);
      const vector = metadata.vector;

      // Test
      const testFunc = (): void => {
        vector.divide(operand);
      };

      // Assert
      expect(testFunc).toThrow(`Cannot divide Vector3 by 0: ${operand}`);
      const { getCount, setCount } = metadata;
      expect(getCount).toBe(0);
      expect(setCount).toBe(0);
    });
  });


  test("normalizeSelf() adjusts a vector to have length 1 efficiently", () => {
    // Setup
    const expectedLength = 7;
    const initialValue = new Vector3Babylon(2, 3, 6);
    const metadata = createVector(initialValue);
    const vector = metadata.vector;

    const initialInstance = vector;

    // Test
    const result = vector.normalizeSelf();
    const { getCount, setCount } = metadata;

    // Assert
    expect(initialInstance).toBe(result);
    expect(result.x).toBe(initialValue.x / expectedLength);
    expect(result.y).toBe(initialValue.y / expectedLength);
    expect(result.z).toBe(initialValue.z / expectedLength);
    expect(getCount).toBe(1);
    expect(setCount).toBe(1);
  });
  test("normalizeSelf() does not adjust a vector of length zero", () => {
    // Setup
    const initialValue = new Vector3Babylon(0, 0, 0);
    const metadata = createVector(initialValue);
    const vector = metadata.vector;

    const initialInstance = vector;

    // Test
    const result = vector.normalizeSelf();
    const { getCount, setCount } = metadata;

    // Assert
    expect(initialInstance).toBe(result);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
    expect(result.z).toBe(0);
    expect(getCount).toBe(1);
    expect(setCount).toBe(1);
  });
  test("normalize() creates a new vector with length 1 efficiently", () => {
    // Setup
    const expectedLength = 7;
    const initialValue = new Vector3Babylon(2, 3, 6);
    const metadata = createVector(initialValue);
    const vector = metadata.vector;

    const initialInstance = vector;

    // Test
    const result = vector.normalize();
    const { getCount, setCount } = metadata;

    // Assert
    expect(initialInstance).not.toBe(result);
    expect(result.x).toBe(initialValue.x / expectedLength);
    expect(result.y).toBe(initialValue.y / expectedLength);
    expect(result.z).toBe(initialValue.z / expectedLength);
    expect(getCount).toBe(1);
    expect(setCount).toBe(0);
  });
  test("normalize(), called on a vector with length zero, returns a new zero vector", () => {
    // Setup
    const initialValue = new Vector3Babylon(0, 0, 0);
    const metadata = createVector(initialValue);
    const vector = metadata.vector;

    const initialInstance = vector;

    // Test
    const result = vector.normalize();
    const { getCount, setCount } = metadata;

    // Assert
    expect(initialInstance).not.toBe(result);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
    expect(result.z).toBe(0);
    expect(getCount).toBe(1);
    expect(setCount).toBe(0);
  });

  test("length() returns the correct length efficiently", () => {
    // Setup
    const initialValue = new Vector3Babylon(2, 3, 6);
    const metadata = createVector(initialValue);
    const vector = metadata.vector;

    // Test
    const result = vector.length();
    const { getCount, setCount } = metadata;

    // Assert
    expect(result).toBe(7);
    expect(getCount).toBe(1);
    expect(setCount).toBe(0);
  });

  test("clone() creates a new instance with the same values", () => {
    // Setup
    const initialValue = new Vector3Babylon(2, 3, 6);
    const metadata = createVector(initialValue);
    const vector = metadata.vector;

    // Test
    const result = vector.clone();
    const { getCount, setCount } = metadata;

    // Assert
    expect(result).not.toBe(vector);
    expect(result.x).toBe(initialValue.x);
    expect(result.y).toBe(initialValue.y);
    expect(result.z).toBe(initialValue.z);
    expect(getCount).toBe(1);
    expect(setCount).toBe(0);
  });

  test("withX() creates a new Vector3 with specified x value efficiently", () => {
    // Setup
    const newValue = 5;
    const initialValue = new Vector3Babylon(2, 3, 6);
    const metadata = createVector(initialValue);
    const vector = metadata.vector;

    // Test
    const result = vector.withX(newValue);
    const { getCount, setCount } = metadata;

    // Assert
    expect(result).not.toBe(vector);
    expect(result.x).toBe(newValue);
    expect(result.y).toBe(initialValue.y);
    expect(result.z).toBe(initialValue.z);
    expect(getCount).toBe(1);
    expect(setCount).toBe(0);
  });
  test("withY() creates a new Vector3 with specified y value efficiently", () => {
    // Setup
    const newValue = 5;
    const initialValue = new Vector3Babylon(2, 3, 6);
    const metadata = createVector(initialValue);
    const vector = metadata.vector;

    // Test
    const result = vector.withY(newValue);
    const { getCount, setCount } = metadata;

    // Assert
    expect(result).not.toBe(vector);
    expect(result.x).toBe(initialValue.x);
    expect(result.y).toBe(newValue);
    expect(result.z).toBe(initialValue.z);
    expect(getCount).toBe(1);
    expect(setCount).toBe(0);
  });
  test("withZ() creates a new Vector3 with specified z value efficiently", () => {
    // Setup
    const newValue = 5;
    const initialValue = new Vector3Babylon(2, 3, 6);
    const metadata = createVector(initialValue);
    const vector = metadata.vector;

    // Test
    const result = vector.withZ(newValue);
    const { getCount, setCount } = metadata;

    // Assert
    expect(result).not.toBe(vector);
    expect(result.x).toBe(initialValue.x);
    expect(result.y).toBe(initialValue.y);
    expect(result.z).toBe(newValue);
    expect(getCount).toBe(1);
    expect(setCount).toBe(0);
  });
});

interface WrappedVectorTestData {
  vector: WrappedVector3Babylon;
  get setCount(): number;
  get getCount(): number;
}
function createVector(initialValue: Vector3Babylon): WrappedVectorTestData {
  let internalValue = initialValue.clone();
  let getCount = 0;
  let setCount = 0;

  return {
    vector: new WrappedVector3Babylon(
      () => {
        getCount++;
        return internalValue;
      },
      (vector) => {
        setCount++;
        internalValue = vector;
      },
    ),
    get setCount() {
      return setCount;
    },
    get getCount() {
      return getCount;
    },
  };
}
