'use strict';
/* Backend do totem: Pix/cartão por link de checkout da InfinitePay.
 * Sem dependências (Node 18+). Segredos só em variáveis de ambiente. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const env = (k, d) => (process.env[k] !== undefined && process.env[k] !== '' ? process.env[k] : d);
const CFG = () => ({
  apiKey: env('INFINITEPAY_API_KEY', ''), handle: env('INFINITEPAY_HANDLE', ''), chaveTotem: env('CHAVE_DO_TOTEM', ''),
  urlPublica: env('URL_PUBLICA', '').replace(/\/$/, ''), cors: env('CORS_ORIGEM', 'https://appassets.androidplatform.net').split(','),
  cardapio: env('CARDAPIO_PATH', path.join(__dirname, '../web/cardapio.json')), simulado: env('PAGAMENTO_SIMULADO', 'false') === 'true',
  base: env('INFINITEPAY_BASE', 'https://api.checkout.infinitepay.io'), dados: env('DATA_FILE', path.join(__dirname, 'pagamentos.json')),
  expiraMs: Number(env('EXPIRA_MS', 5 * 60 * 1000)), simMs: Number(env('SIM_MS', 5000))
});
const HASH_CUPOM = '75d6ccd19ef27ce8adbf15b8a0cd4bb72f8bc67ff12cffec30cacd64cc16a39d'; /* só o hash, nunca o código */
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

/* ---------- armazenamento simples em arquivo (sem dados de cartão) ---------- */
function abrirBanco(arq) {
  let m = {};
  try { m = JSON.parse(fs.readFileSync(arq, 'utf8')); } catch (e) { m = {}; }
  const salvar = () => { try { fs.writeFileSync(arq + '.tmp', JSON.stringify(m)); fs.renameSync(arq + '.tmp', arq); } catch (e) { console.error('falha ao gravar', e.message); } };
  return { get: (id) => m[id], set: (id, v) => { m[id] = v; salvar(); }, todos: () => m };
}

/* ---------- regras de preço (sempre no servidor) ---------- */
function calcular(cfg, itens, cupom) {
  const menu = JSON.parse(fs.readFileSync(cfg.cardapio, 'utf8')); const mapa = {};
  menu.itens.forEach((i) => { mapa[i.id] = i; });
  let subtotal = 0; const linhas = [];
  for (const it of itens || []) {
    const m = mapa[it.id]; const q = Number(it.qtd) | 0;
    if (!m || q < 1 || q > 50) throw Object.assign(new Error('item_invalido'), { http: 400 });
    const unit = Math.round(m.preco * 100); subtotal += unit * q; linhas.push(q + 'x ' + m.nome.pt);
  }
  const cupomOk = !!cupom && sha(String(cupom).replace(/\s+/g, '').toUpperCase()) === HASH_CUPOM;
  const desconto = cupomOk ? Math.round(subtotal * 10 / 100) : 0;
  return { total: subtotal - desconto, subtotal, desconto, descricao: linhas.join(', ') + (cupomOk ? ' (desconto 10%)' : '') };
}

