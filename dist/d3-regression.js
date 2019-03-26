// https://github.com/HarryStevens/d3-regression#readme Version 0.0.5. Copyright 2019 Harry Stevens.
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.d3 = global.d3 || {}));
}(this, function (exports) { 'use strict';

  function x(d) {
    return d[0];
  }
  function y(d) {
    return d[1];
  }

  function linear () {
    var x$1 = x,
        y$1 = y,
        domain;

    function linear(data) {
      var n = data.length;
      var xSum = 0,
          ySum = 0,
          xySum = 0,
          x2Sum = 0,
          minX = domain ? +domain[0] : Infinity,
          maxX = domain ? +domain[1] : -Infinity;

      for (var i = 0; i < n; i++) {
        var dx = x$1(data[i]);
        var dy = y$1(data[i]);
        xSum += dx;
        ySum += dy;
        xySum += dx * dy;
        x2Sum += dx * dx;

        if (!domain) {
          if (dx < minX) minX = dx;
          if (dx > maxX) maxX = dx;
        }
      }

      var a = n * xySum,
          b = xSum * ySum,
          c = n * x2Sum,
          d = xSum * xSum,
          slope = (a - b) / (c - d),
          e = ySum,
          f = slope * xSum,
          intercept = (e - f) / n;
      var out = [[minX, minX * slope + intercept], [maxX, maxX * slope + intercept]];
      out.slope = slope;
      out.intercept = intercept;
      return out;
    }

    linear.domain = function (arr) {
      return arguments.length ? (domain = arr, linear) : domain;
    };

    linear.x = function (fn) {
      return arguments.length ? (x$1 = fn, linear) : x$1;
    };

    linear.y = function (fn) {
      return arguments.length ? (y$1 = fn, linear) : y$1;
    };

    return linear;
  }

  // Returns the medium value of an array of numbers.
  function median(arr) {
    arr.sort(function (a, b) {
      return a - b;
    });
    var i = arr.length / 2;
    return i % 1 === 0 ? (arr[i - 1] + arr[i]) / 2 : arr[Math.floor(i)];
  }

  // Source: https://github.com/jasondavies/science.js/blob/master/src/stats/loess.js
  // License: https://github.com/jasondavies/science.js/blob/master/LICENSE

  function loess () {
    var x$1 = x,
        y$1 = y,
        bandwidth = .3,
        robustnessIters = 2,
        accuracy = 1e-12;

    function loess(data) {
      var n = data.length;
      var xval = [],
          yval = [],
          weights = [];

      for (var i = 0; i < n; i++) {
        weights[i] = 1;
        var d = data[i];
        xval[i] = x$1(d);
        yval[i] = y$1(d);
      }

      finiteReal(xval);
      finiteReal(yval);
      finiteReal(weights);
      strictlyIncreasing(xval);
      var bandwidthInPoints = Math.floor(bandwidth * n);
      if (bandwidthInPoints < 2) throw {
        error: "Bandwidth too small."
      };
      var res = [],
          residuals = [],
          robustnessWeights = [];

      for (var _i = 0; _i < n; _i++) {
        res[_i] = 0;
        residuals[_i] = 0;
        robustnessWeights[_i] = 1;
      }

      var iter = -1;

      while (++iter <= robustnessIters) {
        var bandwidthInterval = [0, bandwidthInPoints - 1];
        var dx = void 0;

        for (var _i2 = 0; _i2 < n; _i2++) {
          dx = xval[_i2];

          if (_i2 > 0) {
            updateBandwidthInterval(xval, weights, _i2, bandwidthInterval);
          }

          var ileft = bandwidthInterval[0],
              iright = bandwidthInterval[1];
          var edge = xval[_i2] - xval[ileft] > xval[iright] - xval[_i2] ? ileft : iright;
          var sumWeights = 0,
              sumX = 0,
              sumXSquared = 0,
              sumY = 0,
              sumXY = 0,
              denom = Math.abs(1 / (xval[edge] - dx));

          for (var k = ileft; k <= iright; ++k) {
            var xk = xval[k],
                yk = yval[k],
                dist = k < _i2 ? dx - xk : xk - dx,
                _w = tricube(dist * denom) * robustnessWeights[k] * weights[k],
                xkw = xk * _w;

            sumWeights += _w;
            sumX += xkw;
            sumXSquared += xk * xkw;
            sumY += yk * _w;
            sumXY += yk * xkw;
          }

          var meanX = sumX / sumWeights,
              meanY = sumY / sumWeights,
              meanXY = sumXY / sumWeights,
              meanXSquared = sumXSquared / sumWeights,
              beta = Math.sqrt(Math.abs(meanXSquared - meanX * meanX)) < accuracy ? 0 : (meanXY - meanX * meanY) / (meanXSquared - meanX * meanX),
              alpha = meanY - beta * meanX;
          res[_i2] = beta * dx + alpha;
          residuals[_i2] = Math.abs(yval[_i2] - res[_i2]);
        }

        if (iter === robustnessIters) {
          break;
        }

        var medianResidual = median(residuals);

        if (Math.abs(medianResidual) < accuracy) {
          break;
        }

        var arg = void 0,
            w = void 0;

        for (var _i3 = 0; _i3 < n; _i3++) {
          arg = residuals[_i3] / (6 * medianResidual);
          robustnessWeights[_i3] = arg >= 1 ? 0 : (w = 1 - arg * arg) * w;
        }
      }

      return res.map(function (d, i) {
        return [xval[i], d];
      });
    }

    loess.bandwidth = function (n) {
      return arguments.length ? (bandwidth = n, loess) : bandwidth;
    };

    loess.x = function (fn) {
      return arguments.length ? (x$1 = fn, loess) : x$1;
    };

    loess.y = function (fn) {
      return arguments.length ? (y$1 = fn, loess) : y$1;
    };

    return loess;
  }

  function finiteReal(values) {
    for (var i = 0, n = values.length; i < n; i++) {
      if (!isFinite(values[i])) return false;
    }

    return true;
  }

  function strictlyIncreasing(xval) {
    for (var i = 0, n = xval.length; i < n; i++) {
      if (xval[i - 1] >= xval[i]) return false;
    }

    return true;
  }

  function tricube(x) {
    return (x = 1 - x * x * x) * x * x;
  }

  function updateBandwidthInterval(xval, weights, i, bandwidthInterval) {
    var left = bandwidthInterval[0],
        right = bandwidthInterval[1],
        nextRight = nextNonzero(weights, right);

    if (nextRight < xval.length && xval[nextRight] - xval[i] < xval[i] - xval[left]) {
      var nextLeft = nextNonzero(weights, left);
      bandwidthInterval[0] = nextLeft;
      bandwidthInterval[1] = nextRight;
    }
  }

  function nextNonzero(weights, i) {
    var j = i + 1;

    while (j < weights.length && weights[j] === 0) {
      j++;
    }

    return j;
  }

  function quadratic () {
    var x$1 = x,
        y$1 = y,
        domain;

    function quadratic(data) {
      var n = data.length;
      var xSum = 0,
          ySum = 0,
          x2Sum = 0,
          x3Sum = 0,
          x4Sum = 0,
          xySum = 0,
          x2ySum = 0,
          xValues = [];

      for (var i = 0; i < n; i++) {
        var d = data[i],
            xVal = x$1(d),
            yVal = y$1(d),
            x2Val = Math.pow(xVal, 2);
        xSum += xVal;
        ySum += yVal;
        x2Sum += x2Val;
        x3Sum += Math.pow(xVal, 3);
        x4Sum += Math.pow(xVal, 4);
        xySum += xVal * yVal;
        x2ySum += x2Val * yVal;
        xValues.push(xVal);
      }

      var sumXX = x2Sum - Math.pow(xSum, 2) / n,
          sumXY = xySum - xSum * ySum / n,
          sumXX2 = x3Sum - x2Sum * xSum / n,
          sumX2Y = x2ySum - x2Sum * ySum / n,
          sumX2X2 = x4Sum - Math.pow(x2Sum, 2) / n,
          a = (sumX2Y * sumXX - sumXY * sumXX2) / (sumXX * sumX2X2 - Math.pow(sumXX2, 2)),
          b = (sumXY * sumX2X2 - sumX2Y * sumXX2) / (sumXX * sumX2X2 - Math.pow(sumXX2, 2)),
          c = ySum / n - b * (xSum / n) - a * (x2Sum / n),
          fn = function fn(x) {
        return a * Math.pow(x, 2) + b * x + c;
      },
          rSquared = 1 - Math.pow(ySum - a * x2Sum - b * xSum - c, 2) / Math.pow(ySum - ySum / n, 2);

      if (domain) {
        xValues.unshift(domain[0]);
        xValues.push(domain[1]);
      }

      var out = [];

      for (var _i = 0, l = xValues.length; _i < l; _i++) {
        var _d = xValues[_i];
        out.push([_d, fn(_d)]);
      }

      out.a = a;
      out.b = b;
      out.c = c;
      out.rSquared = rSquared;
      return out;
    }

    quadratic.domain = function (arr) {
      return arguments.length ? (domain = arr, quadratic) : domain;
    };

    quadratic.x = function (fn) {
      return arguments.length ? (x$1 = fn, quadratic) : x$1;
    };

    quadratic.y = function (fn) {
      return arguments.length ? (y$1 = fn, quadratic) : y$1;
    };

    return quadratic;
  }

  exports.regressionLinear = linear;
  exports.regressionLoess = loess;
  exports.regressionQuadratic = quadratic;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
