/* Serviços do totem: configuração, pagamento (real e simulado), impressora e tela de cima. */
(function (raiz) {
  'use strict';
  var ST = {
    AGUARDANDO: 'aguardando_cartao', PROCESSANDO: 'processando', APROVADO: 'aprovado',
    RECUSADO: 'recusado', CANCELADO: 'cancelado', EXPIRADO: 'expirado'
  };

  /* ---------- Configuração (menu técnico; nada disso fica no código) ---------- */
  var PADRAO = {
    pixChave: '', pixNome: 'Emmanuel', pixCidade: 'Curitiba', pixModo: 'automatico', pinAtendente: '1234', pinTecnico: '0000',
    backendUrl: '', backendChave: '', maquininhaId: '', papel: '80', som: false
  };
  function criarConfig(storage) {
    var CH = 'totem.config';
    function ler() {
      var c = {}, k, salvo = {};
      try { salvo = JSON.parse(storage.getItem(CH)) || {}; } catch (e) { salvo = {}; }
      for (k in PADRAO) c[k] = (salvo[k] !== undefined) ? salvo[k] : PADRAO[k];
      return c;
    }
    return {
      ler: ler,
      salvar: function (parcial) { var c = ler(), k; for (k in parcial) c[k] = parcial[k]; storage.setItem(CH, JSON.stringify(c)); return c; }
    };
  }

  /* ---------- PaymentService real (chama o backend) ---------- */
  function criarPagamentoReal(getCfg) {
    function req(metodo, caminho, corpo) {
      var c = getCfg();
      if (!c.backendUrl) return Promise.reject(new Error('sem_backend'));
      return fetch(c.backendUrl.replace(/\/$/, '') + caminho, {
        method: metodo,
        headers: { 'Content-Type': 'application/json', 'X-Chave-Totem': c.backendChave },
        body: corpo ? JSON.stringify(corpo) : undefined
      }).then(function (r) {
        if (!r.ok) throw new Error('http_' + r.status);
        return r.json();
      });
    }
    return {
      nome: 'real',
      iniciar: function (p) { return req('POST', '/pagamentos', { pedidoId: p.pedidoId, itens: p.itens, cupom: p.cupom || null, tipo: p.tipo }); },
      consultar: function (id) { return req('GET', '/pagamentos/' + encodeURIComponent(id)).then(function (r) { return r.status; }); },
      cancelar: function (id) { return req('POST', '/pagamentos/' + encodeURIComponent(id) + '/cancelar'); },
      saude: function () { return req('GET', '/saude').then(function () { return true; }, function () { return false; }); }
    };
  }

  /* ---------- PaymentService simulado (?demo=1) ---------- */
  function criarPagamentoSimulado(calcularValor) {
    var pagamentos = {}, seq = 0;
    return {
      nome: 'simulado',
      iniciar: function (p) {
        seq += 1;
        var id = 'sim-' + seq + '-' + p.pedidoId;
        pagamentos[id] = { status: ST.AGUARDANDO, valor: calcularValor(p) };
        return Promise.resolve({ pagamentoId: id, valor: pagamentos[id].valor });
      },
      consultar: function (id) { return Promise.resolve(pagamentos[id] ? pagamentos[id].status : ST.EXPIRADO); },
      cancelar: function (id) { if (pagamentos[id] && pagamentos[id].status === ST.AGUARDANDO) pagamentos[id].status = ST.CANCELADO; return Promise.resolve({ ok: true }); },
      saude: function () { return Promise.resolve(true); },
      simular: function (id, status) { if (pagamentos[id]) pagamentos[id].status = status; }
    };
  }

  /* ---------- Controlador de pagamento: espera, consulta a cada 2s, limite de 120s ---------- */
  function acompanhar(servico, pagamentoId, aoStatus, opcoes) {
    opcoes = opcoes || {};
    var intervalo = opcoes.intervalo || 2000, limite = opcoes.limite || 120000, inicio = Date.now(), parado = false, timer = null;
    function final(s) { return s === ST.APROVADO || s === ST.RECUSADO || s === ST.CANCELADO || s === ST.EXPIRADO; }
    function passo() {
      if (parado) return;
      if (Date.now() - inicio >= limite) { parado = true; servico.cancelar(pagamentoId).then(null, function () {}); aoStatus(ST.EXPIRADO); return; }
      servico.consultar(pagamentoId).then(function (s) {
        if (parado) return;
        aoStatus(s);
        if (final(s)) { parado = true; return; }
        timer = setTimeout(passo, intervalo);
      }, function () { if (!parado) { aoStatus('erro_rede'); timer = setTimeout(passo, intervalo); } });
    }
    passo();
    return { parar: function () { parado = true; if (timer) clearTimeout(timer); } };
  }

  /* ---------- Impressora (SunmiBridge ou simulada) ---------- */
  var pendentesImpressao = {};
  raiz.__totemImpressaoResultado = function (id, json) {
    var r = {}; try { r = typeof json === 'string' ? JSON.parse(json) : json; } catch (e) { r = { ok: false, erro: 'resposta_invalida' }; }
    if (pendentesImpressao[id]) { pendentesImpressao[id](r); delete pendentesImpressao[id]; }
  };
  function criarImpressora(storage) {
    return {
      temPonte: function () { return !!(raiz.SunmiBridge && raiz.SunmiBridge.imprimirFila); },
      imprimir: function (job) {
        if (raiz.SunmiBridge && raiz.SunmiBridge.imprimirFila) {
          return new Promise(function (resolve) {
            var fim = false;
            function ok(r) { if (!fim) { fim = true; resolve(r); } }
            pendentesImpressao[job.id] = ok;
            setTimeout(function () { if (pendentesImpressao[job.id]) { delete pendentesImpressao[job.id]; ok({ ok: false, erro: 'tempo_esgotado' }); } }, 20000);
            try { raiz.SunmiBridge.imprimirFila(JSON.stringify(job)); } catch (e) { delete pendentesImpressao[job.id]; ok({ ok: false, erro: String(e) }); }
          });
        }
        /* simulada: guarda o que seria impresso; a falha pode ser forçada no teste */
        var falha = false; try { falha = storage.getItem('totem.demo.impressoraFalha') === '1'; } catch (e) { falha = false; }
        if (falha) return Promise.resolve({ ok: false, erro: 'sem_papel' });
        raiz.__impressos = raiz.__impressos || [];
        raiz.__impressos.push(job);
        if (typeof console !== 'undefined') console.log('[impressão simulada]', job.id, job.vias.map(function (v) { return v.map(function (l) { return l.t; }).join('\n'); }).join('\n=== corte ===\n'));
        return Promise.resolve({ ok: true });
      }
    };
  }

  /* ---------- Tela de cima ---------- */
  var CANAL = 'totem-cliente';
  function criarTelaCliente() {
    var bc = null, ultimo = '';
    try { if (raiz.BroadcastChannel) bc = new raiz.BroadcastChannel(CANAL); } catch (e) { bc = null; }
    return {
      enviar: function (estado) {
        var s = JSON.stringify(estado);
        if (s === ultimo) return; /* só quando muda */
        ultimo = s;
        if (raiz.SunmiBridge && raiz.SunmiBridge.telaCliente) { try { raiz.SunmiBridge.telaCliente(s); } catch (e) {} }
        if (bc) bc.postMessage(estado);
        try { raiz.localStorage.setItem('totem.telaCliente', s + '|' + Date.now()); } catch (e) {}
      },
      reenviar: function () { ultimo = ''; }
    };
  }
  function ouvirTelaCliente(aoReceber) {
    var bc = null;
    try { if (raiz.BroadcastChannel) { bc = new raiz.BroadcastChannel(CANAL); bc.onmessage = function (e) { aoReceber(e.data); }; } } catch (e) { bc = null; }
    raiz.addEventListener('storage', function (e) {
      if (e.key === 'totem.telaCliente' && e.newValue) { try { aoReceber(JSON.parse(e.newValue.split('|')[0])); } catch (x) {} }
    });
    /* usado pelo Android: evaluateJavascript("window.receberEstado('...')") */
    raiz.receberEstado = function (json) { try { aoReceber(typeof json === 'string' ? JSON.parse(json) : json); } catch (e) {} };
  }

  raiz.TotemServicos = {
    ST: ST, PADRAO: PADRAO, criarConfig: criarConfig, criarPagamentoReal: criarPagamentoReal, criarPagamentoSimulado: criarPagamentoSimulado,
    acompanhar: acompanhar, criarImpressora: criarImpressora, criarTelaCliente: criarTelaCliente, ouvirTelaCliente: ouvirTelaCliente
  };
  if (typeof module !== 'undefined') module.exports = raiz.TotemServicos;
})(typeof window !== 'undefined' ? window : globalThis);
