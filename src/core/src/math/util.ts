export const Pi = Math.PI;
export const Tau = Pi * 2;

// @TODO REMOVE ANYTHING WE DON'T NEED
// @TODO JUST EXPORT FROM LOPOLY? We have the dependency now anyway

// export const DegreesToRadians = 1 / 180 * Pi;
// export const RadiansToDegrees = 1 / Pi * 180;


// /**
//  * Better modulus operation than built-in javascript `%` operator
//  * (which normally returns negative values for negative numbers).
//  * @param value
//  * @param modulus
//  * @example
//  * ```ts
//  * betterModulus(12, 10); // 2
//  * betterModulus(-12, 10); // 8
//  * ```
//  */
// export function betterModulus(value: number, modulus: number): number {
//   if (value >= modulus) {
//     return value % modulus;
//   } else if (value < 0) {
//     return (value % modulus) + modulus;
//   } else {
//     return value;
//   }
// }

// export function lerp(start: number, end: number, t: number): number {
//   return start + (end - start) * t;
// }

// export function inverseLerp(start: number, end: number, value: number): number {
//   if (start === end) {
//     return 0;
//   }
//   return (value - start) / (end - start);
// }

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

// export function sinDegrees(value: number): number {
//   return Math.sin(value / 360 * Tau);
// }
// export function sin(value: number, period: number, min: number, max: number): number {
//   return ((Math.sin(value / period * Tau) + 1) / 2) * (max - min) + min;
// }

// export function cosDegrees(value: number): number {
//   return Math.cos(value / 360 * Tau);
// }
// export function cos(value: number, period: number, min: number, max: number): number {
//   return ((Math.cos(value / period * Tau) + 1) / 2) * (max - min) + min;
// }

// export function tanDegrees(value: number): number {
//   return Math.tan(value / 360 * Tau);
// }
// export function tan(value: number, period: number): number {
//   return Math.tan(value / period * Tau);
// }

// /** Get a random number between `min` (inclusive) and `max` (exclusive).  */
// export function rand(min: number, max: number): number {
//   return Math.random() * (max - min) + min;
// }
// /** Get a random integer between `min` (inclusive) and `max` (exclusive).  */
// export function randInt(min: number, max: number): number {
//   min = min < 0 ? Math.floor(min) : Math.ceil(min);
//   max = max < 0 ? Math.floor(max) : Math.ceil(max);
//   return Math.trunc(Math.random() * (max - min) + min);
// }


// /**
//  * Utility similar to `Number.toFixed()` except integer values
//  * are left as-is.
//  * @param value Value to stringify.
//  * @param decimals Number of decimals to use if `value` is non-integer.
//  * @example
//  * ```typescript
//  * toFixed(2, 1); // Returns `"2"`
//  * toFixed(Math.PI, 1); // Returns `"3.1"`
//  * ```
//  */
// export function toFixed(value: number, decimals: number): string {
//   if (Number.isInteger(value)) {
//     return value.toString();
//   } else {
//     return value.toFixed(decimals);
//   }
// }
