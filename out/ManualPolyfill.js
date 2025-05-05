// ==== patch Math.pow ====
window.OldMath_pow = Math.pow;

Math.pow = (function (base, exponent) {
  return base ** exponent;
}).bind(Math);

