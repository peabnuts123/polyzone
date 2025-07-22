import { describe, expect, test } from 'vitest';
import { Color4 } from './Color4';

describe(Color4.name, () => {
  describe("constructor", () => {
    test("typical RGB values creates a Color4 instance", () => {
      // Setup
      const r = 128;
      const g = 200;
      const b = 255;
      const a = 100;

      // Test
      const color = new Color4(r, g, b, a);

      // Assert
      expect(color.r).toBe(r);
      expect(color.g).toBe(g);
      expect(color.b).toBe(b);
      expect(color.a).toBe(a);
    });
    test("overflowed red value creates a Color4 instance with clamped red value", () => {
      // Setup
      const r = 300; // @NOTE overflowed
      const g = 200;
      const b = 255;
      const a = 100;

      // Test
      const color = new Color4(r, g, b, a);

      // Assert
      expect(color.r).toBe(255);
      expect(color.g).toBe(g);
      expect(color.b).toBe(b);
      expect(color.a).toBe(a);
    });
    test("underflowed red value creates a Color4 instance with clamped red value", () => {
      // Setup
      const r = -10; // @NOTE underflowed
      const g = 200;
      const b = 255;
      const a = 100;

      // Test
      const color = new Color4(r, g, b, a);

      // Assert
      expect(color.r).toBe(0);
      expect(color.g).toBe(g);
      expect(color.b).toBe(b);
      expect(color.a).toBe(a);
    });
    test("overflowed green value creates a Color4 instance with clamped green value", () => {
      // Setup
      const r = 128;
      const g = 300; // @NOTE overflowed
      const b = 255;
      const a = 100;

      // Test
      const color = new Color4(r, g, b, a);

      // Assert
      expect(color.r).toBe(r);
      expect(color.g).toBe(255);
      expect(color.b).toBe(b);
      expect(color.a).toBe(a);
    });
    test("underflowed green value creates a Color4 instance with clamped green value", () => {
      // Setup
      const r = 128;
      const g = -10; // @NOTE underflowed
      const b = 255;
      const a = 100;

      // Test
      const color = new Color4(r, g, b, a);

      // Assert
      expect(color.r).toBe(r);
      expect(color.g).toBe(0);
      expect(color.b).toBe(b);
      expect(color.a).toBe(a);
    });
    test("overflowed blue value creates a Color4 instance with clamped blue value", () => {
      // Setup
      const r = 128;
      const g = 200;
      const b = 300; // @NOTE overflowed
      const a = 100;

      // Test
      const color = new Color4(r, g, b, a);

      // Assert
      expect(color.r).toBe(r);
      expect(color.g).toBe(g);
      expect(color.b).toBe(255);
      expect(color.a).toBe(a);
    });
    test("underflowed blue value creates a Color4 instance with clamped blue value", () => {
      // Setup
      const r = 128;
      const g = 200;
      const b = -10; // @NOTE underflowed
      const a = 100;

      // Test
      const color = new Color4(r, g, b, a);

      // Assert
      expect(color.r).toBe(r);
      expect(color.g).toBe(g);
      expect(color.b).toBe(0);
      expect(color.a).toBe(a);
    });
    test("overflowed alpha value creates a Color4 instance with clamped alpha value", () => {
      // Setup
      const r = 128;
      const g = 200;
      const b = 255;
      const a = 300; // @NOTE overflowed

      // Test
      const color = new Color4(r, g, b, a);

      // Assert
      expect(color.r).toBe(r);
      expect(color.g).toBe(g);
      expect(color.b).toBe(b);
      expect(color.a).toBe(255);
    });
    test("underflowed alpha value creates a Color4 instance with clamped alpha value", () => {
      // Setup
      const r = 128;
      const g = 200;
      const b = 255;
      const a = -10; // @NOTE underflowed

      // Test
      const color = new Color4(r, g, b, a);

      // Assert
      expect(color.r).toBe(r);
      expect(color.g).toBe(g);
      expect(color.b).toBe(b);
      expect(color.a).toBe(0);
    });
  });

  describe("set r", () => {
    test("with a typical value updates r", () => {
      // Setup
      const initialR = 128;
      const initialG = 200;
      const initialB = 255;
      const initialA = 100;
      const color = new Color4(initialR, initialG, initialB, initialA);
      const newValue = 50;

      const initialInstance = color;

      // Test
      color.r = newValue;

      // Assert
      expect(color).toBe(initialInstance);
      expect(color.r).toBe(newValue);
      expect(color.g).toBe(initialG);
      expect(color.b).toBe(initialB);
      expect(color.a).toBe(initialA);
    });
    test("with an overflowed value updates r to 0xFF", () => {
      // Setup
      const initialR = 128;
      const initialG = 200;
      const initialB = 255;
      const initialA = 100;
      const color = new Color4(initialR, initialG, initialB, initialA);
      const newValue = 300;

      const initialInstance = color;

      // Test
      color.r = newValue;

      // Assert
      expect(color).toBe(initialInstance);
      expect(color.r).toBe(255);
      expect(color.g).toBe(initialG);
      expect(color.b).toBe(initialB);
      expect(color.a).toBe(initialA);
    });
    test("with an underflowed value updates r to 0", () => {
      // Setup
      const initialR = 128;
      const initialG = 200;
      const initialB = 255;
      const initialA = 100;
      const color = new Color4(initialR, initialG, initialB, initialA);
      const newValue = -10;

      const initialInstance = color;

      // Test
      color.r = newValue;

      // Assert
      expect(color).toBe(initialInstance);
      expect(color.r).toBe(0);
      expect(color.g).toBe(initialG);
      expect(color.b).toBe(initialB);
      expect(color.a).toBe(initialA);
    });
  });
  describe("set g", () => {
    test("with a typical value updates g", () => {
      // Setup
      const initialR = 128;
      const initialG = 200;
      const initialB = 255;
      const initialA = 100;
      const color = new Color4(initialR, initialG, initialB, initialA);
      const newValue = 50;

      const initialInstance = color;

      // Test
      color.g = newValue;

      // Assert
      expect(color).toBe(initialInstance);
      expect(color.r).toBe(initialR);
      expect(color.g).toBe(newValue);
      expect(color.b).toBe(initialB);
      expect(color.a).toBe(initialA);
    });
    test("with an overflowed value updates g to 0xFF", () => {
      // Setup
      const initialR = 128;
      const initialG = 200;
      const initialB = 255;
      const initialA = 100;
      const color = new Color4(initialR, initialG, initialB, initialA);
      const newValue = 300;

      const initialInstance = color;

      // Test
      color.g = newValue;

      // Assert
      expect(color).toBe(initialInstance);
      expect(color.r).toBe(initialR);
      expect(color.g).toBe(255);
      expect(color.b).toBe(initialB);
      expect(color.a).toBe(initialA);
    });
    test("with an underflowed value updates g to 0", () => {
      // Setup
      const initialR = 128;
      const initialG = 200;
      const initialB = 255;
      const initialA = 100;
      const color = new Color4(initialR, initialG, initialB, initialA);
      const newValue = -10;

      const initialInstance = color;

      // Test
      color.g = newValue;

      // Assert
      expect(color).toBe(initialInstance);
      expect(color.r).toBe(initialR);
      expect(color.g).toBe(0);
      expect(color.b).toBe(initialB);
      expect(color.a).toBe(initialA);
    });
  });
  describe("set b", () => {
    test("with a typical value updates b", () => {
      // Setup
      const initialR = 128;
      const initialG = 200;
      const initialB = 255;
      const initialA = 100;
      const color = new Color4(initialR, initialG, initialB, initialA);
      const newValue = 50;

      const initialInstance = color;

      // Test
      color.b = newValue;

      // Assert
      expect(color).toBe(initialInstance);
      expect(color.r).toBe(initialR);
      expect(color.g).toBe(initialG);
      expect(color.b).toBe(newValue);
      expect(color.a).toBe(initialA);
    });
    test("with an overflowed value updates b to 0xFF", () => {
      // Setup
      const initialR = 128;
      const initialG = 200;
      const initialB = 255;
      const initialA = 100;
      const color = new Color4(initialR, initialG, initialB, initialA);
      const newValue = 300;

      const initialInstance = color;

      // Test
      color.b = newValue;

      // Assert
      expect(color).toBe(initialInstance);
      expect(color.r).toBe(initialR);
      expect(color.g).toBe(initialG);
      expect(color.b).toBe(255);
      expect(color.a).toBe(initialA);
    });
    test("with an underflowed value updates b to 0", () => {
      // Setup
      const initialR = 128;
      const initialG = 200;
      const initialB = 255;
      const initialA = 100;
      const color = new Color4(initialR, initialG, initialB, initialA);
      const newValue = -10;

      const initialInstance = color;

      // Test
      color.b = newValue;

      // Assert
      expect(color).toBe(initialInstance);
      expect(color.r).toBe(initialR);
      expect(color.g).toBe(initialG);
      expect(color.b).toBe(0);
      expect(color.a).toBe(initialA);
    });
  });
  describe("set a", () => {
    test("with a typical value updates a", () => {
      // Setup
      const initialR = 128;
      const initialG = 200;
      const initialB = 255;
      const initialA = 100;
      const color = new Color4(initialR, initialG, initialB, initialA);
      const newValue = 50;

      const initialInstance = color;

      // Test
      color.a = newValue;

      // Assert
      expect(color).toBe(initialInstance);
      expect(color.r).toBe(initialR);
      expect(color.g).toBe(initialG);
      expect(color.b).toBe(initialB);
      expect(color.a).toBe(newValue);
    });
    test("with an overflowed value updates a to 0xFF", () => {
      // Setup
      const initialR = 128;
      const initialG = 200;
      const initialB = 255;
      const initialA = 100;
      const color = new Color4(initialR, initialG, initialB, initialA);
      const newValue = 300;

      const initialInstance = color;

      // Test
      color.a = newValue;

      // Assert
      expect(color).toBe(initialInstance);
      expect(color.r).toBe(initialR);
      expect(color.g).toBe(initialG);
      expect(color.b).toBe(initialB);
      expect(color.a).toBe(255);
    });
    test("with an underflowed value updates a to 0", () => {
      // Setup
      const initialR = 128;
      const initialG = 200;
      const initialB = 255;
      const initialA = 100;
      const color = new Color4(initialR, initialG, initialB, initialA);
      const newValue = -10;

      const initialInstance = color;

      // Test
      color.a = newValue;

      // Assert
      expect(color).toBe(initialInstance);
      expect(color.r).toBe(initialR);
      expect(color.g).toBe(initialG);
      expect(color.b).toBe(initialB);
      expect(color.a).toBe(0);
    });
  });

  describe("withR()", () => {
    test("with typical value creates new Color4 with specified red value", () => {
      // Setup
      const newValue = 50;
      const color = new Color4(128, 200, 255, 100);

      // Test
      const result = color.withR(newValue);

      // Assert
      expect(result).not.toBe(color);
      expect(result.r).toBe(newValue);
      expect(result.g).toBe(color.g);
      expect(result.b).toBe(color.b);
      expect(result.a).toBe(color.a);
    });
    test("with overflowed value creates new Color4 with red value 255", () => {
      // Setup
      const newValue = 300;
      const color = new Color4(128, 200, 255, 100);

      // Test
      const result = color.withR(newValue);

      // Assert
      expect(result).not.toBe(color);
      expect(result.r).toBe(255);
      expect(result.g).toBe(color.g);
      expect(result.b).toBe(color.b);
      expect(result.a).toBe(color.a);
    });
    test("with underflowed value creates new Color4 with red value 0", () => {
      // Setup
      const newValue = -10;
      const color = new Color4(128, 200, 255, 100 );

      // Test
      const result = color.withR(newValue);

      // Assert
      expect(result).not.toBe(color);
      expect(result.r).toBe(0);
      expect(result.g).toBe(color.g);
      expect(result.b).toBe(color.b);
      expect(result.a).toBe(color.a);
    });
  });
  describe("withG()", () => {
    test("with typical value creates new Color4 with specified green value", () => {
      // Setup
      const newValue = 50;
      const color = new Color4(128, 200, 255, 100);

      // Test
      const result = color.withG(newValue);

      // Assert
      expect(result).not.toBe(color);
      expect(result.r).toBe(color.r);
      expect(result.g).toBe(newValue);
      expect(result.b).toBe(color.b);
      expect(result.a).toBe(color.a);
    });
    test("with overflowed value creates new Color4 with green value 255", () => {
      // Setup
      const newValue = 300;
      const color = new Color4(128, 200, 255, 100 );

      // Test
      const result = color.withG(newValue);

      // Assert
      expect(result).not.toBe(color);
      expect(result.r).toBe(color.r);
      expect(result.g).toBe(255);
      expect(result.b).toBe(color.b);
      expect(result.a).toBe(color.a);
    });
    test("with underflowed value creates new Color4 with green value 0", () => {
      // Setup
      const newValue = -10;
      const color = new Color4(128, 200, 255, 100);

      // Test
      const result = color.withG(newValue);

      // Assert
      expect(result).not.toBe(color);
      expect(result.r).toBe(color.r);
      expect(result.g).toBe(0);
      expect(result.b).toBe(color.b);
      expect(result.a).toBe(color.a);
    });
  });
  describe("withB()", () => {
    test("with typical value creates new Color4 with specified blue value", () => {
      // Setup
      const newValue = 50;
      const color = new Color4(128, 200, 255, 100);

      // Test
      const result = color.withB(newValue);

      // Assert
      expect(result).not.toBe(color);
      expect(result.r).toBe(color.r);
      expect(result.g).toBe(color.g);
      expect(result.b).toBe(newValue);
      expect(result.a).toBe(color.a);
    });
    test("with overflowed value creates new Color4 with blue value 255", () => {
      // Setup
      const newValue = 300;
      const color = new Color4(128, 200, 255, 100);

      // Test
      const result = color.withB(newValue);

      // Assert
      expect(result).not.toBe(color);
      expect(result.r).toBe(color.r);
      expect(result.g).toBe(color.g);
      expect(result.b).toBe(255);
      expect(result.a).toBe(color.a);
    });
    test("with underflowed value creates new Color4 with blue value 0", () => {
      // Setup
      const newValue = -10;
      const color = new Color4(128, 200, 255, 100);

      // Test
      const result = color.withB(newValue);

      // Assert
      expect(result).not.toBe(color);
      expect(result.r).toBe(color.r);
      expect(result.g).toBe(color.g);
      expect(result.b).toBe(0);
      expect(result.a).toBe(color.a);
    });
  });
  describe("withA()", () => {
    test("with typical value creates new Color4 with specified alpha value", () => {
      // Setup
      const newValue = 50;
      const color = new Color4(128, 200, 255, 100);

      // Test
      const result = color.withA(newValue);

      // Assert
      expect(result).not.toBe(color);
      expect(result.r).toBe(color.r);
      expect(result.g).toBe(color.g);
      expect(result.b).toBe(color.b);
      expect(result.a).toBe(newValue);
    });
    test("with overflowed value creates new Color4 with alpha value 255", () => {
      // Setup
      const newValue = 300;
      const color = new Color4(128, 200, 255, 100);

      // Test
      const result = color.withA(newValue);

      // Assert
      expect(result).not.toBe(color);
      expect(result.r).toBe(color.r);
      expect(result.g).toBe(color.g);
      expect(result.b).toBe(color.b);
      expect(result.a).toBe(255);
    });
    test("with underflowed value creates new Color4 with alpha value 0", () => {
      // Setup
      const newValue = -10;
      const color = new Color4(128, 200, 255, 100);

      // Test
      const result = color.withA(newValue);

      // Assert
      expect(result).not.toBe(color);
      expect(result.r).toBe(color.r);
      expect(result.g).toBe(color.g);
      expect(result.b).toBe(color.b);
      expect(result.a).toBe(0);
    });
  });
});

