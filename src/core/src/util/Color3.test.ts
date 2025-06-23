import { describe, expect, test } from "@jest/globals";
import { Color3 } from "@polyzone/core/src/util";

describe(Color3.name, () => {
  describe("constructor", () => {
    test("typical RGB values creates a Color3 instance", () => {
      // Setup
      const r = 128;
      const g = 200;
      const b = 255;

      // Test
      const color = new Color3(r, g, b);

      // Assert
      expect(color.r).toBe(r);
      expect(color.g).toBe(g);
      expect(color.b).toBe(b);
    });
    test("overflowed red value creates a Color3 instance with clamped red value", () => {
      // Setup
      const r = 300; // @NOTE overflowed
      const g = 200;
      const b = 255;

      // Test
      const color = new Color3(r, g, b);

      // Assert
      expect(color.r).toBe(255);
      expect(color.g).toBe(g);
      expect(color.b).toBe(b);
    });
    test("underflowed red value creates a Color3 instance with clamped red value", () => {
      // Setup
      const r = -10; // @NOTE underflowed
      const g = 200;
      const b = 255;

      // Test
      const color = new Color3(r, g, b);

      // Assert
      expect(color.r).toBe(0);
      expect(color.g).toBe(g);
      expect(color.b).toBe(b);
    });
    test("overflowed green value creates a Color3 instance with clamped green value", () => {
      // Setup
      const r = 128;
      const g = 300; // @NOTE overflowed
      const b = 255;

      // Test
      const color = new Color3(r, g, b);

      // Assert
      expect(color.r).toBe(r);
      expect(color.g).toBe(255);
      expect(color.b).toBe(b);
    });
    test("underflowed green value creates a Color3 instance with clamped green value", () => {
      // Setup
      const r = 128;
      const g = -10; // @NOTE underflowed
      const b = 255;

      // Test
      const color = new Color3(r, g, b);

      // Assert
      expect(color.r).toBe(r);
      expect(color.g).toBe(0);
      expect(color.b).toBe(b);
    });
    test("overflowed blue value creates a Color3 instance with clamped blue value", () => {
      // Setup
      const r = 128;
      const g = 200;
      const b = 300; // @NOTE overflowed

      // Test
      const color = new Color3(r, g, b);

      // Assert
      expect(color.r).toBe(r);
      expect(color.g).toBe(g);
      expect(color.b).toBe(255);
    });
    test("underflowed blue value creates a Color3 instance with clamped blue value", () => {
      // Setup
      const r = 128;
      const g = 200;
      const b = -10; // @NOTE underflowed

      // Test
      const color = new Color3(r, g, b);

      // Assert
      expect(color.r).toBe(r);
      expect(color.g).toBe(g);
      expect(color.b).toBe(0);
    });
  });

  describe("set r", () => {
    test("with a typical value updates r", () => {
      // Setup
      const initialR = 128;
      const initialG = 200;
      const initialB = 255;
      const color = new Color3(initialR, initialG, initialB);
      const newValue = 50;

      const initialInstance = color;

      // Test
      color.r = newValue;

      // Assert
      expect(color).toBe(initialInstance);
      expect(color.r).toBe(newValue);
      expect(color.g).toBe(initialG);
      expect(color.b).toBe(initialB);
    });
    test("with an overflowed value updates r to 0xFF", () => {
      // Setup
      const initialR = 128;
      const initialG = 200;
      const initialB = 255;
      const color = new Color3(initialR, initialG, initialB);
      const newValue = 300;

      const initialInstance = color;

      // Test
      color.r = newValue;

      // Assert
      expect(color).toBe(initialInstance);
      expect(color.r).toBe(255);
      expect(color.g).toBe(initialG);
      expect(color.b).toBe(initialB);
    });
    test("with an underflowed value updates r to 0", () => {
      // Setup
      const initialR = 128;
      const initialG = 200;
      const initialB = 255;
      const color = new Color3(initialR, initialG, initialB);
      const newValue = -10;

      const initialInstance = color;

      // Test
      color.r = newValue;

      // Assert
      expect(color).toBe(initialInstance);
      expect(color.r).toBe(0);
      expect(color.g).toBe(initialG);
      expect(color.b).toBe(initialB);
    });
  });
  describe("set g", () => {
    test("with a typical value updates g", () => {
      // Setup
      const initialR = 128;
      const initialG = 200;
      const initialB = 255;
      const color = new Color3(initialR, initialG, initialB);
      const newValue = 50;

      const initialInstance = color;

      // Test
      color.g = newValue;

      // Assert
      expect(color).toBe(initialInstance);
      expect(color.r).toBe(initialR);
      expect(color.g).toBe(newValue);
      expect(color.b).toBe(initialB);
    });
    test("with an overflowed value updates g to 0xFF", () => {
      // Setup
      const initialR = 128;
      const initialG = 200;
      const initialB = 255;
      const color = new Color3(initialR, initialG, initialB);
      const newValue = 300;

      const initialInstance = color;

      // Test
      color.g = newValue;

      // Assert
      expect(color).toBe(initialInstance);
      expect(color.r).toBe(initialR);
      expect(color.g).toBe(255);
      expect(color.b).toBe(initialB);
    });
    test("with an underflowed value updates g to 0", () => {
      // Setup
      const initialR = 128;
      const initialG = 200;
      const initialB = 255;
      const color = new Color3(initialR, initialG, initialB);
      const newValue = -10;

      const initialInstance = color;

      // Test
      color.g = newValue;

      // Assert
      expect(color).toBe(initialInstance);
      expect(color.r).toBe(initialR);
      expect(color.g).toBe(0);
      expect(color.b).toBe(initialB);
    });
  });
  describe("set b", () => {
    test("with a typical value updates b", () => {
      // Setup
      const initialR = 128;
      const initialG = 200;
      const initialB = 255;
      const color = new Color3(initialR, initialG, initialB);
      const newValue = 50;

      const initialInstance = color;

      // Test
      color.b = newValue;

      // Assert
      expect(color).toBe(initialInstance);
      expect(color.r).toBe(initialR);
      expect(color.g).toBe(initialG);
      expect(color.b).toBe(newValue);
    });
    test("with an overflowed value updates b to 0xFF", () => {
      // Setup
      const initialR = 128;
      const initialG = 200;
      const initialB = 255;
      const color = new Color3(initialR, initialG, initialB);
      const newValue = 300;

      const initialInstance = color;

      // Test
      color.b = newValue;

      // Assert
      expect(color).toBe(initialInstance);
      expect(color.r).toBe(initialR);
      expect(color.g).toBe(initialG);
      expect(color.b).toBe(255);
    });
    test("with an underflowed value updates b to 0", () => {
      // Setup
      const initialR = 128;
      const initialG = 200;
      const initialB = 255;
      const color = new Color3(initialR, initialG, initialB);
      const newValue = -10;

      const initialInstance = color;

      // Test
      color.b = newValue;

      // Assert
      expect(color).toBe(initialInstance);
      expect(color.r).toBe(initialR);
      expect(color.g).toBe(initialG);
      expect(color.b).toBe(0);
    });
  });

  test("toColor4() converts value to Color4", () => {
    // Setup
    const color = new Color3(128, 200, 255);
    const alpha = 75;

    // Test
    const color4 = color.toColor4(alpha);

    // Assert
    expect(color4.r).toBe(color.r);
    expect(color4.g).toBe(color.g);
    expect(color4.b).toBe(color.b);
    expect(color4.a).toBe(alpha);
  });

  describe("withR()", () => {
    test("with typical value creates new Color3 with specified red value", () => {
      // Setup
      const newValue = 50;
      const color = new Color3(128, 200, 255);

      // Test
      const result = color.withR(newValue);

      // Assert
      expect(result).not.toBe(color);
      expect(result.r).toBe(newValue);
      expect(result.g).toBe(color.g);
      expect(result.b).toBe(color.b);
    });
    test("with overflowed value creates new Color3 with red value 255", () => {
      // Setup
      const newValue = 300;
      const color = new Color3(128, 200, 255);

      // Test
      const result = color.withR(newValue);

      // Assert
      expect(result).not.toBe(color);
      expect(result.r).toBe(255);
      expect(result.g).toBe(color.g);
      expect(result.b).toBe(color.b);
    });
    test("with underflowed value creates new Color3 with red value 0", () => {
      // Setup
      const newValue = -10;
      const color = new Color3(128, 200, 255);

      // Test
      const result = color.withR(newValue);

      // Assert
      expect(result).not.toBe(color);
      expect(result.r).toBe(0);
      expect(result.g).toBe(color.g);
      expect(result.b).toBe(color.b);
    });
  });
  describe("withG()", () => {
    test("with typical value creates new Color3 with specified green value", () => {
      // Setup
      const newValue = 50;
      const color = new Color3(128, 200, 255);

      // Test
      const result = color.withG(newValue);

      // Assert
      expect(result).not.toBe(color);
      expect(result.r).toBe(color.r);
      expect(result.g).toBe(newValue);
      expect(result.b).toBe(color.b);
    });
    test("with overflowed value creates new Color3 with green value 255", () => {
      // Setup
      const newValue = 300;
      const color = new Color3(128, 200, 255);

      // Test
      const result = color.withG(newValue);

      // Assert
      expect(result).not.toBe(color);
      expect(result.r).toBe(color.r);
      expect(result.g).toBe(255);
      expect(result.b).toBe(color.b);
    });
    test("with underflowed value creates new Color3 with green value 0", () => {
      // Setup
      const newValue = -10;
      const color = new Color3(128, 200, 255);

      // Test
      const result = color.withG(newValue);

      // Assert
      expect(result).not.toBe(color);
      expect(result.r).toBe(color.r);
      expect(result.g).toBe(0);
      expect(result.b).toBe(color.b);
    });
  });
  describe("withB()", () => {
    test("with typical value creates new Color3 with specified blue value", () => {
      // Setup
      const newValue = 50;
      const color = new Color3(128, 200, 255);

      // Test
      const result = color.withB(newValue);

      // Assert
      expect(result).not.toBe(color);
      expect(result.r).toBe(color.r);
      expect(result.g).toBe(color.g);
      expect(result.b).toBe(newValue);
    });
    test("with overflowed value creates new Color3 with blue value 255", () => {
      // Setup
      const newValue = 300;
      const color = new Color3(128, 200, 255);

      // Test
      const result = color.withB(newValue);

      // Assert
      expect(result).not.toBe(color);
      expect(result.r).toBe(color.r);
      expect(result.g).toBe(color.g);
      expect(result.b).toBe(255);
    });
    test("with underflowed value creates new Color3 with blue value 0", () => {
      // Setup
      const newValue = -10;
      const color = new Color3(128, 200, 255);

      // Test
      const result = color.withB(newValue);

      // Assert
      expect(result).not.toBe(color);
      expect(result.r).toBe(color.r);
      expect(result.g).toBe(color.g);
      expect(result.b).toBe(0);
    });
  });
});

