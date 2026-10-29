'use strict';
/* Testa o backend contra uma InfinitePay FALSA local. Não usa chave real nem internet. */
const http = require('http'), assert = require('assert'), os = require('os'), path = require('path'), fs = require('fs');
const falso = http.createServer((req, res) => {
  let s = ''; req.on('data', (c) => { s += c; }); req.on('end', () => {
    const b = JSON.parse(s || '{}'); falso.chamadas.push({ url: req.url, key: req.headers['x-api-key'], body: b });
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/links') return res.end(JSON.stringify({ url: 'https://checkout.infinitepay.io/x/abc' }));
    if (req.url === '/payment_check') return res.end(JSON.stringify({ success: true, paid: falso.pago, amount: falso.valor, paid_amount: falso.valor }));
    res.statusCode = 404; res.end('{}');
  });
}); falso.chamadas = [];
falso.listen(0, async () => {
  const dados = path.join(os.tmpdir(), 'pag-' + Date.now() + '.json');
  Object.assign(process.env, { INFINITEPAY_BASE: 'http://127.0.0.1:' + falso.address().port, INFINITEPAY_API_KEY: 'inchk_FALSA', INFINITEPAY_HANDLE: 'loja', CHAVE_DO_TOTEM: 'segredo-do-totem',
    URL_PUBLICA: 'https://meu.exemplo', DATA_FILE: dados, PAGAMENTO_SIMULADO: 'false' });
  const { criarServidor, CFG } = require('./server.js'), srv = criarServidor(CFG);
  srv.listen(0, async () => {
    const B = 'http://127.0.0.1:' + srv.address().port, H = { 'Content-Type': 'application/json', 'X-Chave-Totem': 'segredo-do-totem' };
    const f = async (m, p, b, h) => { const r = await fetch(B + p, { method: m, headers: h || H, body: b ? JSON.stringify(b) : undefined }); return { s: r.status, j: await r.json() }; };
    const itens = [{ id: 'carne', qtd: 2 }, { id: 'coca', qtd: 1 }];
    try {
      assert.strictEqual((await f('GET', '/saude', null, {})).s, 401, 'sem chave = 401');
      assert.strictEqual((await f('GET', '/saude')).j.provedor, true);
      let r = await f('POST', '/pagamentos', { pedidoId: 'P1', itens, cupom: 'indiano10', tipo: 'pix' });
      assert.strictEqual(r.s, 200); assert.strictEqual(r.j.valor, 1710, 'recalculado no servidor, com cupom'); assert.ok(/^https:/.test(r.j.qrCodeTexto));
      const link = falso.chamadas.find((c) => c.url === '/links');
      assert.strictEqual(link.key, 'inchk_FALSA', 'chave enviada só do servidor para a InfinitePay'); assert.strictEqual(link.body.items[0].price, 1710);
      assert.strictEqual(link.body.order_nsu, 'P1'); assert.strictEqual(link.body.webhook_url, 'https://meu.exemplo/webhook');
      r = await f('POST', '/pagamentos', { pedidoId: 'P1', itens, tipo: 'pix' }); assert.strictEqual(r.j.valor, 1710, 'idempotente: devolve o mesmo'); assert.strictEqual(falso.chamadas.filter((c) => c.url === '/links').length, 1);
      assert.strictEqual((await f('GET', '/pagamentos/P1')).j.status, 'aguardando_cartao');
      /* webhook falso (ninguém pagou): conferência recusa */
      falso.pago = false; falso.valor = 1710;
      assert.strictEqual((await f('POST', '/webhook', { order_nsu: 'P1', transaction_nsu: 't', invoice_slug: 's' }, {})).s, 200);
      assert.strictEqual((await f('GET', '/pagamentos/P1')).j.status, 'aguardando_cartao', 'aviso sem pagamento real não aprova');
      /* pagamento real */
      falso.pago = true;
      await f('POST', '/webhook', { order_nsu: 'P1', transaction_nsu: 't', invoice_slug: 's' }, {});
      assert.strictEqual((await f('GET', '/pagamentos/P1')).j.status, 'aprovado'); await f('POST', '/webhook', { order_nsu: 'P1', transaction_nsu: 't', invoice_slug: 's' }, {});
      /* valor pago menor que o pedido não aprova */
      await f('POST', '/pagamentos', { pedidoId: 'P2', itens, tipo: 'pix' }); falso.valor = 1; await f('POST', '/webhook', { order_nsu: 'P2', transaction_nsu: 't', invoice_slug: 's' }, {});
      assert.strictEqual((await f('GET', '/pagamentos/P2')).j.status, 'aguardando_cartao', 'valor pago menor não aprova');
      /* cancelar, item inválido, cartão, mínimo, pedido desconhecido no webhook */
      assert.strictEqual((await f('POST', '/pagamentos/P2/cancelar')).j.status, 'cancelado');
      assert.strictEqual((await f('POST', '/pagamentos', { pedidoId: 'P3', itens: [{ id: 'xx', qtd: 1 }], tipo: 'pix' })).s, 400);
      assert.strictEqual((await f('POST', '/pagamentos', { pedidoId: 'P4', itens, tipo: 'cartao' })).s, 400);
      assert.strictEqual((await f('POST', '/webhook', { order_nsu: 'nao-existe' }, {})).s, 400);
      const arq = fs.readFileSync(dados, 'utf8'); assert.ok(!/inchk_/.test(arq), 'chave nunca vai para o arquivo de dados');
      console.log('backend: todos os testes passaram');
      process.exit(0);
    } catch (e) { console.error('FALHOU:', e.message); process.exit(1); }
  });
});
