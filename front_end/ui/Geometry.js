/*
 * Copyright (C) 2013 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import * as Platform from '../platform/platform.js';

/**
 * @type {number}
 */
export const _Eps = 1e-5;

export class Vector {
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  /**
   * @return {number}
   */
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  normalize() {
    const length = this.length();
    if (length <= _Eps) {
      return;
    }

    this.x /= length;
    this.y /= length;
    this.z /= length;
  }
}


export class Point {
  /**
   * @param {number} x
   * @param {number} y
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * @param {!Point} p
   * @return {number}
   */
  distanceTo(p) {
    return Math.sqrt(Math.pow(p.x - this.x, 2) + Math.pow(p.y - this.y, 2));
  }

  /**
   * @param {!Point} line
   * @return {!Point}
   */
  projectOn(line) {
    if (line.x === 0 && line.y === 0) {
      return new Point(0, 0);
    }
    return line.scale((this.x * line.x + this.y * line.y) / (Math.pow(line.x, 2) + Math.pow(line.y, 2)));
  }

  /**
   * @param {number} scalar
   * @return {!Point}
   */
  scale(scalar) {
    return new Point(this.x * scalar, this.y * scalar);
  }

  /**
   * @override
   * @return {string}
   */
  toString() {
    return Math.round(this.x * 100) / 100 + ', ' + Math.round(this.y * 100) / 100;
  }
}


export class CubicBezier {
  /**
   * @param {!Point} point1
   * @param {!Point} point2
   */
  constructor(point1, point2) {
    this.controlPoints = [point1, point2];
  }

  /**
   * @param {string} text
   * @return {?CubicBezier}
   */
  static parse(text) {
    const keywordValues = CubicBezier.KeywordValues;
    const value = text.toLowerCase().replace(/\s+/g, '');
    if (keywordValues.has(value)) {
      return CubicBezier.parse(/** @type {string} */ (keywordValues.get(value)));
    }
    const bezierRegex = /^cubic-bezier\(([^,]+),([^,]+),([^,]+),([^,]+)\)$/;
    const match = value.match(bezierRegex);
    if (match) {
      const control1 = new Point(parseFloat(match[1]), parseFloat(match[2]));
      const control2 = new Point(parseFloat(match[3]), parseFloat(match[4]));
      return new CubicBezier(control1, control2);
    }
    return null;
  }

  /**
   * @param {number} t
   * @return {!Point}
   */
  evaluateAt(t) {
    /**
     * @param {number} v1
     * @param {number} v2
     * @param {number} t
     */
    function evaluate(v1, v2, t) {
      return 3 * (1 - t) * (1 - t) * t * v1 + 3 * (1 - t) * t * t * v2 + Math.pow(t, 3);
    }

    const x = evaluate(this.controlPoints[0].x, this.controlPoints[1].x, t);
    const y = evaluate(this.controlPoints[0].y, this.controlPoints[1].y, t);
    return new Point(x, y);
  }

  /**
   * @return {string}
   */
  asCSSText() {
    const raw = 'cubic-bezier(' + this.controlPoints.join(', ') + ')';
    const keywordValues = CubicBezier.KeywordValues;
    for (const [keyword, value] of keywordValues) {
      if (raw === value) {
        return keyword;
      }
    }
    return raw;
  }
}

/** @type {!RegExp} */
CubicBezier.Regex = /((cubic-bezier\([^)]+\))|\b(linear|ease-in-out|ease-in|ease-out|ease)\b)/g;

/** @type {!Map<string, string>} */
CubicBezier.KeywordValues = new Map([
  ['linear', 'cubic-bezier(0, 0, 1, 1)'],
  ['ease', 'cubic-bezier(0.25, 0.1, 0.25, 1)'],
  ['ease-in', 'cubic-bezier(0.42, 0, 1, 1)'],
  ['ease-in-out', 'cubic-bezier(0.42, 0, 0.58, 1)'],
  ['ease-out', 'cubic-bezier(0, 0, 0.58, 1)'],
]);


export class EulerAngles {
  /**
   * @param {number} alpha
   * @param {number} beta
   * @param {number} gamma
   */
  constructor(alpha, beta, gamma) {
    this.alpha = alpha;
    this.beta = beta;
    this.gamma = gamma;
  }

