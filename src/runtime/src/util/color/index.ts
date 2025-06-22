import { Color3 as Color3Babylon, Color4 as Color4Babylon } from '@babylonjs/core/Maths/math.color';
import { IColor3Like, IColor4Like } from '@babylonjs/core/Maths/math.like';
import { Color3 as Color3Core, Color4 as Color4Core } from '@polyzone/core/src/util';
import { ColorDefinition } from '../../cartridge/archive/util';

export * from './WrappedColor3Babylon';

export function coreColorValueToBabylon(value: number): number {
  return value / 0xFF;
}

export function babylonColorValueToCore(value: number): number {
  return value * 0xFF;
}

export function toColor3Core(color: IColor3Like): Color3Core {
  if (color instanceof Color3Babylon || color instanceof Color4Babylon) {
    // Convert from Babylon [0..1] domain to typical [0..255] domain
    return new Color3Core(
      babylonColorValueToCore(color.r),
      babylonColorValueToCore(color.g),
      babylonColorValueToCore(color.b),
    );
  } else {
    return new Color3Core(color.r, color.g, color.b);
  }
}

export function toColor4Core(color: IColor4Like): Color4Core {
  if (color instanceof Color4Babylon) {
    // Convert from Babylon [0..1] domain to typical [0..255] domain
    return new Color4Core(
      babylonColorValueToCore(color.r),
      babylonColorValueToCore(color.g),
      babylonColorValueToCore(color.b),
      babylonColorValueToCore(color.a),
    );
  } else {
    return new Color4Core(color.r, color.g, color.b, color.a);
  }
}

export function toColor3Babylon(color: IColor3Like): Color3Babylon {
  if (color instanceof Color3Babylon || color instanceof Color4Babylon) {
    return new Color3Babylon(
      color.r,
      color.g,
      color.b,
    );
  } else {
    // Convert from typical [0..255] domain to Babylon [0..1] domain
    return new Color3Babylon(
      coreColorValueToBabylon(color.r),
      coreColorValueToBabylon(color.g),
      coreColorValueToBabylon(color.b),
    );
  }
}

export function toColor4Babylon(color: IColor4Like): Color4Babylon {
  if (color instanceof Color4Babylon) {
    return new Color4Babylon(
      color.r,
      color.g,
      color.b,
      color.a,
    );
  } else {
    // Convert from typical [0..255] domain to Babylon [0..1] domain
    return new Color4Babylon(
      coreColorValueToBabylon(color.r),
      coreColorValueToBabylon(color.g),
      coreColorValueToBabylon(color.b),
      coreColorValueToBabylon(color.a),
    );
  }
}

export function toColor3Definition(color: IColor3Like): ColorDefinition {
  if (color instanceof Color3Babylon || color instanceof Color4Babylon) {
    // Convert from Babylon [0..1] domain to typical [0..255] domain
    return {
      r: babylonColorValueToCore(color.r),
      g: babylonColorValueToCore(color.g),
      b: babylonColorValueToCore(color.b),
    };
  } else {
    return {
      r: color.r,
      g: color.g,
      b: color.b,
    };
  }
}

// @TODO Color4Definition
