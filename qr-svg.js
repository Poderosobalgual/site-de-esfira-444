/* Desenha o QR Code como SVG, usando a biblioteca local qrcode-generator (js/qrcode.js). Sem CDN. */
(function (raiz) {
  'use strict';
  function qrSvg(texto) {
    var qr = raiz.qrcode(0, 'M');
    qr.addData(String(texto));
    qr.make();
    var n = qr.getModuleCount(), margem = 2, tam = n + margem * 2, d = '', r, c;
    for (r = 0; r < n; r++) {
      for (c = 0; c < n; c++) {
        if (qr.isDark(r, c)) d += 'M' + (c + margem) + ' ' + (r + margem) + 'h1v1h-1z';
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + tam + ' ' + tam + '" shape-rendering="crispEdges" role="img" aria-label="QR Code Pix">' +
      '<rect width="' + tam + '" height="' + tam + '" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
  }
  raiz.qrSvg = qrSvg;
  if (typeof module !== 'undefined') module.exports = qrSvg;
})(typeof window !== 'undefined' ? window : globalThis);
