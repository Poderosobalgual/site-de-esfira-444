/* Totem Casa da Esfiha — tela principal. ES2017, sem bibliotecas. */
(function () {
  'use strict';
  var Core = window.TotemCore, I = window.I18N, Sv = window.TotemServicos, Art = window.TotemArt, ST = Sv.ST;

  /* ---------- ambiente ---------- */
  var demo = /[?&]demo=1/.test(location.search);
  var memoria = {};
  var storage = (function () {
    try { var t = '__t'; window.localStorage.setItem(t, '1'); window.localStorage.removeItem(t); return window.localStorage; }
    catch (e) { return { getItem: function (k) { return memoria.hasOwnProperty(k) ? memoria[k] : null; }, setItem: function (k, v) { memoria[k] = String(v); }, removeItem: function (k) { delete memoria[k]; } }; }
  })();
  function $(id) { return document.getElementById(id); }
  function T(k) { return I.t(k); }
  var cfgSvc = Sv.criarConfig(storage);
  function cfg() { return cfgSvc.ler(); }

  /* Cardápio de reserva: só é usado se o cardapio.json não puder ser lido (ex.: abrir o arquivo direto, sem servidor). */
  var CARDAPIO_RESERVA = { restaurante: 'Casa da Esfiha', itens: [
    { id: 'carne', grupo: 'esfihas', nome: { pt: 'Esfiha de Carne', en: 'Beef Esfiha', es: 'Esfiha de Carne' }, preco: 6.5 },
    { id: 'queijo', grupo: 'esfihas', nome: { pt: 'Esfiha de Queijo', en: 'Cheese Esfiha', es: 'Esfiha de Queso' }, preco: 6.5 },
    { id: 'calabresa', grupo: 'esfihas', nome: { pt: 'Esfiha de Calabresa', en: 'Sausage Esfiha', es: 'Esfiha de Chorizo' }, preco: 6.5 },
    { id: 'bacon', grupo: 'esfihas', nome: { pt: 'Esfiha de Calabresa com Bacon', en: 'Sausage & Bacon Esfiha', es: 'Esfiha de Chorizo con Tocino' }, preco: 7.5 },
    { id: 'coca', grupo: 'bebidas', nome: { pt: 'Coca-Cola (lata 350 ml)', en: 'Coca-Cola (350 ml can)', es: 'Coca-Cola (lata 350 ml)' }, preco: 6 },
    { id: 'guarana', grupo: 'bebidas', nome: { pt: 'Guaraná (lata 350 ml)', en: 'Guaraná (350 ml can)', es: 'Guaraná (lata 350 ml)' }, preco: 6 } ] };
  function carregarCardapio(cb) {
    var x = new XMLHttpRequest();
    x.open('GET', 'cardapio.json?t=' + Date.now());
    x.onload = function () { try { cb(JSON.parse(x.responseText)); } catch (e) { cb(CARDAPIO_RESERVA); } };
    x.onerror = function () { cb(CARDAPIO_RESERVA); };
    try { x.send(); } catch (e) { cb(CARDAPIO_RESERVA); }
  }

  /* ---------- estado ---------- */
  var menu = null;
  var S = null;
  function novoEstado() {
    return { tela: 'atracao', local: '', qtds: {}, cupomOk: false, cupomTexto: '', nome: '', pedidoId: '', senhaReservada: '',
      pixTexto: '', pixSvg: '', pg: null, calc: null, ultimoPedido: null };
  }
  S = novoEstado();
  var serv = demo ? Sv.criarPagamentoSimulado(function (p) {
    var c = Core.calcular(menu.itens, qtdsDeLista(p.itens), p.cupom ? Core.cupomValido(p.cupom) : false); return c.total;
  }) : Sv.criarPagamentoReal(cfg);
  var impressora = Sv.criarImpressora(storage);
  var fila = Core.criarFilaImpressao(storage, impressora);
  var telaCima = Sv.criarTelaCliente();
  function qtdsDeLista(l) { var o = {}; (l || []).forEach(function (i) { o[i.id] = i.qtd; }); return o; }

  /* ---------- escala (1rem = 16px em 1280x800) e modo cadeirante ---------- */
  var acess = { contraste: false, letra: false, cadeirante: false, dalt: false, voz: false, som: false };
  try { var a0 = JSON.parse(storage.getItem('totem.acess')); if (a0) for (var k0 in acess) if (a0[k0] !== undefined) acess[k0] = a0[k0]; } catch (e) {}
  function layout() {
    var W = window.innerWidth, H = window.innerHeight, ph = acess.cadeirante ? Math.floor(H / 2) : H;
    var p = $('palco');
    p.style.width = W + 'px'; p.style.height = ph + 'px'; p.style.top = (H - ph) + 'px';
    document.documentElement.style.fontSize = (16 * Math.min(W / 1280, ph / 800)) + 'px';
  }
  function aplicarAcess() {
    var b = document.body;
    b.className = (acess.contraste ? 'contraste ' : '') + (acess.letra ? 'letra-grande ' : '') + (acess.cadeirante ? 'cadeirante ' : '') + (acess.dalt ? 'daltonismo' : '');
    try { storage.setItem('totem.acess', JSON.stringify(acess)); } catch (e) {}
    layout();
    ['Contraste', 'Letra', 'Cadeira', 'Dalt', 'Voz', 'Som'].forEach(function (n) {
      var key = { Contraste: 'contraste', Letra: 'letra', Cadeira: 'cadeirante', Dalt: 'dalt', Voz: 'voz', Som: 'som' }[n];
      $('ac' + n).className = 'opcao' + (acess[key] ? ' on' : '');
    });
  }
  window.addEventListener('resize', layout);

  /* ---------- som e voz ---------- */
  var audioCtx = null;
  function bip() {
    if (!acess.som) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = 880; g.gain.value = 0.08; o.connect(g); g.connect(audioCtx.destination);
      o.start(); o.stop(audioCtx.currentTime + 0.06);
    } catch (e) {}
  }
  function falar(texto) {
    if (!acess.voz || !window.speechSynthesis || !texto) return;
    try { window.speechSynthesis.cancel(); var u = new window.SpeechSynthesisUtterance(texto); u.lang = I.voz(); window.speechSynthesis.speak(u); } catch (e) {}
  }
  document.addEventListener('pointerdown', function (e) {
    if (e.target && e.target.closest && e.target.closest('button')) bip();
  }, true);

  /* ---------- mensagens ---------- */
  var toastTimer = null;
  function toast(msg, ms) {
    var t = $('toast'); t.textContent = msg; t.className = 'vis';
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.className = ''; }, ms || 2600);
  }
  function ver(id, sim) { $(id).className = 'ov' + (sim ? ' vis' : ''); }

  /* ---------- tela de cima ---------- */
  function linhasCliente() {
    var c = S.calc || Core.calcular(menu.itens, S.qtds, S.cupomOk), mapa = {};
    menu.itens.forEach(function (i) { mapa[i.id] = i; });
    return c.linhas.map(function (l) { return { qtd: l.qtd, nome: I.nome(mapa[l.id]), total: l.total }; });
  }
  function enviarCliente(estado, extra) {
    var c = S.calc || Core.calcular(menu.itens, S.qtds, S.cupomOk);
    var m = { estado: estado, idioma: I.get(), restaurante: menu.restaurante, itens: [], desconto: 0, total: 0 };
    if (estado === 'pedido' || estado === 'pagamento' || estado === 'aprovado') { m.itens = linhasCliente(); m.desconto = c.desconto; m.total = c.total; }
    if (extra) for (var k in extra) m[k] = extra[k];
    telaCima.enviar(m);
  }

  /* ---------- navegação ---------- */
  var FALA = { atracao: 'comecar', local: 'escolha', cardapio: 'seuPedido', nome: 'nomeTitulo' };
  function ir(tela) {
    S.tela = tela;
    ['atracao', 'local', 'cardapio', 'nome', 'pagamento', 'senha'].forEach(function (n) { $('t-' + n).className = 'tela' + (n === tela ? ' ativa' : ''); });
    if (FALA[tela]) falar(T(FALA[tela]));
    reiniciarInatividade();
  }
  function resetTudo() {
    pararPagamento(false);
    clearTimeout(senhaTimer);
    S = novoEstado();
    atualizarTudo();
    ir('atracao');
    enviarCliente('espera');
  }

  /* ---------- cardápio e pedido ---------- */
  var cartoes = {};
  function construirCardapio() {
    $('cardsEsf').innerHTML = ''; $('cardsBeb').innerHTML = ''; cartoes = {};
    menu.itens.forEach(function (it) {
      var d = document.createElement('div'); d.className = 'card';
      d.innerHTML = '<div class="badge">0</div><div class="img">' + Art[it.id] + '</div><div class="nome"></div><div class="preco"></div>' +
        '<div class="qtd"><button class="qbtn menos" type="button">&minus;</button><div class="qval">0</div><button class="qbtn mais" type="button">+</button></div>';
      d.querySelector('.menos').addEventListener('click', function (e) { e.stopPropagation(); mudar(it.id, -1); });
      d.querySelector('.mais').addEventListener('click', function (e) { e.stopPropagation(); mudar(it.id, 1); });
      d.addEventListener('click', function () { mudar(it.id, 1); });
      $(it.grupo === 'esfihas' ? 'cardsEsf' : 'cardsBeb').appendChild(d);
      cartoes[it.id] = { raiz: d, nome: d.querySelector('.nome'), preco: d.querySelector('.preco'), qval: d.querySelector('.qval'), badge: d.querySelector('.badge'), menos: d.querySelector('.menos') };
    });
    textosCardapio();
  }
  function textosCardapio() {
    menu.itens.forEach(function (it) {
      var c = cartoes[it.id]; if (!c) return;
      c.nome.textContent = I.nome(it); c.preco.textContent = Core.moeda(Core.paraCentavos(it.preco));
    });
  }
  function mudar(id, d) {
    var q = (S.qtds[id] | 0) + d; if (q < 0) q = 0; if (q > 20) q = 20;
    if (q === (S.qtds[id] | 0)) return;
    S.qtds[id] = q;
    atualizarCartao(id); atualizarPedido();
    if (d > 0) falar('1 ' + I.nome(menu.itens.filter(function (i) { return i.id === id; })[0]));
  }
  function atualizarCartao(id) {
    var c = cartoes[id], q = S.qtds[id] | 0;
    c.qval.textContent = q; c.badge.textContent = q; c.raiz.className = 'card' + (q > 0 ? ' tem' : ''); c.menos.disabled = q === 0;
  }
  function atualizarPedido() {
    var c = Core.calcular(menu.itens, S.qtds, S.cupomOk), mapa = {}, html = '';
    menu.itens.forEach(function (i) { mapa[i.id] = i; });
    c.linhas.forEach(function (l) {
      html += '<div class="linha"><span class="q">' + l.qtd + 'x</span><span class="n">' + I.nome(mapa[l.id]) + '</span><span class="p">' + Core.moeda(l.total) + '</span></div>';
    });
    $('linhas').innerHTML = html || '<div id="vazio">' + T('vazio') + '</div>';
    $('vSub').textContent = Core.moeda(c.subtotal); $('vTotal').textContent = Core.moeda(c.total);
    $('rSub').style.display = c.desconto > 0 ? 'flex' : 'none';
    $('rDesc').style.display = c.desconto > 0 ? 'flex' : 'none';
    $('vDesc').textContent = '-' + Core.moeda(c.desconto);
    $('cupomLink').style.display = S.cupomOk ? 'none' : 'flex';
    $('bPagar').disabled = c.qtdTotal === 0;
    S.calc = null;
  }
  function atualizarTudo() {
    menu.itens.forEach(function (i) { atualizarCartao(i.id); });
    atualizarPedido();
  }

  /* ---------- textos fixos / idioma ---------- */
  function aplicarTextos() {
    $('logoNome').textContent = menu.restaurante;
    $('atracaoNome').textContent = menu.restaurante;
    $('atracaoToque').textContent = T('comecar');
    $('bAcess').textContent = T('acess'); $('bAtend').textContent = T('atendente');
    $('localTitulo').textContent = T('escolha'); $('bAqui').innerHTML = iconeLocal(true) + T('aqui'); $('bLevar').innerHTML = iconeLocal(false) + T('levar');
    $('hEsf').textContent = T('esfihas'); $('hBeb').textContent = T('bebidas'); $('hPedido').textContent = T('seuPedido');
    $('cupomLink').textContent = T('cupom'); $('lSub').textContent = T('subtotal'); $('lDesc').textContent = T('desconto'); $('lTotal').textContent = T('total');
    $('bCancelar').textContent = T('cancelar'); $('bPagar').textContent = T('pagar');
    $('nomeTitulo').textContent = T('nomeTitulo'); $('nomeDica').textContent = T('nomeDica'); $('nomeVoltar').textContent = T('voltar'); $('nomeOk').textContent = T('continuar');
    $('cuTitulo').textContent = T('cupom'); $('cuFechar').textContent = T('fechar'); $('cuAplicar').textContent = T('aplicar');
    $('inTitulo').textContent = T('aindaAi'); $('inTexto').textContent = T('aindaAiTxt') + ' ' + '(' + T('segundos') + ')'; $('inOk').textContent = T('toqueContinuar');
    $('acTitulo').textContent = T('acess'); $('acFechar').textContent = T('fechar');
    [['acContraste', 'altoContraste'], ['acLetra', 'letraGrande'], ['acCadeira', 'cadeirante'], ['acDalt', 'daltonismo'], ['acVoz', 'voz'], ['acSom', 'som']].forEach(function (p) {
      $(p[0]).querySelector('span').textContent = T(p[1]);
    });
    $('pinFechar').textContent = T('fechar');
    $('tecTitulo').textContent = T('menuTecnico'); $('tecSalvar').textContent = T('salvar'); $('tecFechar').textContent = T('fechar');
    $('senhaRot').textContent = T('suaSenha'); $('senhaRetire').textContent = T('retire'); $('senhaReimp').textContent = T('reimprimir');
    document.querySelectorAll('[data-lang]').forEach(function (b) { b.className = 'btn-topo' + (b.getAttribute('data-lang') === I.get() ? ' sel' : ''); });
    nomeCampoAtualizar();
    textosCardapio(); atualizarPedido();
    if (S.tela === 'pagamento') desenharPagamento();
    if (S.tela === 'senha') desenharSenha();
  }
  function iconeLocal(aqui) {
    return aqui ? '<svg viewBox="0 0 64 64"><path d="M14 26h36l-3 24a4 4 0 0 1-4 3H21a4 4 0 0 1-4-3z" fill="#fff"/><path d="M10 26h44" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M24 20q4-8 8 0t8 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></svg>'
      : '<svg viewBox="0 0 64 64"><path d="M16 24h32l3 30H13z" fill="#fff"/><path d="M24 24v-6a8 8 0 0 1 16 0v6" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/></svg>';
  }
  function mudarIdioma(l) {
    I.set(l); document.documentElement.lang = l === 'en' ? 'en' : l === 'es' ? 'es' : 'pt-BR';
    try { storage.setItem('totem.lang', l); } catch (e) {}
    aplicarTextos(); atualizarTudo();
    if (S.tela === 'pagamento' || S.tela === 'nome' || S.tela === 'cardapio') reenviarCliente();
  }
  function reenviarCliente() {
    if (S.pg && S.pg.tipo) enviarCliente('pagamento', clienteExtraPg());
    else if (S.pedidoId) enviarCliente('pedido');
  }

  /* ---------- teclado virtual ---------- */
  function montarTeclado(raiz, linhas, aoTecla, pequeno) {
    raiz.innerHTML = '';
    linhas.forEach(function (l) {
      var f = document.createElement('div'); f.className = 'fila';
      l.forEach(function (k) {
        var b = document.createElement('button'); b.type = 'button';
        b.className = 'tecla' + (pequeno ? ' peq' : '') + (k === 'APAGAR' ? ' larga' : '') + (k === 'ESPACO' ? ' espaco' : '');
        b.textContent = k === 'APAGAR' ? '⌫' : k === 'ESPACO' ? T('espaco') : k;
        b.addEventListener('click', function () { aoTecla(k); });
        f.appendChild(b);
      });
      raiz.appendChild(f);
    });
  }
  var LETRAS = [['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'], ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ç'], ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'APAGAR']];
  var ACENTOS = ['Á', 'À', 'Â', 'Ã', 'É', 'Ê', 'Í', 'Ó', 'Ô', 'Õ', 'Ú'];
  var ALFANUM = [['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']].concat(LETRAS);

  /* ---------- nome ---------- */
  var nomeTxt = '';
  function nomeCampoAtualizar() { $('nomeCampo').innerHTML = (nomeTxt ? Core.formatarNome(nomeTxt) : '') + '<span class="cursor"></span>'; $('nomeOk').disabled = !Core.nomeValido(nomeTxt); }
  function teclaNome(k) {
    if (k === 'APAGAR') nomeTxt = nomeTxt.slice(0, -1); else if (nomeTxt.length < 12) nomeTxt += k;
    nomeCampoAtualizar();
  }
  function montarTecladoNome() {
    montarTeclado($('nomeTeclado'), LETRAS.concat([ACENTOS]), teclaNome);
    var ultima = $('nomeTeclado').lastChild; Array.prototype.forEach.call(ultima.children, function (b) { b.className += ' peq'; });
  }

  /* ---------- cupom ---------- */
  var cuTxt = '';
  function cupomCampo() { $('cuCampo').innerHTML = cuTxt + '<span class="cursor"></span>'; }
  function abrirCupom() { cuTxt = ''; cupomCampo(); $('cupomMsg').textContent = ''; $('cupomMsg').className = ''; ver('ov-cupom', true); }
  function teclaCupom(k) { if (k === 'APAGAR') cuTxt = cuTxt.slice(0, -1); else if (cuTxt.length < 20) cuTxt += k; cupomCampo(); }
  function aplicarCupom() {
    var m = $('cupomMsg');
    if (Core.cupomValido(cuTxt)) {
      S.cupomOk = true; S.cupomTexto = Core.normalizarCupom(cuTxt);
      m.textContent = T('cupomAplicado'); m.className = 'ok'; atualizarPedido(); falar(T('cupomAplicado'));
      setTimeout(function () { ver('ov-cupom', false); }, 900);
    } else { m.textContent = T('cupomInvalido'); m.className = 'er'; cuTxt = ''; cupomCampo(); }
  }

  /* ---------- confirmação e PIN ---------- */
  var aoConfirmar = null;
  function confirmar(titulo, texto, rotuloSim, aoSim) {
    $('cfTitulo').textContent = titulo; $('cfTexto').textContent = texto; $('cfSim').textContent = rotuloSim; $('cfNao').textContent = T('nao');
    aoConfirmar = aoSim; ver('ov-confirma', true);
  }
  var pinTxt = '', pinEsperado = '', pinAoOk = null;
  function pedirPin(titulo, esperado, aoOk) {
    pinTxt = ''; pinEsperado = esperado; pinAoOk = aoOk; $('pinTitulo').textContent = titulo; $('pinMsg').textContent = ''; pinAtualizar(); ver('ov-pin', true);
  }
  function pinAtualizar() { var s = ''; for (var i = 0; i < pinTxt.length; i++) s += '●'; $('pinCampo').innerHTML = s + '<span class="cursor"></span>'; }
  function teclaPin(k) {
    if (k === 'APAGAR') pinTxt = pinTxt.slice(0, -1); else if (pinTxt.length < 4) pinTxt += k;
    pinAtualizar();
    if (pinTxt.length === 4) {
      if (pinTxt === String(pinEsperado)) { ver('ov-pin', false); var f = pinAoOk; pinAoOk = null; if (f) f(); }
      else { $('pinMsg').textContent = T('pinErrado'); pinTxt = ''; setTimeout(pinAtualizar, 300); }
    }
  }

  /* ---------- inatividade (60s + aviso de 10s) ---------- */
  var tInativo = null, tAviso = null, avisoSeg = 0;
  function emPagamentoAtivo() { return S.pg && S.pg.ativo; }
  function reiniciarInatividade() {
    clearTimeout(tInativo); clearInterval(tAviso);
    if ($('ov-inativo').className.indexOf('vis') >= 0) ver('ov-inativo', false);
    if (S.tela === 'atracao' || S.tela === 'senha') return;
    tInativo = setTimeout(mostrarAviso, 60000);
  }
  function mostrarAviso() {
    if (emPagamentoAtivo()) { reiniciarInatividade(); return; }
    avisoSeg = 10; $('inativoNum').textContent = avisoSeg; ver('ov-inativo', true);
    tAviso = setInterval(function () {
      avisoSeg -= 1; $('inativoNum').textContent = avisoSeg;
      if (avisoSeg <= 0) { clearInterval(tAviso); ver('ov-inativo', false); fecharTudo(); resetTudo(); }
    }, 1000);
  }
  function fecharTudo() { ['ov-confirma', 'ov-cupom', 'ov-acess', 'ov-pin', 'ov-tecnico'].forEach(function (i) { ver(i, false); }); }
  document.addEventListener('pointerdown', function () {
    if (S.tela !== 'atracao' && S.tela !== 'senha') reiniciarInatividade();
  }, true);

  /* ---------- pagamento ---------- */
  var acomp = null, pixTimer = null, pixFim = 0;
  function pararPagamento(cancelarNoServico) {
    if (acomp) { acomp.parar(); acomp = null; }
    clearInterval(pixTimer);
    if (cancelarNoServico && S.pg && S.pg.id) { serv.cancelar(S.pg.id).then(null, function () {}); }
    if (S.pg) S.pg.ativo = false;
  }
  function itensParaServico() { return Object.keys(S.qtds).filter(function (k) { return S.qtds[k] > 0; }).map(function (k) { return { id: k, qtd: S.qtds[k] }; }); }
  function totalAtual() { return (S.pg && S.pg.valor) || Core.calcular(menu.itens, S.qtds, S.cupomOk).total; }
  function clienteExtraPg() {
    var e = { tipo: S.pg ? S.pg.tipo : '', valor: totalAtual(), nome: S.nome };
    if (S.pg && S.pg.tipo === 'pix') { e.qrTexto = S.pg.qrTexto || S.pixTexto; e.link = modoLink(); }
    return e;
  }

  function pagar() {
    S.calc = Core.calcular(menu.itens, S.qtds, S.cupomOk);
    if (S.calc.qtdTotal === 0) return;
    S.pedidoId = 'P' + Date.now();
    S.senhaReservada = Core.espiarSenha(storage);
    S.pg = null; S.pixTexto = ''; S.pixSvg = '';
    gerarPixLocal();                                  /* QR pronto antes de pedir o nome */
    enviarCliente('pedido');
    nomeTxt = S.nome || 'Braulino'; nomeCampoAtualizar();
    ir('nome');
  }
  function gerarPixLocal() {
    var c = cfg(), chave = c.pixChave || (demo ? 'teste@exemplo.com' : '');
    if (!chave) return;
    try {
      S.pixTexto = window.PixBR.gerarPix({ chave: chave, nome: c.pixNome, cidade: c.pixCidade, txid: S.senhaReservada, valor: S.calc.total / 100 });
      S.pixSvg = window.qrSvg(S.pixTexto);
    } catch (e) { S.pixTexto = ''; S.pixSvg = ''; }
  }
  function irParaPagamento() {
    S.nome = Core.formatarNome(nomeTxt);
    ir('pagamento'); iniciarPix();
  }

  /* Pix automático (backend/InfinitePay): o QR leva ao checkout; o cliente paga Pix ou cartão no próprio celular. */
  function modoLink() { return true; }   /* só Pix, sempre por link da InfinitePay */
  function pg(html) { $('pgConteudo').innerHTML = html; }
  function simularBotoes() {
    return demo && S.pg && S.pg.id
      ? '<div class="simular"><button class="btn" id="bSimOk" type="button">' + T('simAprov') + '</button><button class="btn" id="bSimNok" type="button">' + T('simRec') + '</button></div>' : '';
  }
  function desenharPagamento() {
    var sub = S.pg ? S.pg.sub : '', v = Core.moeda(totalAtual()), html = '';
    if (!S.pg) S.pg = { tipo: '', ativo: false };
    if (!sub || sub === 'escolha') { iniciarPix(); return; }
    if (sub === 'carregando') { pg('<h1>' + T('carregando') + '</h1><div class="pulso"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="18" stroke="#fff" stroke-width="6" fill="none" stroke-dasharray="60 60"/></svg></div><div class="valor-gde">' + v + '</div>'); return; }
    if (sub === 'cartao') {
      pg('<h1>' + T('aproxime') + '</h1><div class="pulso"><svg viewBox="0 0 64 64"><path d="M20 22a16 16 0 0 1 0 20M28 16a24 24 0 0 1 0 32M36 10a32 32 0 0 1 0 44" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/></svg></div>' +
        '<div class="valor-gde">' + v + '</div><div class="linha-btns"><button class="btn btn-verm" id="bCancPg" type="button">' + T('cancelarPag') + '</button></div>' + simularBotoes());
      $('bCancPg').onclick = cancelarPagamentoAtual;
      if ($('bSimOk')) { $('bSimOk').onclick = function () { serv.simular(S.pg.id, ST.PROCESSANDO); setTimeout(function () { serv.simular(S.pg.id, ST.APROVADO); }, 1500); }; $('bSimNok').onclick = function () { serv.simular(S.pg.id, ST.RECUSADO); }; }
      return;
    }
    if (sub === 'processando') { pg('<h1>' + T('processando') + '</h1><div class="pulso"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="18" stroke="#fff" stroke-width="6" fill="none" stroke-dasharray="60 60"/></svg></div><div class="valor-gde">' + v + '</div>'); return; }
    if (sub === 'recusado' || sub === 'expirado' || sub === 'semconexao' || sub === 'pixnc') {
      var titulo = sub === 'recusado' ? T('recusado') : sub === 'expirado' ? T('expirado') : sub === 'pixnc' ? T('pixNaoConfig') : T('semConexao');
      html = '<h1 class="msg-erro">' + titulo + '</h1><div class="valor-gde">' + v + '</div><div class="linha-btns">';
      html += '<button class="btn btn-verde" id="bTentar" type="button">' + T('tentarDeNovo') + '</button>';
      html += '<button class="btn btn-verm" id="bCancPed" type="button">' + T('cancelar') + '</button></div>';
      pg(html);
      $('bTentar').onclick = function () { enviarCliente('pedido'); iniciarPix(); };
      $('bCancPed').onclick = pedirCancelarPedido;
      return;
    }
    if (sub === 'pix') {
      var manualPago = S.pg.jaPaguei;
      pg('<div class="pix-corpo"><div id="pixQr">' + (S.pg.svg || '') + '</div><div class="pix-info"><div class="valor-gde">' + v + '</div><p>' + (modoLink() ? T('abraCamera') : T('abraBanco')) + '</p><p id="pixValid"></p>' +
        (manualPago ? '<p class="msg-erro">' + T('mostreComprovante') + '</p>' : (S.pg.manual ? '<button class="btn btn-verde" id="bJaPaguei" type="button">' + T('jaPaguei') + '</button>' : '')) +
        '</div></div><div class="linha-btns"><button class="btn btn-verm" id="bCancPg" type="button">' + T('cancelarPag') + '</button></div>' + simularBotoes() +
        (S.pg.manual && manualPago ? '<button class="discreto" id="bConfAtend" type="button">' + T('confirmarAtendente') + '</button>' : ''));
      $('bCancPg').onclick = cancelarPagamentoAtual;
      if ($('bSimOk')) { $('bSimOk').onclick = function () { serv.simular(S.pg.id, ST.APROVADO); }; $('bSimNok').onclick = function () { serv.simular(S.pg.id, ST.RECUSADO); }; }
      if ($('bJaPaguei')) $('bJaPaguei').onclick = function () { S.pg.jaPaguei = true; desenharPagamento(); };
      if ($('bConfAtend')) $('bConfAtend').onclick = function () { pedirPin(T('pinAtendente'), cfg().pinAtendente, function () { finalizar('Pix'); }); };
      atualizarValidadePix();
    }
  }
  function atualizarValidadePix() {
    var e = $('pixValid'); if (!e) return;
    var seg = Math.max(0, Math.round((pixFim - Date.now()) / 1000)), m = Math.floor(seg / 60), s = seg % 60;
    e.textContent = T('validade') + ' (' + m + ':' + (s < 10 ? '0' : '') + s + ')';
  }
  function cancelarPagamentoAtual() {
    pararPagamento(true);
    S.pg = null; enviarCliente('pedido'); ir('cardapio');
  }

  function semRede() { return !demo && typeof navigator.onLine === 'boolean' && navigator.onLine === false; }
  function iniciarPix() {
    var automatico = true;
    if (automatico && semRede()) { S.pg = { tipo: 'pix', ativo: false, sub: 'semconexao' }; desenharPagamento(); return; }
    pararPagamento(true);
    S.pg = { tipo: 'pix', ativo: false, sub: 'carregando' }; desenharPagamento();
    pixFim = Date.now() + 5 * 60 * 1000;
    function mostrar(texto, svg, id) {
      S.pg = { tipo: 'pix', ativo: true, sub: 'pix', id: id || '', manual: !automatico, svg: svg, qrTexto: texto, valor: S.calc.total };
      desenharPagamento(); enviarCliente('pagamento', clienteExtraPg()); falar(modoLink() ? T('abraCamera') : T('abraBanco'));
      clearInterval(pixTimer);
      pixTimer = setInterval(function () {
        atualizarValidadePix();
        if (Date.now() >= pixFim) { clearInterval(pixTimer); pararPagamento(true); S.pg = { tipo: 'pix', ativo: false, sub: 'expirado' }; desenharPagamento(); enviarCliente('erro', { mensagem: T('expirado') }); setTimeout(function () { if (S.pg && S.pg.sub === 'expirado') enviarCliente('pedido'); }, 5100); }
      }, 1000);
    }
    if (!automatico) {
      if (!S.pixTexto) { S.pg = { tipo: 'pix', ativo: false, sub: 'pixnc' }; desenharPagamento(); return; }
      mostrar(S.pixTexto, S.pixSvg, '');
      return;
    }
    serv.iniciar({ pedidoId: S.pedidoId, itens: itensParaServico(), cupom: S.cupomOk ? S.cupomTexto : null, tipo: 'pix' }).then(function (r) {
      var texto = r.qrCodeTexto || S.pixTexto;
      if (!texto) { S.pg = { tipo: 'pix', ativo: false, sub: 'pixnc' }; desenharPagamento(); return; }
      mostrar(texto, window.qrSvg(texto), r.pagamentoId);
      S.pg.valor = r.valor || S.calc.total;
      acomp = Sv.acompanhar(serv, r.pagamentoId, function (st) {
        if (!S.pg || S.pg.tipo !== 'pix') return;
        if (st === ST.APROVADO) finalizar('Pix');
        else if (st === ST.RECUSADO || st === ST.EXPIRADO || st === ST.CANCELADO) { pararPagamento(false); S.pg = { tipo: 'pix', ativo: false, sub: 'expirado' }; desenharPagamento(); }
      }, { limite: 5 * 60 * 1000 });
    }, function () { S.pg = { tipo: 'pix', ativo: false, sub: 'semconexao' }; desenharPagamento(); });
  }

  /* ---------- depois de pago ---------- */
  var senhaTimer = null, impressaoOk = true;
  function larguraPapel() { return cfg().papel === '58' ? 32 : 48; }
  function dataHora() { var d = new Date(), p = function (n) { return ('0' + n).slice(-2); }; return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); }
  function finalizar(forma) {
    if (S.tela === 'senha') return;                       /* nunca duas vezes o mesmo pedido */
    pararPagamento(false);
    var c = Core.calcular(menu.itens, S.qtds, S.cupomOk), mapa = {};
    if (S.pg && S.pg.valor && S.pg.valor !== c.total) c.total = S.pg.valor;
    menu.itens.forEach(function (i) { mapa[i.id] = i; });
    var senha = Core.proximaSenha(storage);
    var linhasPt = c.linhas.map(function (l) { return { qtd: l.qtd, nome: mapa[l.id].nome.pt, total: l.total }; });
    var pedido = { id: S.pedidoId, senha: senha, nome: S.nome, local: S.local === 'aqui' ? 'COMER AQUI' : 'PARA LEVAR', linhas: linhasPt, subtotal: c.subtotal, desconto: c.desconto, total: c.total, forma: forma, dia: Core.chaveDia(), dataHora: dataHora() };
    S.ultimoPedido = pedido; S.calc = c;
    guardarPedido(pedido);
    var dados = { restaurante: menu.restaurante, dataHora: pedido.dataHora, nome: pedido.nome, senha: senha, local: pedido.local, linhas: linhasPt, desconto: c.desconto, total: c.total, forma: forma };
    var job = { id: pedido.id, largura: larguraPapel(), vias: [Core.textoComprovante(dados, larguraPapel()), Core.textoProducao(dados)] };
    impressaoOk = true;
    fila.enfileirar(job).then(function (r) { impressaoOk = !!(r && r.ok); desenharSenha(); });
    ir('senha'); desenharSenha();
    enviarCliente('aprovado', { nome: S.nome, senha: senha });
    falar(T('aprovado') + ' ' + S.nome + ' ' + senha);
    var seg = 15;
    $('senhaVolta').textContent = '';
    clearTimeout(senhaTimer);
    (function tic() {
      $('senhaVolta').textContent = seg + T('segundos');
      if (seg <= 0) { resetTudo(); return; }
      seg -= 1; senhaTimer = setTimeout(tic, 1000);
    })();
  }
  function guardarPedido(p) {
    var l = []; try { l = JSON.parse(storage.getItem('totem.pedidos')) || []; } catch (e) { l = []; }
    l.push(p); if (l.length > 500) l = l.slice(-500);
    storage.setItem('totem.pedidos', JSON.stringify(l));
  }
  function desenharSenha() {
    var p = S.ultimoPedido; if (!p) return;
    $('senhaGrande').textContent = p.nome + ' ' + p.senha;
    $('senhaResumo').innerHTML = p.linhas.map(function (l) { return l.qtd + 'x ' + l.nome; }).join(' &nbsp;·&nbsp; ') + '<br>' + T('total') + ': ' + Core.moeda(p.total) + ' — ' + p.forma;
    $('senhaAviso').textContent = T('chameAtendente') + ' (' + T('impressoraFalhou') + ')';
    $('senhaAviso').className = impressaoOk ? '' : 'vis';
    $('senhaReimp').className = 'btn btn-claro' + (impressaoOk ? '' : ' vis');
  }

  /* ---------- cancelar pedido ---------- */
  function pedirCancelarPedido() {
    confirmar(T('confirmarCancelar'), T('confirmarCancelarTxt'), T('sim'), function () {
      pararPagamento(true);
      enviarCliente('cancelado', { mensagem: T('cancelMsg') });
      S = novoEstado(); atualizarTudo(); nomeTxt = ''; ir('atracao');
    });
  }

  /* ---------- menu técnico ---------- */
  var tecTimer = null;
  function abrirTecnico() {
    var c = cfg();
    function inp(id, rot, val, tipo) { return '<div class="tec-campo"><label for="' + id + '">' + rot + '</label><input id="' + id + '" type="' + (tipo || 'text') + '" value="' + String(val).replace(/"/g, '&quot;') + '"></div>'; }
    $('tecCorpo').innerHTML = '<div class="estado-pag"><span class="bolinha" id="tecBol"></span><span id="tecEstado">...</span></div>' +
      '<div class="tec-grid">' + inp('tcPinAt', 'PIN do atendente (4 dígitos)', c.pinAtendente, 'tel') + inp('tcPinTec', 'PIN do menu técnico (4 dígitos)', c.pinTecnico, 'tel') +
      inp('tcBackend', 'Endereço do backend', c.backendUrl, 'url') + inp('tcChave', 'Chave do totem (CHAVE_DO_TOTEM)', c.backendChave) + inp('tcMaq', 'ID da maquininha', c.maquininhaId) +
      '<div class="tec-campo"><label for="tcPapel">Largura do papel</label><select id="tcPapel"><option value="58">58 mm</option><option value="80">80 mm</option></select></div></div>' +
      '<div class="tec-btns"><button class="btn btn-marrom" id="tcTestImp" type="button">Teste de impressão</button><button class="btn btn-marrom" id="tcTestPix" type="button">Teste Pix R$ 1,00</button><button class="btn btn-claro" id="tcZerar" type="button">Reiniciar numeração</button><button class="btn btn-verm" id="tcSair" type="button">Sair do modo quiosque</button></div>' +
      '<div id="tecQr"></div><div id="tecResumo"></div>';
    $('tcPapel').value = c.papel;
    $('tcTestImp').onclick = testeImpressao; $('tcTestPix').onclick = testeCartao;
    $('tcZerar').onclick = function () { confirmar('Reiniciar numeração?', 'A próxima senha volta a ser R1.', 'Reiniciar', function () { Core.reiniciarSenha(storage); toast('Numeração reiniciada'); }); };
    $('tcSair').onclick = function () { confirmar('Sair do modo quiosque?', 'O app será fechado.', 'Sair', function () { if (window.SunmiBridge && window.SunmiBridge.sairKiosk) window.SunmiBridge.sairKiosk(); else toast('Sem modo quiosque (navegador)'); }); };
    resumoVendas(); estadoModulo(); clearInterval(tecTimer); tecTimer = setInterval(estadoModulo, 10000);
    ver('ov-tecnico', true);
  }
  function fecharTecnico() { clearInterval(tecTimer); ver('ov-tecnico', false); }
  function salvarTecnico() {
    var pa = $('tcPinAt').value, pt = $('tcPinTec').value;
    if (!/^\d{4}$/.test(pa) || !/^\d{4}$/.test(pt)) { toast('Os PINs precisam ter 4 dígitos'); return; }
    cfgSvc.salvar({ pixModo: 'automatico',
      pinAtendente: pa, pinTecnico: pt, backendUrl: $('tcBackend').value.trim(), backendChave: $('tcChave').value.trim(), maquininhaId: $('tcMaq').value.trim(), papel: $('tcPapel').value });
    toast('Configuração salva'); fecharTecnico();
  }
  function estadoModulo() {
    serv.saude().then(function (ok) {
      if (!$('tecBol')) return;
      $('tecBol').className = 'bolinha ' + (ok ? 'verde' : 'verm');
      $('tecEstado').textContent = ok ? 'Pagamento: em espera e pronto' : 'Pagamento: sem conexão com o backend';
    });
  }
  function resumoVendas() {
    var l = []; try { l = JSON.parse(storage.getItem('totem.pedidos')) || []; } catch (e) { l = []; }
    var hoje = Core.chaveDia(), por = {}, tot = 0, n = 0;
    l.forEach(function (p) { if (p.dia !== hoje) return; por[p.forma] = por[p.forma] || { n: 0, v: 0 }; por[p.forma].n += 1; por[p.forma].v += p.total; tot += p.total; n += 1; });
    var t = 'Vendas de hoje (só neste aparelho): ' + n + ' pedido(s), ' + Core.moeda(tot);
    Object.keys(por).forEach(function (f) { t += '\n  ' + f + ': ' + por[f].n + ' — ' + Core.moeda(por[f].v); });
    var info = ''; try { if (window.SunmiBridge && window.SunmiBridge.info) info = '\nAparelho: ' + window.SunmiBridge.info(); } catch (e) {}
    $('tecResumo').textContent = t + info;
  }
  function testeImpressao() {
    var job = { id: 'teste-' + Date.now(), largura: larguraPapel(), vias: [[{ t: 'TESTE DE IMPRESSÃO', a: 'c', b: true, s: 2 }, { t: menu.restaurante, a: 'c', s: 1 }, { t: dataHora(), a: 'c', s: 1 }, { t: '', s: 1 }]] };
    impressora.imprimir(job).then(function (r) { toast(r.ok ? 'Impressão enviada' : 'Falha: ' + (r.erro || 'erro')); });
  }
  function testeCartao() {
    toast('Enviando cobrança de R$ 1,00...');
    serv.iniciar({ pedidoId: 'TESTE-' + Date.now(), itens: [], cupom: null, tipo: 'pix', teste: true, valorTeste: 100 }).then(function (r) {
      toast('QR de R$ 1,00 criado: ' + Core.moeda(r.valor)); if (r.qrCodeTexto) { $('tecQr').innerHTML = window.qrSvg(r.qrCodeTexto); $('tecQr').className = 'vis'; } Sv.acompanhar(serv, r.pagamentoId, function (st) { $('tecResumo').textContent = 'Teste Pix: ' + st; if (demo && st === ST.AGUARDANDO) serv.simular(r.pagamentoId, ST.APROVADO); });
    }, function () { toast(T('semConexao')); });
  }
  function testePix() {
    var c = cfg(), chave = c.pixChave || (demo ? 'teste@exemplo.com' : '');
    if (!chave) { toast(T('pixNaoConfig')); return; }
    try { var t = window.PixBR.gerarPix({ chave: chave, nome: c.pixNome, cidade: c.pixCidade, txid: 'TESTE', valor: 1 }); $('tecQr').innerHTML = window.qrSvg(t); $('tecQr').className = 'vis'; }
    catch (e) { toast('Erro ao gerar o Pix'); }
  }

  /* ---------- logo: segurar 3s abre o menu técnico ---------- */
  var tLogo = null;
  function logoDown() { clearTimeout(tLogo); tLogo = setTimeout(function () { pedirPin(T('menuTecnico') + ' — ' + T('pin'), cfg().pinTecnico, abrirTecnico); }, 3000); }
  function logoUp() { clearTimeout(tLogo); }

  /* ---------- carrossel ---------- */
  function montarCarrossel() {
    var ids = ['carne', 'queijo', 'calabresa', 'bacon'], h = '';
    ids.forEach(function (i, n) { h += '<div class="slide' + (n === 0 ? ' ativo' : '') + '">' + Art[i] + '</div>'; });
    $('carrossel').innerHTML = h;
    var atual = 0, slides = $('carrossel').children;
    setInterval(function () {
      if (S.tela !== 'atracao') return;
      slides[atual].className = 'slide'; atual = (atual + 1) % slides.length; slides[atual].className = 'slide ativo';
    }, 2500);
  }

  /* ---------- ligações ---------- */
  function ligar() {
    $('logoSvg').innerHTML = Art.logo;
    $('t-atracao').addEventListener('click', function () { ir('local'); });
    $('bAqui').onclick = function () { S.local = 'aqui'; ir('cardapio'); };
    $('bLevar').onclick = function () { S.local = 'levar'; ir('cardapio'); };
    $('bCancelar').onclick = pedirCancelarPedido;
    $('bPagar').onclick = pagar;
    $('cupomLink').onclick = abrirCupom;
    $('cuFechar').onclick = function () { ver('ov-cupom', false); };
    $('cuAplicar').onclick = aplicarCupom;
    $('nomeVoltar').onclick = function () { enviarCliente('pedido'); ir('cardapio'); };
    $('nomeOk').onclick = irParaPagamento;
    $('cfSim').onclick = function () { ver('ov-confirma', false); var f = aoConfirmar; aoConfirmar = null; if (f) f(); };
    $('cfNao').onclick = function () { ver('ov-confirma', false); aoConfirmar = null; };
    $('inOk').onclick = reiniciarInatividade;
    $('bAcess').onclick = function () { ver('ov-acess', true); };
    $('acFechar').onclick = function () { ver('ov-acess', false); };
    [['acContraste', 'contraste'], ['acLetra', 'letra'], ['acCadeira', 'cadeirante'], ['acDalt', 'dalt'], ['acVoz', 'voz'], ['acSom', 'som']].forEach(function (p) {
      $(p[0]).onclick = function () { acess[p[1]] = !acess[p[1]]; aplicarAcess(); if (p[1] === 'voz' && acess.voz) falar(T('voz')); };
    });
    $('bAtend').onclick = function () { toast(T('atendenteChamado'), 3500); falar(T('atendenteChamado')); };
    document.querySelectorAll('[data-lang]').forEach(function (b) { b.onclick = function () { mudarIdioma(b.getAttribute('data-lang')); }; });
    $('pinFechar').onclick = function () { ver('ov-pin', false); pinAoOk = null; };
    $('tecFechar').onclick = fecharTecnico; $('tecSalvar').onclick = salvarTecnico;
    $('senhaReimp').onclick = function () { fila.processar().then(function (r) { impressaoOk = !!(r && r.ok); desenharSenha(); }); };
    var lg = $('logo');
    lg.addEventListener('pointerdown', logoDown); lg.addEventListener('pointerup', logoUp); lg.addEventListener('pointerleave', logoUp); lg.addEventListener('pointercancel', logoUp);
    montarTeclado($('cuTeclado'), ALFANUM, teclaCupom, true);
    montarTecladoNome();
    montarTeclado($('pinTeclado'), [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['APAGAR', '0']], teclaPin);
    montarCarrossel();
  }

  /* ---------- início ---------- */
  carregarCardapio(function (m) {
    menu = m;
    var lang = 'pt'; try { lang = storage.getItem('totem.lang') || 'pt'; } catch (e) {}
    I.set(lang);
    layout(); aplicarAcess();
    construirCardapio(); ligar(); aplicarTextos(); atualizarTudo();
    ir('atracao'); enviarCliente('espera');
    fila.processar();                                     /* reimprime o que ficou pendente se o app reiniciou */
    window.__totem = { estado: function () { return S; }, fila: fila, servico: serv, ir: ir, demo: demo };
  });
})();