  /**
   * @param {!CSSMatrix} rotationMatrix
   * @return {!EulerAngles}
   */
  static fromRotationMatrix(rotationMatrix) {
    const beta = Math.atan2(rotationMatrix.m23, rotationMatrix.m33);
    const gamma = Math.atan2(
        -rotationMatrix.m13,
        Math.sqrt(rotationMatrix.m11 * rotationMatrix.m11 + rotationMatrix.m12 * rotationMatrix.m12));
    const alpha = Math.atan2(rotationMatrix.m12, rotationMatrix.m11);
    return new EulerAngles(radiansToDegrees(gamma), -radiansToDegrees(beta), radiansToDegrees(alpha));
  }

  /**
  * @param {!CSSMatrix} rotationMatrix
  * @return {!EulerAngles}
  */
  static fromRotationMatrix2(rotationMatrix) {
    rotationMatrix = rotationMatrix.inverse();
    let alpha, beta, gamma;
    const a = [
      rotationMatrix.m11, rotationMatrix.m12, rotationMatrix.m13, rotationMatrix.m14, rotationMatrix.m21,
      rotationMatrix.m22, rotationMatrix.m23, rotationMatrix.m24, rotationMatrix.m31, rotationMatrix.m32,
      rotationMatrix.m33, rotationMatrix.m34, rotationMatrix.m41, rotationMatrix.m42, rotationMatrix.m43,
      rotationMatrix.m44
    ];
    const kEpsilon = 10e-8;
    if (Math.abs(a[10]) < kEpsilon) {   // a[10] (m33) == 0
      if (Math.abs(a[8]) < kEpsilon) {  // a[8] (m31) == 0, cos(beta) == 0
        // Gimbal lock discontinuity
        alpha = Math.atan2(a[4], a[0]);
        beta = (a[9] > 0) ? (Math.PI / 2) : -(Math.PI / 2);  // beta = +-pi/2
        gamma = 0;                                           // gamma = 0
      } else if (a[8] > 0) {                                 // cos(gamma) == 0, cos(beta) > 0
        alpha = Math.atan2(-a[1], a[5]);
        beta = Math.asin(a[9]);  // beta [-pi/2, pi/2]
        gamma = -(Math.PI / 2);  // gamma = -pi/2
      } else {                   // cos(gamma) == 0, cos(beta) < 0
        alpha = Math.atan2(a[1], -a[5]);
        beta = -Math.asin(a[9]);
        beta += (beta >= 0) ? -Math.PI : Math.PI;  // beta [-pi,-pi/2) U (pi/2,pi)
        gamma = -(Math.PI / 2);                    // gamma = -pi/2
      }
    } else if (a[10] > 0) {  // cos(beta) > 0
      alpha = Math.atan2(-a[1], a[5]);
      beta = Math.asin(a[9]);            // beta (-pi/2, pi/2)
      gamma = Math.atan2(-a[8], a[10]);  // gamma (-pi/2, pi/2)
    } else {                             // cos(beta) < 0
      alpha = Math.atan2(a[1], -a[5]);
      beta = -Math.asin(a[9]);
      beta += (beta >= 0) ? -Math.PI : Math.PI;  // beta [-pi,-pi/2) U (pi/2,pi)
      gamma = Math.atan2(a[8], -a[10]);          // gamma (-pi/2, pi/2)
      // console.error(`gamma=${gamma}`);
    }

    // alpha is in [-pi, pi], make sure it is in [0, 2*pi).
    if (alpha < -kEpsilon) {
      alpha += 2 * Math.PI;  // alpha [0, 2*pi)
    }

    /**
     * @param {number} angle
     * @return {number}
     */
    function round(angle) {
      return Math.round(angle * 10000) / 10000;
    }
    // alpha = Math.round(radiansToDegrees(alpha)) % 360;
    // beta = Math.round(radiansToDegrees(beta));
    // gamma = Math.round(radiansToDegrees(gamma));
    // console.error(`new gamma=${gamma}`);

    alpha = round(radiansToDegrees(alpha));
    beta = round(radiansToDegrees(beta));
    gamma = round(radiansToDegrees(gamma));

    // return new EulerAngles(-radiansToDegrees(alpha), radiansToDegrees(beta), -radiansToDegrees(gamma));
    // return new EulerAngles(radiansToDegrees(alpha), radiansToDegrees(beta), radiansToDegrees(gamma));
    return new EulerAngles(alpha, beta, gamma);
  }

