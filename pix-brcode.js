/* Gera o "Pix copia e cola" (BR Code estático) com valor. Funciona offline, sem internet e sem biblioteca.
 * Compatível com navegadores antigos (ES5): serve para o WebView do SUNMI D2 Mini (Android 8.1). */
(function (raiz) {
  function semAcento(s) { return String(s).normalize ? String(s).normalize('NFD').replace(/[̀-ͯ]/g, '') : String(s); }
  function campo(id, valor) { var n = String(valor.length); if (n.length < 2) n = '0' + n; return id + n + valor; }
  function crc16(texto) { // CRC16/CCITT-FALSE
    var crc = 0xFFFF, i, j;
    for (i = 0; i < texto.length; i++) {
      crc ^= texto.charCodeAt(i) << 8;
      for (j = 0; j < 8; j++) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
    }
    var h = crc.toString(16).toUpperCase(); while (h.length < 4) h = '0' + h; return h;
  }
  /* chave: CPF/CNPJ (só números), e-mail, telefone (+55...) ou chave aleatória. */
  function gerarPix(o) {
    var nome = semAcento(o.nome).replace(/[^A-Za-z0-9 ]/g, '').toUpperCase().substr(0, 25);
    var cidade = semAcento(o.cidade).replace(/[^A-Za-z0-9 ]/g, '').toUpperCase().substr(0, 15);
    var txid = String(o.txid || '***').replace(/[^A-Za-z0-9]/g, '').substr(0, 25) || '***';
    var valor = Number(o.valor);
    if (!(valor > 0) || valor > 99999999) throw new Error('valor inválido');
    var conta = campo('00', 'br.gov.bcb.pix') + campo('01', String(o.chave).trim());
    var corpo = campo('00', '01') + campo('01', '12') + campo('26', conta) + campo('52', '0000') + campo('53', '986') +
      campo('54', valor.toFixed(2)) + campo('58', 'BR') + campo('59', nome) + campo('60', cidade) + campo('62', campo('05', txid)) + '6304';
    return corpo + crc16(corpo);
  }
  raiz.PixBR = { gerarPix: gerarPix, crc16: crc16 };
  if (typeof module !== 'undefined') module.exports = raiz.PixBR;
})(typeof window !== 'undefined' ? window : globalThis);
