/* Testes automáticos do web/. Rodar: node tests/run.js  (sem dependências) */
'use strict';
var assert = require('assert');
var path = require('path');
var Pix = require(path.join(__dirname, '../js/pix-brcode.js'));
var Core = require(path.join(__dirname, '../js/core.js'));
var cardapio = require(path.join(__dirname, '../cardapio.json'));

var ok = 0, falhas = [];
var pendentes = [];
function teste(nome, fn) {
  pendentes.push(Promise.resolve().then(fn).then(function () { ok++; console.log('  ok   ' + nome); }, function (e) { falhas.push(nome); console.log('  FALHOU ' + nome + '\n     ' + (e && e.message)); }));
}
function memStorage() {
  var m = {};
  return { getItem: function (k) { return m.hasOwnProperty(k) ? m[k] : null; }, setItem: function (k, v) { m[k] = String(v); }, removeItem: function (k) { delete m[k]; }, _m: m };
}

/* ---------- Pix ---------- */
teste('CRC16 do texto "123456789" = 29B1', function () { assert.strictEqual(Pix.crc16('123456789'), '29B1'); });
teste('Pix gerado: formato e CRC conferem', function () {
  var code = Pix.gerarPix({ chave: 'teste@exemplo.com', nome: 'Emmanuel', cidade: 'Curitiba', txid: 'R5', valor: 13.5 });
  assert.ok(code.indexOf('000201') === 0, 'começa com 000201');
  assert.ok(code.indexOf('br.gov.bcb.pix') > 0);
  assert.ok(code.indexOf('540513.50') > 0, 'valor 13.50');
  assert.ok(code.indexOf('5908EMMANUEL') > 0 && code.indexOf('6008CURITIBA') > 0);
  assert.ok(code.indexOf('0502R5') > 0, 'txid R5');
  assert.strictEqual(code.slice(-8, -4), '6304');
  assert.strictEqual(Pix.crc16(code.slice(0, -4)), code.slice(-4), 'CRC confere');
});
teste('Pix: valor inválido lança erro; acentos são removidos', function () {
  assert.throws(function () { Pix.gerarPix({ chave: 'a@b.c', nome: 'X', cidade: 'Y', valor: 0 }); });
  var c = Pix.gerarPix({ chave: 'a@b.c', nome: 'José Ñandú', cidade: 'São Paulo', txid: 'R1', valor: 1 });
  assert.ok(c.indexOf('JOSE NANDU') > 0 && c.indexOf('SAO PAULO') > 0);
});