  /**
  * @param {!CSSMatrix} rotationMatrix
  * @return {!EulerAngles}
  */
  static fromRotationMatrix3(rotationMatrix) {
    rotationMatrix = rotationMatrix.inverse();
    let x, y, z;

    x = Math.asin(-Platform.NumberUtilities.clamp(rotationMatrix.m23, -1, 1));
    if (Math.abs(rotationMatrix.m23) < 0.9999999) {
      y = Math.atan2(rotationMatrix.m13, rotationMatrix.m33);
      z = Math.atan2(rotationMatrix.m21, rotationMatrix.m22);
    } else {
      y = Math.atan2(-rotationMatrix.m31, rotationMatrix.m11);
      z = 0;
    }
    // x = Math.asin(- Platform.NumberUtilities.clamp(rotationMatrix.m32, - 1, 1));
    // if (Math.abs(rotationMatrix.m32) < 0.9999999) {
    //   y = Math.atan2(-rotationMatrix.m31, rotationMatrix.m33);
    //   z = Math.atan2(-rotationMatrix.m12, rotationMatrix.m22);
    // } else {
    //   y = 0;
    //   z = Math.atan2(- rotationMatrix.m21, rotationMatrix.m11);
    // }

    console.error(y, x, z);

    let alpha = z;
    // if (alpha < 0)
    //   alpha += 2 * Math.PI;

    let beta = x;
    // if (beta >= Math.PI)
    //   beta -= 2 * Math.PI;
    // else if (beta < -Math.PI)
    //   beta += 2 * Math.PI;

    let gamma = y;
    // if (gamma >= Math.PI / 2)
    //   gamma -= Math.PI;
    // else if (gamma < -Math.PI / 2)
    //   gamma += Math.PI;

    return new EulerAngles(radiansToDegrees(alpha), radiansToDegrees(beta), radiansToDegrees(gamma));
  }

  /**
   * @return {string}
   */
  toCSSRotationString() {
    // const gammaAxisY = -Math.sin(degreesToRadians(this.beta));
    // const gammaAxisZ = Math.cos(degreesToRadians(this.beta));
    // const axis = {alpha: [0, 1, 0], beta: [-1, 0, 0], gamma: [0, gammaAxisY, gammaAxisZ]};
    // return 'rotate3d(' + axis.alpha.join(',') + ',' + this.alpha + 'deg) ' +
    //     'rotate3d(' + axis.beta.join(',') + ',' + this.beta + 'deg) ' +
    //     'rotate3d(' + axis.gamma.join(',') + ',' + this.gamma + 'deg)';

    // CSS Transforms coordinate space is left-handed, Device Orientation's is
    // right-handed. Convert the latter into the former by inverting Z and Y
    // axes: axis.alpha corresponds to Y and axis.gamma corresponds to Z (Device
    // Orientation is Z-X'-Y''). Also invert the sign of X since in both
    // coordinate spaces they point to the same direction, but with opposite
    // positive rotations.
    // return `rotateZ(${this.alpha}deg) rotateX(${this.beta}deg) rotateY(${this.gamma}deg)`;
    return `rotateY(${this.alpha}deg) rotateX(${- this.beta}deg) rotateZ(${this.gamma}deg)`;
  }
}

/**
 * @param {!Vector} u
 * @param {!Vector} v
 * @return {number}
 */
export const scalarProduct = function(u, v) {
  return u.x * v.x + u.y * v.y + u.z * v.z;
};

/**
 * @param {!Vector} u
 * @param {!Vector} v
 * @return {!Vector}
 */
export const crossProduct = function(u, v) {
  const x = u.y * v.z - u.z * v.y;
  const y = u.z * v.x - u.x * v.z;
  const z = u.x * v.y - u.y * v.x;
  return new Vector(x, y, z);
};

/**
 * @param {!Vector} u
 * @param {!Vector} v
 * @return {!Vector}
 */
export const subtract = function(u, v) {
  const x = u.x - v.x;
  const y = u.y - v.y;
  const z = u.z - v.z;
  return new Vector(x, y, z);
};

/**
 * @param {!Vector} v
 * @param {!CSSMatrix} m
 * @return {!Vector}
 */
