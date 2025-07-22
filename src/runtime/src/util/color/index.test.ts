import { describe, expect, test } from 'vitest';
import { Color3 as Color3Babylon, Color4 as Color4Babylon } from "@babylonjs/core/Maths/math.color";

import { Color3 as Color3Core, Color4 as Color4Core } from "@polyzone/core/src/util";
import { ColorDefinition } from "@polyzone/runtime/src/cartridge/archive/util";

import {
  babylonColorValueToCore,
  coreColorValueToBabylon,
  toColor3Babylon,
  toColor3Core,
  toColor3Definition,
  toColor4Babylon,
  toColor4Core,
} from './index';
import { WrappedColor3Babylon } from './WrappedColor3Babylon';

describe("Color utils", () => {
  test("All [0-255] integer colour values convert losslessly to/from [0-1] float domain", () => {
    for (let coreColorByte = 0; coreColorByte < 0xFF; coreColorByte++) {
      const babylonFloat = coreColorValueToBabylon(coreColorByte);
      const reconstitutedByte = babylonColorValueToCore(babylonFloat);
      expect(reconstitutedByte).toBe(coreColorByte);
    }
  });

  describe("toColor3Babylon()", () => {
    test("Called with Color3Babylon returns a new Color3Babylon", () => {
      // Setup
      const originalValue = new Color3Babylon(0.5, 0.75, 1);

      // Test
      const result = toColor3Babylon(originalValue);

      // Assert
      expect(result).not.toBe(originalValue);
      expect(result.r).toBe(originalValue.r);
      expect(result.g).toBe(originalValue.g);
      expect(result.b).toBe(originalValue.b);
    });
    test("Called with Color4Babylon returns a new Color3Babylon", () => {
      // Setup
      const originalValue = new Color4Babylon(0.5, 0.75, 1, 0.25);

      // Test
      const result = toColor3Babylon(originalValue);

      // Assert
      expect(result).not.toBe(originalValue);
      expect(result.r).toBe(originalValue.r);
      expect(result.g).toBe(originalValue.g);
      expect(result.b).toBe(originalValue.b);
    });
    test("Called with Color3Core returns a new Color3Babylon", () => {
      // Setup
      const originalValue = new Color3Core(50, 150, 255);

      // Test
      const result = toColor3Babylon(originalValue);

      // Assert
      expect(result).not.toBe(originalValue);
      expect(result.r).toBe(coreColorValueToBabylon(originalValue.r));
      expect(result.g).toBe(coreColorValueToBabylon(originalValue.g));
      expect(result.b).toBe(coreColorValueToBabylon(originalValue.b));
    });
    test("Called with Color4Core returns a new Color3Babylon", () => {
      // Setup
      const originalValue = new Color4Core(50, 150, 255, 75);

      // Test
      const result = toColor3Babylon(originalValue);

      // Assert
      expect(result).not.toBe(originalValue);
      expect(result.r).toBe(coreColorValueToBabylon(originalValue.r));
      expect(result.g).toBe(coreColorValueToBabylon(originalValue.g));
      expect(result.b).toBe(coreColorValueToBabylon(originalValue.b));
    });
    test("Called with ColorDefinition returns a new Color3Babylon", () => {
      // Setup
      const originalValue: ColorDefinition = { r: 50, g: 150, b: 255 };

      // Test
      const result = toColor3Babylon(originalValue);

      // Assert
      expect(result).not.toBe(originalValue);
      expect(result.r).toBe(coreColorValueToBabylon(originalValue.r));
      expect(result.g).toBe(coreColorValueToBabylon(originalValue.g));
      expect(result.b).toBe(coreColorValueToBabylon(originalValue.b));
    });
    test("Called with WrappedColor3Babylon returns a new Color3Babylon", () => {
      // Setup
      let underlyingValue = new Color3Babylon(0.5, 0.75, 1);
      const originalValue = new WrappedColor3Babylon(
        () => underlyingValue,
        (value) => underlyingValue = value,
      );

      // Test
      const result = toColor3Babylon(originalValue);

      // Assert
      expect(result).not.toBe(originalValue);
      expect(result.r).toBe(coreColorValueToBabylon(originalValue.r));
      expect(result.g).toBe(coreColorValueToBabylon(originalValue.g));
      expect(result.b).toBe(coreColorValueToBabylon(originalValue.b));
    });
  });

  describe("toColor3Core()", () => {
    test("Called with Color3Babylon returns a new Color3Core", () => {
      // Setup
      const originalValue = new Color3Babylon(0.5, 0.75, 1);

      // Test
      const result = toColor3Core(originalValue);

      // Assert
      expect(result).not.toBe(originalValue);
      expect(result.r).toBe(babylonColorValueToCore(originalValue.r));
      expect(result.g).toBe(babylonColorValueToCore(originalValue.g));
      expect(result.b).toBe(babylonColorValueToCore(originalValue.b));
    });
    test("Called with Color4Babylon returns a new Color3Core", () => {
      // Setup
      const originalValue = new Color4Babylon(0.5, 0.75, 1, 0.25);

      // Test
      const result = toColor3Core(originalValue);

      // Assert
      expect(result).not.toBe(originalValue);
      expect(result.r).toBe(babylonColorValueToCore(originalValue.r));
      expect(result.g).toBe(babylonColorValueToCore(originalValue.g));
      expect(result.b).toBe(babylonColorValueToCore(originalValue.b));
    });
    test("Called with Color3Core returns a new Color3Core", () => {
      // Setup
      const originalValue = new Color3Core(50, 150, 255);

      // Test
      const result = toColor3Core(originalValue);

      // Assert
      expect(result).not.toBe(originalValue);
      expect(result.r).toBe(originalValue.r);
      expect(result.g).toBe(originalValue.g);
      expect(result.b).toBe(originalValue.b);
    });
    test("Called with Color4Core returns a new Color3Core", () => {
      // Setup
      const originalValue = new Color4Core(50, 150, 255, 75);

      // Test
      const result = toColor3Core(originalValue);

      // Assert
      expect(result).not.toBe(originalValue);
      expect(result.r).toBe(originalValue.r);
      expect(result.g).toBe(originalValue.g);
      expect(result.b).toBe(originalValue.b);
    });
    test("Called with ColorDefinition returns a new Color3Core", () => {
      // Setup
      const originalValue: ColorDefinition = { r: 50, g: 150, b: 255 };

      // Test
      const result = toColor3Core(originalValue);

      // Assert
      expect(result).not.toBe(originalValue);
      expect(result.r).toBe(originalValue.r);
      expect(result.g).toBe(originalValue.g);
      expect(result.b).toBe(originalValue.b);
    });
    test("Called with WrappedColor3Babylon returns a new Color3Core", () => {
      // Setup
      let underlyingValue = new Color3Babylon(0.5, 0.75, 1);
      const originalValue = new WrappedColor3Babylon(
        () => underlyingValue,
        (value) => underlyingValue = value,
      );

      // Test
      const result = toColor3Core(originalValue);

      // Assert
      expect(result).not.toBe(originalValue);
      expect(result.r).toBe(originalValue.r);
      expect(result.g).toBe(originalValue.g);
      expect(result.b).toBe(originalValue.b);
    });
  });

  describe("toColor3Definition()", () => {
    test("Called with Color3Babylon returns a new Color3Definition", () => {
      // Setup
      const originalValue = new Color3Babylon(0.5, 0.75, 1);

      // Test
      const result = toColor3Definition(originalValue);

      // Assert
      expect(result).not.toBe(originalValue);
      expect(result.constructor).toBe(Object);
      expect(result.r).toBe(babylonColorValueToCore(originalValue.r));
      expect(result.g).toBe(babylonColorValueToCore(originalValue.g));
      expect(result.b).toBe(babylonColorValueToCore(originalValue.b));
    });
    test("Called with Color4Babylon returns a new Color3Definition", () => {
      // Setup
      const originalValue = new Color4Babylon(0.5, 0.75, 1, 0.25);

      // Test
      const result = toColor3Definition(originalValue);

      // Assert
      expect(result).not.toBe(originalValue);
      expect(result.constructor).toBe(Object);
      expect(result.r).toBe(babylonColorValueToCore(originalValue.r));
      expect(result.g).toBe(babylonColorValueToCore(originalValue.g));
      expect(result.b).toBe(babylonColorValueToCore(originalValue.b));
    });
    test("Called with Color3Core returns a new Color3Definition", () => {
      // Setup
      const originalValue = new Color3Core(50, 150, 255);

      // Test
      const result = toColor3Definition(originalValue);

      // Assert
      expect(result).not.toBe(originalValue);
      expect(result.constructor).toBe(Object);
      expect(result.r).toBe(originalValue.r);
      expect(result.g).toBe(originalValue.g);
      expect(result.b).toBe(originalValue.b);
    });
    test("Called with Color4Core returns a new Color3Definition", () => {
      // Setup
      const originalValue = new Color4Core(50, 150, 255, 75);

      // Test
      const result = toColor3Definition(originalValue);

      // Assert
      expect(result).not.toBe(originalValue);
      expect(result.constructor).toBe(Object);
      expect(result.r).toBe(originalValue.r);
      expect(result.g).toBe(originalValue.g);
      expect(result.b).toBe(originalValue.b);
    });
    test("Called with ColorDefinition returns a new Color3Definition", () => {
      // Setup
      const originalValue: ColorDefinition = { r: 50, g: 150, b: 255 };

      // Test
      const result = toColor3Definition(originalValue);

      // Assert
      expect(result).not.toBe(originalValue);
      expect(result.constructor).toBe(Object);
      expect(result.r).toBe(originalValue.r);
      expect(result.g).toBe(originalValue.g);
      expect(result.b).toBe(originalValue.b);
    });
    test("Called with WrappedColor3Babylon returns a new Color3Definition", () => {
      // Setup
      let underlyingValue = new Color3Babylon(0.5, 0.75, 1);
      const originalValue = new WrappedColor3Babylon(
        () => underlyingValue,
        (value) => underlyingValue = value,
      );

      // Test
      const result = toColor3Definition(originalValue);

      // Assert
      expect(result).not.toBe(originalValue);
      expect(result.constructor).toBe(Object);
      expect(result.r).toBe(originalValue.r);
      expect(result.g).toBe(originalValue.g);
      expect(result.b).toBe(originalValue.b);
    });
  });

  describe("toColor4Babylon()", () => {
    test("Called with Color4Babylon returns a new Color4Babylon", () => {
      // Setup
      const originalValue = new Color4Babylon(0.5, 0.75, 1, 0.25);

      // Test
      const result = toColor4Babylon(originalValue);

      // Assert
      expect(result).not.toBe(originalValue);
      expect(result.r).toBe(originalValue.r);
      expect(result.g).toBe(originalValue.g);
      expect(result.b).toBe(originalValue.b);
      expect(result.a).toBe(originalValue.a);
    });
    test("Called with Color4Core returns a new Color4Babylon", () => {
      // Setup
      const originalValue = new Color4Core(50, 150, 255, 75);

      // Test
      const result = toColor4Babylon(originalValue);

      // Assert
      expect(result).not.toBe(originalValue);
      expect(result.r).toBe(coreColorValueToBabylon(originalValue.r));
      expect(result.g).toBe(coreColorValueToBabylon(originalValue.g));
      expect(result.b).toBe(coreColorValueToBabylon(originalValue.b));
      expect(result.a).toBe(coreColorValueToBabylon(originalValue.a));
    });
  });

  describe("toColor4Core()", () => {
    test("Called with Color4Babylon returns a new Color4Core", () => {
      // Setup
      const originalValue = new Color4Babylon(0.5, 0.75, 1, 0.25);

      // Test
      const result = toColor4Core(originalValue);

      // Assert
      expect(result).not.toBe(originalValue);
      expect(result.r).toBe(babylonColorValueToCore(originalValue.r));
      expect(result.g).toBe(babylonColorValueToCore(originalValue.g));
      expect(result.b).toBe(babylonColorValueToCore(originalValue.b));
      expect(result.a).toBe(babylonColorValueToCore(originalValue.a));
    });
    test("Called with Color4Core returns a new Color4Core", () => {
      // Setup
      const originalValue = new Color4Core(50, 150, 255, 75);

      // Test
      const result = toColor4Core(originalValue);

      // Assert
      expect(result).not.toBe(originalValue);
      expect(result.r).toBe(originalValue.r);
      expect(result.g).toBe(originalValue.g);
      expect(result.b).toBe(originalValue.b);
      expect(result.a).toBe(originalValue.a);
    });
  });
});
