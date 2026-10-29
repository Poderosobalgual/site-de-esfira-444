/* Núcleo do totem: regras puras, sem DOM, para rodar no navegador e nos testes (Node).
 * Valores em CENTAVOS (inteiros) para nunca errar arredondamento. */
(function (raiz) {
  'use strict';

  /* ---------- SHA-256 em JS puro (síncrono; não depende de crypto.subtle) ---------- */
  var K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  function utf8Bytes(s) {
    var out = [], i, c;
    s = unescape(encodeURIComponent(String(s)));
    for (i = 0; i < s.length; i++) { c = s.charCodeAt(i); out.push(c); }
    return out;
  }
  function sha256(str) {
    var bytes = utf8Bytes(str), l = bytes.length, i, j;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    var hi = Math.floor(l * 8 / 0x100000000), lo = (l * 8) >>> 0;
    bytes.push((hi >>> 24) & 255, (hi >>> 16) & 255, (hi >>> 8) & 255, hi & 255,
      (lo >>> 24) & 255, (lo >>> 16) & 255, (lo >>> 8) & 255, lo & 255);
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }
    for (i = 0; i < bytes.length; i += 64) {
      var w = new Array(64);
      for (j = 0; j < 16; j++) w[j] = (bytes[i + 4 * j] << 24) | (bytes[i + 4 * j + 1] << 16) | (bytes[i + 4 * j + 2] << 8) | bytes[i + 4 * j + 3];
      for (j = 16; j < 64; j++) {
        var s0 = rotr(w[j - 15], 7) ^ rotr(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        var s1 = rotr(w[j - 2], 17) ^ rotr(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (j = 0; j < 64; j++) {
        var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        var ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K[j] + w[j]) | 0;
        var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        var mj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + mj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    var hex = '';
    for (i = 0; i < 8; i++) hex += ('00000000' + (H[i] >>> 0).toString(16)).slice(-8);
    return hex;
  }

  /* ---------- Cupom (só o hash fica no app) ---------- */
  var HASH_CUPOM = '75d6ccd19ef27ce8adbf15b8a0cd4bb72f8bc67ff12cffec30cacd64cc16a39d';
  var PERCENTUAL_CUPOM = 10;
  function normalizarCupom(t) { return String(t || '').replace(/\s+/g, '').toUpperCase(); }
  function cupomValido(t) { var n = normalizarCupom(t); return n.length > 0 && sha256(n) === HASH_CUPOM; }

  /* ---------- Totais ---------- */
  function paraCentavos(reais) { return Math.round(Number(reais) * 100); }
  /* qtds: {id: quantidade}; itens: lista do cardapio.json. */
  function calcular(itens, qtds, comCupom) {
    var subtotal = 0, linhas = [], i, it, q;
    for (i = 0; i < itens.length; i++) {
      it = itens[i]; q = qtds[it.id] | 0;
      if (q > 0) { linhas.push({ id: it.id, qtd: q, unit: paraCentavos(it.preco), total: paraCentavos(it.preco) * q }); subtotal += paraCentavos(it.preco) * q; }
    }
    var desconto = comCupom ? Math.round(subtotal * PERCENTUAL_CUPOM / 100) : 0;
    return { linhas: linhas, subtotal: subtotal, desconto: desconto, total: subtotal - desconto, qtdTotal: linhas.reduce(function (a, l) { return a + l.qtd; }, 0) };
  }
  function moeda(centavos) {
    var neg = centavos < 0; if (neg) centavos = -centavos;
    var r = Math.floor(centavos / 100), c = centavos % 100;
    return (neg ? '-' : '') + 'R$ ' + r + ',' + (c < 10 ? '0' : '') + c;
  }

  /* ---------- Nome ---------- */
  function formatarNome(t) {
    var s = String(t || '').replace(/[^A-Za-zÀ-ÿ]/g, '').substr(0, 12);
    return s.length ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
  }
  function nomeValido(t) { return formatarNome(t).length >= 2; }

  /* ---------- Senha sequencial por dia (guardada no aparelho) ---------- */
  function chaveDia(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function proximaSenha(storage, agora) {
    var dia = chaveDia(agora), reg = null;
    try { reg = JSON.parse(storage.getItem('totem.senha')); } catch (e) { reg = null; }
    if (!reg || reg.dia !== dia) reg = { dia: dia, n: 0 };
    reg.n += 1;
    storage.setItem('totem.senha', JSON.stringify(reg));
    return 'R' + reg.n;
  }
  /* Mostra qual será a próxima senha SEM consumir o número (usada como txid do Pix antes de pagar). */
  function espiarSenha(storage, agora) {
    var dia = chaveDia(agora), reg = null;
    try { reg = JSON.parse(storage.getItem('totem.senha')); } catch (e) { reg = null; }
    if (!reg || reg.dia !== dia) reg = { dia: dia, n: 0 };
    return 'R' + (reg.n + 1);
  }
  function reiniciarSenha(storage) { storage.removeItem('totem.senha'); }

  /* ---------- Fila de impressão persistente ---------- */
  /* impressora.imprimir(job) -> Promise<{ok, erro}>. Nunca perde um pedido pago: o job só sai da fila quando imprime. */
  function criarFilaImpressao(storage, impressora) {
    var CH = 'totem.filaImpressao', ocupada = false;
    function ler() { try { return JSON.parse(storage.getItem(CH)) || []; } catch (e) { return []; } }
    function gravar(l) { storage.setItem(CH, JSON.stringify(l)); }
    var fila = {
      pendentes: function () { return ler(); },
      enfileirar: function (job) { var l = ler(); l.push(job); gravar(l); return fila.processar(); },
      processar: function () {
        if (ocupada) return Promise.resolve({ ok: true, ocupada: true });
        ocupada = true;
        function proximo() {
          var l = ler();
          if (!l.length) { ocupada = false; return Promise.resolve({ ok: true }); }
          return Promise.resolve(impressora.imprimir(l[0])).then(function (r) {
            if (r && r.ok) { var atual = ler(); atual.shift(); gravar(atual); return proximo(); }
            ocupada = false; return { ok: false, erro: (r && r.erro) || 'erro' };
          }, function (e) { ocupada = false; return { ok: false, erro: String(e) }; });
        }
        return proximo();
      }
    };
    return fila;
  }

  /* ---------- Estados da tela de cima ---------- */
  /* Recebe mensagens da tela principal e devolve o estado a desenhar. Os tempos de volta para ESPERA
   * (5s erro/cancelado, 10s aprovado) usam o agendador injetado, para testar sem esperar. */
  var ESTADOS = { ESPERA: 'espera', PEDIDO: 'pedido', PAGAMENTO: 'pagamento', APROVADO: 'aprovado', ERRO: 'erro', CANCELADO: 'cancelado' };
  function criarMaquinaCliente(aoMudar, agendar, cancelarAgenda) {
    agendar = agendar || function (f, ms) { return setTimeout(f, ms); };
    cancelarAgenda = cancelarAgenda || function (t) { clearTimeout(t); };
    var atual = { estado: ESTADOS.ESPERA }, timer = null;
    function aplicar(msg) {
      if (timer) { cancelarAgenda(timer); timer = null; }
      atual = msg;
      aoMudar(atual);
      var ms = msg.estado === ESTADOS.APROVADO ? 10000 : (msg.estado === ESTADOS.ERRO || msg.estado === ESTADOS.CANCELADO) ? 5000 : 0;
      if (ms) timer = agendar(function () { timer = null; atual = { estado: ESTADOS.ESPERA }; aoMudar(atual); }, ms);
    }
    return {
      receber: function (msg) {
        if (!msg || !msg.estado) msg = { estado: ESTADOS.ESPERA };
        if (JSON.stringify(msg) === JSON.stringify(atual) && !timer) return; /* só quando muda */
        aplicar(msg);
      },
      atual: function () { return atual; }
    };
  }

  /* ---------- Textos dos comprovantes (sem DOM) ---------- */
  function textoComprovante(p, largura) {
    largura = largura || 32;
    function pad(a, b) { var esp = largura - a.length - b.length; return a + new Array(Math.max(esp, 1) + 1).join(' ') + b; }
    var L = [], i;
    L.push({ t: p.restaurante, a: 'c', b: true, s: 2 });
    L.push({ t: p.dataHora, a: 'c', s: 1 });
    L.push({ t: '', s: 1 });
    L.push({ t: p.nome + ' ' + p.senha, a: 'c', b: true, s: 3 });
    L.push({ t: p.local, a: 'c', s: 1 });
    L.push({ t: new Array(largura + 1).join('-'), s: 1 });
    for (i = 0; i < p.linhas.length; i++) L.push({ t: pad(p.linhas[i].qtd + 'x ' + p.linhas[i].nome, moeda(p.linhas[i].total)), s: 1 });
    L.push({ t: new Array(largura + 1).join('-'), s: 1 });
    if (p.desconto > 0) L.push({ t: pad('Desconto (10%)', '-' + moeda(p.desconto)), s: 1 });
    L.push({ t: pad('TOTAL', moeda(p.total)), b: true, s: 2 });
    L.push({ t: 'Pago: ' + p.forma, s: 1 });
    return L;
  }
  function textoProducao(p) {
    var L = [], i;
    L.push({ t: p.nome + ' ' + p.senha, a: 'c', b: true, s: 3 });
    L.push({ t: p.local, a: 'c', b: true, s: 2 });
    L.push({ t: '', s: 1 });
    for (i = 0; i < p.linhas.length; i++) L.push({ t: p.linhas[i].qtd + 'x ' + p.linhas[i].nome, b: true, s: 2 });
    L.push({ t: p.dataHora, a: 'c', s: 1 });
    return L;
  }

  raiz.TotemCore = {
    sha256: sha256, HASH_CUPOM: HASH_CUPOM, PERCENTUAL_CUPOM: PERCENTUAL_CUPOM, normalizarCupom: normalizarCupom, cupomValido: cupomValido,
    calcular: calcular, moeda: moeda, paraCentavos: paraCentavos, formatarNome: formatarNome, nomeValido: nomeValido,
    chaveDia: chaveDia, proximaSenha: proximaSenha, espiarSenha: espiarSenha, reiniciarSenha: reiniciarSenha,
    criarFilaImpressao: criarFilaImpressao, ESTADOS: ESTADOS, criarMaquinaCliente: criarMaquinaCliente,
    textoComprovante: textoComprovante, textoProducao: textoProducao
  };
  if (typeof module !== 'undefined') module.exports = raiz.TotemCore;
})(typeof window !== 'undefined' ? window : globalThis);