/* ---------- cupom / SHA-256 ---------- */
teste('SHA-256 confere com vetor conhecido', function () {
  assert.strictEqual(Core.sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.strictEqual(Core.sha256(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
});
teste('Cupom: ignora maiúsculas e espaços; errado é inválido; o código não aparece no código-fonte do app', function () {
  assert.ok(Core.cupomValido('indiano10') && Core.cupomValido('  IndIano 10 '));
  assert.ok(!Core.cupomValido('') && !Core.cupomValido('INDIANO') && !Core.cupomValido('indiano11'));
  var fs = require('fs'), arq = ['js/app.js', 'js/core.js', 'js/services.js', 'js/i18n.js', 'index.html', 'cliente.html', 'cardapio.json'];
  arq.forEach(function (a) { assert.ok(!/indiano/i.test(fs.readFileSync(path.join(__dirname, '..', a), 'utf8')), 'código do cupom vazou em ' + a); });
});

/* ---------- total e desconto ---------- */
teste('Cálculo de total e desconto (em centavos)', function () {
  var c = Core.calcular(cardapio.itens, { carne: 2, bacon: 1, coca: 1 }, false);
  assert.strictEqual(c.subtotal, 2 * 650 + 750 + 600);
  assert.strictEqual(c.desconto, 0); assert.strictEqual(c.total, 2650); assert.strictEqual(c.qtdTotal, 4);
  var d = Core.calcular(cardapio.itens, { carne: 2, bacon: 1, coca: 1 }, true);
  assert.strictEqual(d.desconto, 265); assert.strictEqual(d.total, 2385);
  assert.strictEqual(Core.calcular(cardapio.itens, {}, true).total, 0);
  assert.strictEqual(Core.calcular(cardapio.itens, { queijo: 1 }, true).desconto, 65); /* 6,50 x 10% = 0,65 */
});
teste('Moeda e nome', function () {
  assert.strictEqual(Core.moeda(650), 'R$ 6,50'); assert.strictEqual(Core.moeda(5), 'R$ 0,05'); assert.strictEqual(Core.moeda(100000), 'R$ 1000,00');
  assert.strictEqual(Core.formatarNome('emmanuel'), 'Emmanuel'); assert.strictEqual(Core.formatarNome('JOSÉ'), 'José');
  assert.strictEqual(Core.formatarNome('abcdefghijklmnop').length, 12);
  assert.ok(!Core.nomeValido('A') && Core.nomeValido('Al'));
});

/* ---------- senha por dia ---------- */
teste('Senha sequencial por dia, salva no aparelho', function () {
  var st = memStorage(), d1 = new Date(2026, 9, 29, 10, 0), d2 = new Date(2026, 9, 30, 9, 0);
  assert.strictEqual(Core.espiarSenha(st, d1), 'R1');
  assert.strictEqual(Core.espiarSenha(st, d1), 'R1', 'espiar não consome');
  assert.strictEqual(Core.proximaSenha(st, d1), 'R1');
  assert.strictEqual(Core.proximaSenha(st, d1), 'R2');
  assert.strictEqual(Core.espiarSenha(st, d1), 'R3');
  assert.strictEqual(Core.proximaSenha(st, d2), 'R1', 'novo dia reinicia');
  assert.strictEqual(Core.proximaSenha(st, d2), 'R2');
  Core.reiniciarSenha(st); assert.strictEqual(Core.proximaSenha(st, d2), 'R1');
});

/* ---------- fila de impressão ---------- */
teste('Fila: falha mantém o pedido; reimprimir envia; reiniciar o app reimprime o pendente', function () {
  var st = memStorage(), falhar = true, impressos = [];
  var imp = { imprimir: function (j) { if (falhar) return Promise.resolve({ ok: false, erro: 'sem_papel' }); impressos.push(j.id); return Promise.resolve({ ok: true }); } };
  var f1 = Core.criarFilaImpressao(st, imp);
  return f1.enfileirar({ id: 'A', vias: [] }).then(function (r) {
    assert.strictEqual(r.ok, false); assert.strictEqual(r.erro, 'sem_papel');
    assert.strictEqual(f1.pendentes().length, 1, 'pedido pago não se perde');
    return f1.enfileirar({ id: 'B', vias: [] });
  }).then(function () {
    assert.strictEqual(f1.pendentes().length, 2);
    var f2 = Core.criarFilaImpressao(st, imp);          /* "app reiniciou" */
    assert.strictEqual(f2.pendentes().length, 2, 'fila persistida');
    falhar = false;
    return f2.processar().then(function (r) {
      assert.strictEqual(r.ok, true); assert.deepStrictEqual(impressos, ['A', 'B'], 'ordem preservada');
      assert.strictEqual(f2.pendentes().length, 0);
    });
  });
});
teste('Fila: impressora que lança erro não derruba nem apaga o job', function () {
  var st = memStorage(), f = Core.criarFilaImpressao(st, { imprimir: function () { return Promise.reject(new Error('ocupada')); } });
  return f.enfileirar({ id: 'X' }).then(function (r) { assert.strictEqual(r.ok, false); assert.strictEqual(f.pendentes().length, 1); });
});
teste('Comprovante: cliente com preços e desconto; produção SEM preços', function () {
  var d = { restaurante: 'Casa da Esfiha', dataHora: '29/10/2026 10:00', nome: 'Emmanuel', senha: 'R5', local: 'PARA LEVAR', linhas: [{ qtd: 2, nome: 'Esfiha de Carne', total: 1300 }], desconto: 130, total: 1170, forma: 'Pix' };
  var cli = Core.textoComprovante(d, 32).map(function (l) { return l.t; }).join('\n');
  assert.ok(cli.indexOf('Emmanuel R5') >= 0 && cli.indexOf('R$ 11,70') >= 0 && cli.indexOf('Desconto (10%)') >= 0 && cli.indexOf('Pix') >= 0);
  var prod = Core.textoProducao(d).map(function (l) { return l.t; }).join('\n');
  assert.ok(prod.indexOf('Emmanuel R5') >= 0 && prod.indexOf('2x Esfiha de Carne') >= 0 && prod.indexOf('R$') < 0, 'produção sem preços');
});

/* ---------- troca de estados da tela de cima ---------- */
teste('Tela de cima: espera → pedido → pagamento → aprovado → (10s) espera', function () {
  var vistos = [], tarefas = [];
  var m = Core.criarMaquinaCliente(function (e) { vistos.push(e.estado); }, function (f, ms) { tarefas.push({ f: f, ms: ms }); return tarefas.length; }, function () {});
  assert.strictEqual(m.atual().estado, 'espera');
  m.receber({ estado: 'pedido', total: 650 });
  m.receber({ estado: 'pedido', total: 650 });          /* repetido: ignorado */
  m.receber({ estado: 'pagamento', tipo: 'cartao', total: 650 });
  m.receber({ estado: 'aprovado', nome: 'Emmanuel', senha: 'R5' });
  assert.deepStrictEqual(vistos, ['pedido', 'pagamento', 'aprovado']);
  assert.strictEqual(tarefas[tarefas.length - 1].ms, 10000, 'aprovado volta em 10s');
  tarefas[tarefas.length - 1].f();
  assert.strictEqual(m.atual().estado, 'espera'); assert.strictEqual(vistos[vistos.length - 1], 'espera');
});
teste('Tela de cima: erro e cancelado voltam à espera em 5s', function () {
  ['erro', 'cancelado'].forEach(function (est) {
    var tarefas = [], m = Core.criarMaquinaCliente(function () {}, function (f, ms) { tarefas.push({ f: f, ms: ms }); return tarefas.length; }, function () {});
    m.receber({ estado: est, mensagem: 'x' });
    assert.strictEqual(tarefas[0].ms, 5000); tarefas[0].f(); assert.strictEqual(m.atual().estado, 'espera');
  });
});
teste('Tela de cima: mensagem nova cancela a volta agendada', function () {
  var cancelados = [], m = Core.criarMaquinaCliente(function () {}, function () { return 7; }, function (t) { cancelados.push(t); });
  m.receber({ estado: 'aprovado' }); m.receber({ estado: 'pedido', total: 1 });
  assert.deepStrictEqual(cancelados, [7]);
});

/* ---------- acompanhamento do pagamento (consulta a cada 2s, limite de 120s) ---------- */
teste('Acompanhar: consulta até o status final e para', function () {
  var Sv = require(path.join(__dirname, '../js/services.js'));
  var sim = Sv.criarPagamentoSimulado(function () { return 650; }), vistos = [];
  return sim.iniciar({ pedidoId: 'P1', itens: [{ id: 'carne', qtd: 1 }], tipo: 'cartao' }).then(function (r) {
    return new Promise(function (resolve) {
      Sv.acompanhar(sim, r.pagamentoId, function (s) { vistos.push(s); if (s === 'aprovado') resolve(); }, { intervalo: 5, limite: 2000 });
      setTimeout(function () { sim.simular(r.pagamentoId, 'processando'); }, 12);
      setTimeout(function () { sim.simular(r.pagamentoId, 'aprovado'); }, 30);
    });
  }).then(function () { assert.strictEqual(vistos[0], 'aguardando_cartao'); assert.ok(vistos.indexOf('processando') > 0); assert.strictEqual(vistos[vistos.length - 1], 'aprovado'); });
});
teste('Acompanhar: expira no limite de tempo', function () {
  var Sv = require(path.join(__dirname, '../js/services.js'));
  var sim = Sv.criarPagamentoSimulado(function () { return 650; });
  return sim.iniciar({ pedidoId: 'P2', itens: [], tipo: 'cartao' }).then(function (r) {
    return new Promise(function (resolve) { Sv.acompanhar(sim, r.pagamentoId, function (s) { if (s === 'expirado') resolve(); }, { intervalo: 5, limite: 40 }); });
  });
});

Promise.all(pendentes).then(function () {
  console.log('\n' + ok + ' testes passaram, ' + falhas.length + ' falharam');
  process.exit(falhas.length ? 1 : 0);
});
