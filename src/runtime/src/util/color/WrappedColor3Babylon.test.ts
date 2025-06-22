import { describe, expect, test } from "@jest/globals";
import { WrappedColor3Babylon } from "./WrappedColor3Babylon";
import { Color3 as Color3Core } from "@polyzone/core/src/util";
import { toColor3Babylon } from "./index";

describe(WrappedColor3Babylon.name, () => {
  describe("set r", () => {
    test("with a typical value updates r efficiently", () => {
      // Setup
      const initialValue = new Color3Core(128, 200, 255);
      const metadata = createColor(initialValue);
      const color = metadata.color;
      const newValue = 50;

      const initialInstance = color;

      // Test
      color.r = newValue;
      const { getCount, setCount } = metadata;

      // Assert
      expect(color).toBe(initialInstance);
      expect(color.r).toBe(newValue);
      expect(getCount).toBe(1);
      expect(setCount).toBe(1);
    });
    test("with an overflowed value updates r to 0xFF", () => {
      // Setup
      const initialValue = new Color3Core(128, 200, 255);
      const metadata = createColor(initialValue);
      const color = metadata.color;
      const newValue = 300;

      const initialInstance = color;

      // Test
      color.r = newValue;
      const { getCount, setCount } = metadata;

      // Assert
      expect(color).toBe(initialInstance);
      expect(color.r).toBe(255);
      expect(getCount).toBe(1);
      expect(setCount).toBe(1);
    });
    test("with an underflowed value updates r to 0", () => {
      // Setup
      const initialValue = new Color3Core(128, 200, 255);
      const metadata = createColor(initialValue);
      const color = metadata.color;
      const newValue = -10;

      const initialInstance = color;

      // Test
      color.r = newValue;
      const { getCount, setCount } = metadata;

      // Assert
      expect(color).toBe(initialInstance);
      expect(color.r).toBe(0);
      expect(getCount).toBe(1);
      expect(setCount).toBe(1);
    });
  });
  describe("set g", () => {
    test("with a typical value updates g efficiently", () => {
      // Setup
      const initialValue = new Color3Core(128, 200, 255);
      const metadata = createColor(initialValue);
      const color = metadata.color;
      const newValue = 50;

      // Test
      color.g = newValue;
      const { getCount, setCount } = metadata;

      // Assert
      expect(color.g).toBe(newValue);
      expect(getCount).toBe(1);
      expect(setCount).toBe(1);
    });
    test("with an overflowed value updates g to 0xFF", () => {
      // Setup
      const initialValue = new Color3Core(128, 200, 255);
      const metadata = createColor(initialValue);
      const color = metadata.color;
      const newValue = 300;

      // Test
      color.g = newValue;
      const { getCount, setCount } = metadata;

      // Assert
      expect(color.g).toBe(255);
      expect(getCount).toBe(1);
      expect(setCount).toBe(1);
    });
    test("with an underflowed value updates r to 0", () => {
      // Setup
      const initialValue = new Color3Core(128, 200, 255);
      const metadata = createColor(initialValue);
      const color = metadata.color;
      const newValue = -10;

      // Test
      color.g = newValue;
      const { getCount, setCount } = metadata;

      // Assert
      expect(color.g).toBe(0);
      expect(getCount).toBe(1);
      expect(setCount).toBe(1);
    });
  });
  describe("set b", () => {
    test("with a typical value updates b efficiently", () => {
      // Setup
      const initialValue = new Color3Core(128, 200, 255);
      const metadata = createColor(initialValue);
      const color = metadata.color;
      const newValue = 50;

      // Test
      color.b = newValue;
      const { getCount, setCount } = metadata;

      // Assert
      expect(color.b).toBe(newValue);
      expect(getCount).toBe(1);
      expect(setCount).toBe(1);
    });
    test("with an overflowed value updates b to 0xFF", () => {
      // Setup
      const initialValue = new Color3Core(128, 200, 255);
      const metadata = createColor(initialValue);
      const color = metadata.color;
      const newValue = 300;

      // Test
      color.b = newValue;
      const { getCount, setCount } = metadata;

      // Assert
      expect(color.b).toBe(255);
      expect(getCount).toBe(1);
      expect(setCount).toBe(1);
    });
    test("with an underflowed value updates r to 0", () => {
      // Setup
      const initialValue = new Color3Core(128, 200, 255);
      const metadata = createColor(initialValue);
      const color = metadata.color;
      const newValue = -10;

      // Test
      color.b = newValue;
      const { getCount, setCount } = metadata;

      // Assert
      expect(color.b).toBe(0);
      expect(getCount).toBe(1);
      expect(setCount).toBe(1);
    });
  });


  test("setValue() updates all three RGB values efficiently", () => {
    // Setup
    const initialValue = new Color3Core(128, 200, 255);
    const metadata = createColor(initialValue);
    const color = metadata.color;
    const newValue = new Color3Core(50, 100, 150);

    // Test
    color.setValue(newValue);
    const { getCount, setCount } = metadata;

    // Assert
    expect(color.r).toBe(newValue.r);
    expect(color.g).toBe(newValue.g);
    expect(color.b).toBe(newValue.b);
    expect(getCount).toBe(0);
    expect(setCount).toBe(1);
  });

  test("toColor4() converts value to Color4 efficiently", () => {
    // Setup
    const initialValue = new Color3Core(128, 200, 255);
    const metadata = createColor(initialValue);
    const color = metadata.color;
    const alpha = 200;

    // Test
    const color4 = color.toColor4(alpha);
    const { getCount, setCount } = metadata;

    // Assert
    expect(color4.r).toBe(color.r);
    expect(color4.g).toBe(color.g);
    expect(color4.b).toBe(color.b);
    expect(color4.a).toBe(alpha);
    expect(getCount).toBe(1);
    expect(setCount).toBe(0);
  });

  test("withR() creates new Color3 with specified red value efficiently", () => {
    // Setup
    const newValue = 50;
    const initialValue = new Color3Core(128, 200, 255);
    const metadata = createColor(initialValue);
    const color = metadata.color;

    // Test
    const result = color.withR(newValue);
    const { getCount, setCount } = metadata;

    // Assert
    expect(result).not.toBe(color);
    expect(result.r).toBe(newValue);
    expect(result.g).toBe(initialValue.g);
    expect(result.b).toBe(initialValue.b);
    expect(getCount).toBe(1);
    expect(setCount).toBe(0);
  });
  test("withG() creates new Color3 with specified green value efficiently", () => {
    // Setup
    const newValue = 50;
    const initialValue = new Color3Core(128, 200, 255);
    const metadata = createColor(initialValue);
    const color = metadata.color;

    // Test
    const result = color.withG(newValue);
    const { getCount, setCount } = metadata;

    // Assert
    expect(result).not.toBe(color);
    expect(result.r).toBe(initialValue.r);
    expect(result.g).toBe(newValue);
    expect(result.b).toBe(initialValue.b);
    expect(getCount).toBe(1);
    expect(setCount).toBe(0);
  });
  test("withB() creates new Color3 with specified blue value efficiently", () => {
    // Setup
    const newValue = 50;
    const initialValue = new Color3Core(128, 200, 255);
    const metadata = createColor(initialValue);
    const color = metadata.color;

    // Test
    const result = color.withB(newValue);
    const { getCount, setCount } = metadata;

    // Assert
    expect(result).not.toBe(color);
    expect(result.r).toBe(initialValue.r);
    expect(result.g).toBe(initialValue.g);
    expect(result.b).toBe(newValue);
    expect(getCount).toBe(1);
    expect(setCount).toBe(0);
  });
});

interface WrappedColorTestData {
  color: WrappedColor3Babylon;
  get setCount(): number;
  get getCount(): number;
}
function createColor(initialValue: Color3Core): WrappedColorTestData {
  let internalValue = toColor3Babylon(initialValue);
  let getCount = 0;
  let setCount = 0;

  return {
    color: new WrappedColor3Babylon(
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