export const multiplyVectorByMatrixAndNormalize = function(v, m) {
  const t = v.x * m.m14 + v.y * m.m24 + v.z * m.m34 + m.m44;
  const x = (v.x * m.m11 + v.y * m.m21 + v.z * m.m31 + m.m41) / t;
  const y = (v.x * m.m12 + v.y * m.m22 + v.z * m.m32 + m.m42) / t;
  const z = (v.x * m.m13 + v.y * m.m23 + v.z * m.m33 + m.m43) / t;
  return new Vector(x, y, z);
};

/**
 * @param {!Vector} u
 * @param {!Vector} v
 * @return {number}
 */
export const calculateAngle = function(u, v) {
  const uLength = u.length();
  const vLength = v.length();
  if (uLength <= _Eps || vLength <= _Eps) {
    return 0;
  }
  const cos = scalarProduct(u, v) / uLength / vLength;
  if (Math.abs(cos) > 1) {
    return 0;
  }
  return radiansToDegrees(Math.acos(cos));
};

/**
 * @param {number} deg
 * @return {number}
 */
export const degreesToRadians = function(deg) {
  return deg * Math.PI / 180;
};

/**
 * @param {number} deg
 * @return {number}
 */
export const degreesToGradians = function(deg) {
  return deg / 9 * 10;
};

/**
 * @param {number} deg
 * @return {number}
 */
export const degreesToTurns = function(deg) {
  return deg / 360;
};

/**
 * @param {number} rad
 * @return {number}
 */
export const radiansToDegrees = function(rad) {
  return rad * 180 / Math.PI;
};

/**
 * @param {number} rad
 * @return {number}
 */
export const radiansToGradians = function(rad) {
  return rad * 200 / Math.PI;
};

/**
 * @param {number} rad
 * @return {number}
 */
export const radiansToTurns = function(rad) {
  return rad / (2 * Math.PI);
};

/**
 * @param {number} grad
 * @return {number}
 */
export const gradiansToRadians = function(grad) {
  return grad * Math.PI / 200;
};

/**
 * @param {number} turns
 * @return {number}
 */
export const turnsToRadians = function(turns) {
  return turns * 2 * Math.PI;
};

/**
 * @param {!CSSMatrix} matrix
 * @param {!Array.<number>} points
 * @param {{minX: number, maxX: number, minY: number, maxY: number}=} aggregateBounds
 * @return {!{minX: number, maxX: number, minY: number, maxY: number}}
 */
export const boundsForTransformedPoints = function(matrix, points, aggregateBounds) {
  if (!aggregateBounds) {
    aggregateBounds = {minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity};
  }
  if (points.length % 3) {
    console.warn('Invalid size of points array');
  }
  for (let p = 0; p < points.length; p += 3) {
    let vector = new Vector(points[p], points[p + 1], points[p + 2]);
    vector = multiplyVectorByMatrixAndNormalize(vector, matrix);
    aggregateBounds.minX = Math.min(aggregateBounds.minX, vector.x);
    aggregateBounds.maxX = Math.max(aggregateBounds.maxX, vector.x);
    aggregateBounds.minY = Math.min(aggregateBounds.minY, vector.y);
    aggregateBounds.maxY = Math.max(aggregateBounds.maxY, vector.y);
  }
  return aggregateBounds;
};


export class Size {
  /**
   * @param {number} width
   * @param {number} height
   */
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }

  /**
   * @param {?Size=} size
   * @return {!Size}
   */
  clipTo(size) {
    if (!size) {
      return this;
    }
    return new Size(Math.min(this.width, size.width), Math.min(this.height, size.height));
  }

  /**
   * @param {number} scale
   * @return {!Size}
   */
  scale(scale) {
    return new Size(this.width * scale, this.height * scale);
  }

  /**
   * @param {?Size} size
   * @return {boolean}
   */
  isEqual(size) {
    return !!size && this.width === size.width && this.height === size.height;
  }

  /**
 * @param {!Size|number} size
 * @return {!Size}
 */
  widthToMax(size) {
    return new Size(Math.max(this.width, (typeof size === 'number' ? size : size.width)), this.height);
  }

  /**
 * @param {!Size|number} size
 * @return {!Size}
 */
  addWidth(size) {
    return new Size(this.width + (typeof size === 'number' ? size : size.width), this.height);
  }

  /**
   * @param {!Size|number} size
   * @return {!Size}
   */
  heightToMax(size) {
    return new Size(this.width, Math.max(this.height, (typeof size === 'number' ? size : size.height)));
  }

  /**
   * @param {!Size|number} size
   * @return {!Size}
   */
  addHeight(size) {
    return new Size(this.width, this.height + (typeof size === 'number' ? size : size.height));
  }
}


