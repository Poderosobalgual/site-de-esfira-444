/* Ilustrações próprias em SVG (sem marcas, sem logotipos). */
(function (raiz) {
  'use strict';
  function esfiha(recheio) {
    return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<ellipse cx="100" cy="176" rx="74" ry="9" fill="#000" opacity=".12"/>' +
      '<circle cx="100" cy="98" r="84" fill="#C98A3B"/>' +
      '<circle cx="100" cy="98" r="78" fill="#E0A555"/>' +
      '<circle cx="100" cy="98" r="62" fill="#F1C27D" opacity=".55"/>' +
      '<circle cx="100" cy="98" r="58" fill="#8B4A2B"/>' + recheio +
      '<path d="M40 70 A70 70 0 0 1 100 28" stroke="#fff" stroke-width="5" fill="none" opacity=".35" stroke-linecap="round"/>' +
      '</svg>';
  }
  var carne = '<circle cx="100" cy="98" r="52" fill="#7A3B22"/>' +
    '<g fill="#5B2A17"><circle cx="78" cy="82" r="6"/><circle cx="112" cy="76" r="7"/><circle cx="124" cy="106" r="6"/><circle cx="92" cy="116" r="7"/><circle cx="70" cy="108" r="5"/></g>' +
    '<g fill="#3E8E41"><circle cx="100" cy="94" r="4"/><circle cx="84" cy="100" r="3"/><circle cx="118" cy="92" r="3"/><circle cx="104" cy="124" r="3"/></g>' +
    '<g fill="#C0392B"><circle cx="96" cy="76" r="5"/><circle cx="126" cy="94" r="4"/><circle cx="76" cy="124" r="4"/></g>';
  var queijo = '<circle cx="100" cy="98" r="52" fill="#FFE08A"/>' +
    '<g fill="#F7C948"><circle cx="82" cy="84" r="9"/><circle cx="116" cy="80" r="11"/><circle cx="122" cy="112" r="8"/><circle cx="90" cy="118" r="10"/></g>' +
    '<g fill="#FFF3C4"><circle cx="100" cy="98" r="7"/><circle cx="72" cy="106" r="5"/></g>' +
    '<g fill="#C0392B" opacity=".9"><circle cx="106" cy="66" r="4"/><circle cx="76" cy="90" r="3"/></g>';
  var calabresa = '<circle cx="100" cy="98" r="52" fill="#FFD27A"/>' +
    '<g fill="#B23A2B"><circle cx="82" cy="80" r="13"/><circle cx="118" cy="84" r="13"/><circle cx="100" cy="116" r="13"/></g>' +
    '<g fill="#8E2A1D"><circle cx="82" cy="80" r="4"/><circle cx="118" cy="84" r="4"/><circle cx="100" cy="116" r="4"/><circle cx="78" cy="84" r="2"/><circle cx="122" cy="80" r="2"/></g>' +
    '<g fill="#E8A33D"><circle cx="64" cy="104" r="5"/><circle cx="136" cy="108" r="5"/><circle cx="104" cy="62" r="5"/></g>' +
    '<g fill="#3E8E41"><circle cx="100" cy="94" r="3"/><circle cx="66" cy="90" r="3"/></g>';
  var bacon = '<circle cx="100" cy="98" r="52" fill="#FFD27A"/>' +
    '<g fill="#B23A2B"><circle cx="78" cy="82" r="12"/><circle cx="122" cy="88" r="12"/></g>' +
    '<g fill="#8E2A1D"><circle cx="78" cy="82" r="4"/><circle cx="122" cy="88" r="4"/></g>' +
    '<g fill="none" stroke-width="7" stroke-linecap="round"><path d="M64 118 Q78 106 92 118 T120 118" stroke="#C2543A"/><path d="M64 118 Q78 106 92 118 T120 118" stroke="#F1B7A3" stroke-width="3"/>' +
    '<path d="M90 66 Q104 54 118 66 T142 66" stroke="#C2543A"/><path d="M90 66 Q104 54 118 66 T142 66" stroke="#F1B7A3" stroke-width="3"/></g>' +
    '<g fill="#3E8E41"><circle cx="100" cy="98" r="3"/><circle cx="130" cy="112" r="3"/></g>';
  function lata(cor, escura, faixa) {
    return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<ellipse cx="100" cy="184" rx="42" ry="7" fill="#000" opacity=".14"/>' +
      '<rect x="56" y="30" width="88" height="148" rx="14" fill="' + cor + '"/>' +
      '<rect x="56" y="30" width="30" height="148" rx="14" fill="#fff" opacity=".18"/>' +
      '<rect x="56" y="82" width="88" height="46" fill="' + faixa + '"/>' +
      '<path d="M56 100 Q78 84 100 100 T144 100 L144 118 Q122 134 100 118 T56 118 Z" fill="' + escura + '" opacity=".55"/>' +
      '<ellipse cx="100" cy="30" rx="44" ry="9" fill="#C9CED3"/><ellipse cx="100" cy="30" rx="34" ry="6" fill="#9AA1A8"/>' +
      '<rect x="92" y="25" width="16" height="6" rx="3" fill="#E5E8EB"/>' +
      '<ellipse cx="100" cy="178" rx="44" ry="8" fill="' + escura + '"/></svg>';
  }
  raiz.TotemArt = {
    carne: esfiha(carne), queijo: esfiha(queijo), calabresa: esfiha(calabresa), bacon: esfiha(bacon),
    coca: lata('#C62828', '#8E1B1B', '#B71C1C'), guarana: lata('#2E7D32', '#1B5E20', '#256B29'),
    logo: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="32" cy="32" r="28" fill="#C98A3B"/><circle cx="32" cy="32" r="22" fill="#8B4A2B"/><circle cx="32" cy="32" r="17" fill="#2E7D32"/><circle cx="26" cy="28" r="4" fill="#F5EFE6"/><circle cx="38" cy="30" r="4" fill="#F5EFE6"/><circle cx="32" cy="40" r="4" fill="#F5EFE6"/></svg>'
  };
})(typeof window !== 'undefined' ? window : globalThis);