/* ---------- InfinitePay ---------- */
async function ip(cfg, caminho, corpo, comChave) {
  const h = { 'Content-Type': 'application/json' };
  if (comChave && cfg.apiKey) h['X-Api-Key'] = cfg.apiKey;
  const r = await fetch(cfg.base + caminho, { method: 'POST', headers: h, body: JSON.stringify(corpo) });
  const txt = await r.text(); let j = {}; try { j = JSON.parse(txt); } catch (e) { j = { raw: txt }; }
  if (!r.ok) throw Object.assign(new Error('infinitepay_' + r.status), { http: 502 });
  return j;
}
function acharUrl(j) {
  const k = ['url', 'link', 'checkout_url', 'link_url', 'payment_url'];
  for (const c of k) if (typeof j[c] === 'string' && /^https:\/\//.test(j[c])) return j[c];
  const achada = (function varrer(o) { if (!o || typeof o !== 'object') return null; for (const v of Object.values(o)) { if (typeof v === 'string' && /^https:\/\//.test(v)) return v; const r = varrer(v); if (r) return r; } return null; })(j);
  return achada;
}
async function verificar(cfg, p, dados) {
  const j = await ip(cfg, '/payment_check', { handle: cfg.handle, order_nsu: p.id, transaction_nsu: dados.transaction_nsu, slug: dados.invoice_slug || dados.slug }, true);
  return j.success !== false && j.paid === true && Number(j.amount) >= p.valor;
}

/* ---------- servidor ---------- */
function criarServidor(cfgFn) {
  const banco = abrirBanco(cfgFn().dados), limite = new Map();
  const statusDe = (cfg, p) => {
    if (p.status === 'aprovado' || p.status === 'cancelado') return p.status;
    if (cfg.simulado && Date.now() - p.criado >= cfg.simMs) return 'aprovado';
    if (Date.now() - p.criado >= cfg.expiraMs) return 'expirado';
    return 'aguardando_cartao';
  };
  const send = (res, cod, obj, cors) => { const b = JSON.stringify(obj); res.writeHead(cod, Object.assign({ 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(b) }, cors)); res.end(b); };
  const ler = (req) => new Promise((ok, no) => { let s = ''; req.on('data', (c) => { s += c; if (s.length > 100000) { no(new Error('grande')); req.destroy(); } }); req.on('end', () => { try { ok(s ? JSON.parse(s) : {}); } catch (e) { no(Object.assign(new Error('json'), { http: 400 })); } }); });

  return http.createServer(async (req, res) => {
    const cfg = cfgFn(), u = new URL(req.url, 'http://x'), rota = u.pathname;
    const origem = req.headers.origin, cors = {};
    if (origem && cfg.cors.indexOf(origem) >= 0) { cors['Access-Control-Allow-Origin'] = origem; cors['Vary'] = 'Origin'; }
    cors['Access-Control-Allow-Headers'] = 'Content-Type, X-Chave-Totem'; cors['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
    try {
      const ip_ = req.socket.remoteAddress, agora = Date.now(), j = (limite.get(ip_) || []).filter((t) => agora - t < 60000); j.push(agora); limite.set(ip_, j);
      if (j.length > 120) return send(res, 429, { erro: 'muitas_requisicoes' }, cors);

      /* webhook da InfinitePay: sem assinatura, então cada aviso é conferido em /payment_check */
      if (req.method === 'POST' && rota === '/webhook') {
        const d = await ler(req), p = d.order_nsu && banco.get(String(d.order_nsu));
        if (!p) return send(res, 400, { erro: 'pedido_desconhecido' }, cors);
        if (p.status === 'aprovado') return send(res, 200, { ok: true }, cors);       /* idempotente */
        let pago = false; try { pago = await verificar(cfg, p, d); } catch (e) { return send(res, 400, { erro: 'nao_foi_possivel_verificar' }, cors); }
        if (pago) { p.status = 'aprovado'; p.atualizado = Date.now(); p.transacao = d.transaction_nsu; p.metodo = d.capture_method || ''; banco.set(p.id, p); }
        return send(res, 200, { ok: true }, cors);
      }

      /* tudo abaixo exige a chave do totem */
      const chave = String(req.headers['x-chave-totem'] || '');
      const okChave = cfg.chaveTotem && chave.length === cfg.chaveTotem.length && crypto.timingSafeEqual(Buffer.from(chave), Buffer.from(cfg.chaveTotem));
      if (!okChave) return send(res, 401, { erro: 'nao_autorizado' }, cors);

      if (req.method === 'GET' && rota === '/saude') return send(res, 200, { ok: true, simulado: cfg.simulado, provedor: !!(cfg.apiKey && cfg.handle) }, cors);

      if (req.method === 'POST' && rota === '/pagamentos') {
        const d = await ler(req);
        if (!d.pedidoId) return send(res, 400, { erro: 'pedidoId_obrigatorio' }, cors);
        if (d.tipo && d.tipo !== 'pix') return send(res, 400, { erro: 'somente_pix' }, cors);
        const id = String(d.pedidoId).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 60), ja = banco.get(id);
        if (ja && statusDe(cfg, ja) !== 'expirado' && ja.status !== 'cancelado') return send(res, 200, { pagamentoId: id, valor: ja.valor, qrCodeTexto: ja.url }, cors); /* idempotência */
        let c;
        if (d.teste) c = { total: Math.max(100, Number(d.valorTeste) | 0), descricao: 'Teste' }; else c = calcular(cfg, d.itens, d.cupom);
        if (c.total < 100) return send(res, 400, { erro: 'valor_minimo_1_real' }, cors);
        let url = 'https://exemplo.invalid/simulado/' + id;
        if (!cfg.simulado) {
          if (!cfg.apiKey || !cfg.handle || !cfg.urlPublica) return send(res, 500, { erro: 'servidor_sem_configuracao' }, cors);
          const r = await ip(cfg, '/links', { handle: cfg.handle, order_nsu: id, items: [{ quantity: 1, price: c.total, description: ('Casa da Esfiha: ' + c.descricao).slice(0, 120) }],
            webhook_url: cfg.urlPublica + '/webhook', options: { single_payment: true, valid_until: new Date(Date.now() + 10 * 60 * 1000).toISOString() } }, true);
          url = acharUrl(r); if (!url) return send(res, 502, { erro: 'resposta_sem_link' }, cors);
        }
        banco.set(id, { id, valor: c.total, tipo: d.tipo || 'pix', status: 'aguardando', url, criado: Date.now(), atualizado: Date.now() });
        return send(res, 200, { pagamentoId: id, valor: c.total, qrCodeTexto: url }, cors);
      }

      const m = rota.match(/^\/pagamentos\/([A-Za-z0-9_-]+)(\/cancelar)?$/);
      if (m) {
        const p = banco.get(m[1]); if (!p) return send(res, 404, { erro: 'nao_encontrado' }, cors);
        if (req.method === 'GET' && !m[2]) return send(res, 200, { status: statusDe(cfg, p) }, cors);
        if (req.method === 'POST' && m[2]) { if (p.status !== 'aprovado') { p.status = 'cancelado'; p.atualizado = Date.now(); banco.set(p.id, p); } return send(res, 200, { status: p.status }, cors); }
      }
      return send(res, 404, { erro: 'rota_inexistente' }, cors);
    } catch (e) { return send(res, e.http || 500, { erro: e.http ? e.message : 'erro_interno' }, cors); }
  });
}

if (require.main === module) {
  try { require('fs').readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n').forEach((l) => { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim(); }); } catch (e) {}
  const c = CFG();
  if (!c.chaveTotem) { console.error('Defina CHAVE_DO_TOTEM.'); process.exit(1); }
  if (!c.simulado && (!c.apiKey || !c.handle || !c.urlPublica)) console.warn('Aviso: faltam INFINITEPAY_API_KEY, INFINITEPAY_HANDLE ou URL_PUBLICA; pagamentos reais vão falhar.');
  criarServidor(CFG).listen(Number(env('PORT', 3000)), () => console.log('Backend do totem na porta ' + env('PORT', 3000) + (c.simulado ? ' (PAGAMENTO SIMULADO)' : '')));
}
module.exports = { criarServidor, calcular, CFG };