export class Insets {
  /**
   * @param {number} left
   * @param {number} top
   * @param {number} right
   * @param {number} bottom
   */
  constructor(left, top, right, bottom) {
    this.left = left;
    this.top = top;
    this.right = right;
    this.bottom = bottom;
  }

  /**
   * @param {?Insets} insets
   * @return {boolean}
   */
  isEqual(insets) {
    return !!insets && this.left === insets.left && this.top === insets.top && this.right === insets.right &&
        this.bottom === insets.bottom;
  }
}


export class Rect {
  /**
   * @param {number} left
   * @param {number} top
   * @param {number} width
   * @param {number} height
   */
  constructor(left, top, width, height) {
    this.left = left;
    this.top = top;
    this.width = width;
    this.height = height;
  }

  /**
   * @param {?Rect} rect
   * @return {boolean}
   */
  isEqual(rect) {
    return !!rect && this.left === rect.left && this.top === rect.top && this.width === rect.width &&
        this.height === rect.height;
  }

  /**
   * @param {number} scale
   * @return {!Rect}
   */
  scale(scale) {
    return new Rect(this.left * scale, this.top * scale, this.width * scale, this.height * scale);
  }

  /**
   * @return {!Size}
   */
  size() {
    return new Size(this.width, this.height);
  }

  /**
   * @param {!Rect} origin
   * @return {!Rect}
   */
  relativeTo(origin) {
    return new Rect(this.left - origin.left, this.top - origin.top, this.width, this.height);
  }

  /**
   * @param {!Rect} origin
   * @return {!Rect}
   */
  rebaseTo(origin) {
    return new Rect(this.left + origin.left, this.top + origin.top, this.width, this.height);
  }
}


export class Constraints {
  /**
   * @param {!Size=} minimum
   * @param {?Size=} preferred
   */
  constructor(minimum, preferred) {
    /**
     * @type {!Size}
     */
    this.minimum = minimum || new Size(0, 0);

    /**
     * @type {!Size}
     */
    this.preferred = preferred || this.minimum;

    if (this.minimum.width > this.preferred.width || this.minimum.height > this.preferred.height) {
      throw new Error('Minimum size is greater than preferred.');
    }
  }

  /**
   * @param {?Constraints} constraints
   * @return {boolean}
   */
  isEqual(constraints) {
    return !!constraints && this.minimum.isEqual(constraints.minimum) && this.preferred.isEqual(constraints.preferred);
  }

  /**
   * @param {!Constraints|number} value
   * @return {!Constraints}
   */
  widthToMax(value) {
    if (typeof value === 'number') {
      return new Constraints(this.minimum.widthToMax(value), this.preferred.widthToMax(value));
    }
    return new Constraints(this.minimum.widthToMax(value.minimum), this.preferred.widthToMax(value.preferred));
  }

  /**
   * @param {!Constraints|number} value
   * @return {!Constraints}
   */
  addWidth(value) {
    if (typeof value === 'number') {
      return new Constraints(this.minimum.addWidth(value), this.preferred.addWidth(value));
    }
    return new Constraints(this.minimum.addWidth(value.minimum), this.preferred.addWidth(value.preferred));
  }

  /**
   * @param {!Constraints|number} value
   * @return {!Constraints}
   */
  heightToMax(value) {
    if (typeof value === 'number') {
      return new Constraints(this.minimum.heightToMax(value), this.preferred.heightToMax(value));
    }
    return new Constraints(this.minimum.heightToMax(value.minimum), this.preferred.heightToMax(value.preferred));
  }

  /**
   * @param {!Constraints|number} value
   * @return {!Constraints}
   */
  addHeight(value) {
    if (typeof value === 'number') {
      return new Constraints(this.minimum.addHeight(value), this.preferred.addHeight(value));
    }
    return new Constraints(this.minimum.addHeight(value.minimum), this.preferred.addHeight(value.preferred));
  }
}
