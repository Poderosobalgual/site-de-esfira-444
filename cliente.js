/* Tela de cima (cliente, 800x480). Sem nenhuma interação: só segue o estado enviado pela tela principal. */
(function () {
  'use strict';
  var Core = window.TotemCore, I = window.I18N, Sv = window.TotemServicos;
  function $(id) { return document.getElementById(id); }

  /* escala o palco 800x480 para a janela (a tela real tem exatamente 800x480) */
  function escalar() {
    var s = Math.min(window.innerWidth / 800, window.innerHeight / 480), r = $('raiz');
    r.style.transform = 'scale(' + s + ')';
    r.style.left = Math.max(0, (window.innerWidth - 800 * s) / 2) + 'px';
    r.style.top = Math.max(0, (window.innerHeight - 480 * s) / 2) + 'px';
  }
  window.addEventListener('resize', escalar); escalar();

  var VISOES = ['espera', 'pedido', 'pagamento', 'aprovado', 'erro'];
  function mostrar(v) { VISOES.forEach(function (n) { $('v-' + n).className = 'v' + (n === v ? ' ativa' : ''); }); }
  var ultimoQr = '';

  function desenhar(m) {
    if (m.idioma) I.set(m.idioma);
    var T = I.t;
    if (m.estado === 'pedido') {
      $('pdTitulo').textContent = T('seuPedidoCli');
      $('pdLista').innerHTML = (m.itens || []).map(function (l) { return '<div class="li"><span class="q">' + l.qtd + 'x</span><span class="n">' + l.nome + '</span><span class="p">' + Core.moeda(l.total) + '</span></div>'; }).join('');
      $('pdDesc').style.display = m.desconto > 0 ? 'flex' : 'none';
      $('pdDescL').textContent = T('desconto'); $('pdDescV').textContent = '-' + Core.moeda(m.desconto);
      $('pdTotL').textContent = T('total'); $('pdTotV').textContent = Core.moeda(m.total);
      mostrar('pedido');
    } else if (m.estado === 'pagamento') {
      if (m.tipo === 'pix' && m.qrTexto) {
        $('pgCartao').style.display = 'none'; $('pgPix').style.display = 'flex';
        if (m.qrTexto !== ultimoQr) { ultimoQr = m.qrTexto; $('pgQr').innerHTML = window.qrSvg(m.qrTexto); }
        $('pgPixTxt').textContent = m.link ? T('abraCamera') : T('abraBanco'); $('pgPixValor').textContent = Core.moeda(m.valor || m.total);
      } else {
        $('pgPix').style.display = 'none'; $('pgCartao').style.display = 'block';
        $('pgTitulo').textContent = T('aproxime'); $('pgValor').textContent = Core.moeda(m.valor || m.total);
      }
      mostrar('pagamento');
    } else if (m.estado === 'aprovado') {
      $('apTitulo').textContent = T('aprovado'); $('apSenha').textContent = (m.nome || '') + ' ' + (m.senha || ''); $('apMsg').textContent = T('retire');
      mostrar('aprovado');
    } else if (m.estado === 'erro' || m.estado === 'cancelado') {
      $('erMsg').textContent = m.mensagem || (m.estado === 'cancelado' ? T('cancelMsg') : T('erroMsg'));
      mostrar('erro');
    } else {
      $('esLogo').innerHTML = window.TotemArt.logo; $('esNome').textContent = m.restaurante || ultimoNome; $('esMsg').textContent = T('aguardando');
      if (m.restaurante) ultimoNome = m.restaurante;
      mostrar('espera');
    }
  }
  var ultimoNome = '';
  var maquina = Core.criarMaquinaCliente(desenhar);
  Sv.ouvirTelaCliente(function (msg) { maquina.receber(msg); });
  /* lê o estado atual salvo (caso a janela abra depois da tela principal) */
  try { var salvo = window.localStorage.getItem('totem.telaCliente'); if (salvo) maquina.receber(JSON.parse(salvo.split('|')[0])); else desenhar({ estado: 'espera' }); } catch (e) { desenhar({ estado: 'espera' }); }
  window.__cliente = { maquina: maquina };
})();
