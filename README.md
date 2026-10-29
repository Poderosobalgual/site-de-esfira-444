# web/ — Totem Casa da Esfiha (SUNMI D2 Mini)

App do totem (`index.html`, 1280x800) e tela de cima do cliente (`cliente.html`, 800x480). HTML + CSS + JS puros (ES2017), sem CDN: tudo roda offline.

## Rodar no navegador
```
cd web
python3 -m http.server 8765        # ou: npx serve .
```
- Totem: http://localhost:8765/index.html?demo=1
- Tela de cima (abra em OUTRA janela do mesmo navegador): http://localhost:8765/cliente.html

`?demo=1` usa pagamento simulado (botões "Simular aprovado/recusado") e impressão simulada (aparece no console e em `window.__impressos`). Sem `?demo=1`, o cartão chama o backend configurado no menu técnico.

## Testes
```
node tests/run.js
```

## Menu técnico
Segure o logo por 3 segundos e digite o PIN (padrão de fábrica **0000** — troque no primeiro uso; PIN do atendente padrão **1234**). Lá ficam a chave Pix, nome/cidade, modo de confirmação, PINs, backend, ID da maquininha, papel 58/80 mm, testes e resumo do dia.

## Pagamento: só Pix, pela InfinitePay
Depois do nome (a tela abre com "Braulino" já preenchido; o cliente pode apagar e escrever o dele), o totem pede ao backend um link de checkout da InfinitePay e mostra o QR Code na tela principal e na tela de cima. A senha só sai quando o backend confirma o pagamento. Não existe cartão, NFC nem maquininha neste projeto.

No menu técnico (segure o logo 3s): endereço do backend e `CHAVE_DO_TOTEM`. A chave `inchk_` fica só no servidor (`INFINITEPAY_API_KEY`), nunca no `web/`.

## Contrato com o backend (`backend/`)
- Header em todas as chamadas: `X-Chave-Totem: <CHAVE_DO_TOTEM>`.
- `POST /pagamentos` `{pedidoId, itens:[{id,qtd}], cupom, tipo}` → `{pagamentoId, valor, qrCodeTexto?}` com **`valor` em centavos**.
  O menu técnico envia `{teste:true, valorTeste:100, itens:[], tipo:"pix"}` no "Teste Pix R$ 1,00". O backend só aceita `tipo: "pix"`.
- `GET /pagamentos/:id` → `{status}` ou texto de status; o app lê o campo `status`.
- `POST /pagamentos/:id/cancelar`, `GET /saude`.

## Ponte Android (`window.SunmiBridge`)
`telaCliente(json)`, `imprimirFila(json)` (devolve o resultado chamando `window.__totemImpressaoResultado(id, '{"ok":true}')`), `info()`, `sairKiosk()`. Job de impressão: `{id, largura, vias:[[{t,a,b,s}...], ...]}` — `t` texto, `a` 'c' centraliza, `b` negrito, `s` tamanho 1–3. O Android também chama `window.receberEstado(json)` na tela de cima.
