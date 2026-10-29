/* Textos em PT, EN e ES. */
(function (raiz) {
  'use strict';
  var T = {
    pt: {
      comecar: 'Toque para começar', aqui: 'Comer aqui', levar: 'Para levar', escolha: 'Como você quer comer?',
      esfihas: 'Esfihas', bebidas: 'Bebidas', seuPedido: 'Seu pedido', vazio: 'Toque nos itens para adicionar',
      total: 'Total', subtotal: 'Subtotal', desconto: 'Desconto (10%)', cancelar: 'Cancelar', pagar: 'Pagar',
      cupom: 'Tenho um cupom', cupomAplicado: 'Cupom aplicado!', cupomInvalido: 'Cupom inválido', aplicar: 'Aplicar',
      atendente: 'Chamar atendente', atendenteChamado: 'Atendente chamado. Aguarde um instante.',
      nomeTitulo: 'Qual é o seu primeiro nome?', nomeDica: 'Chamaremos você pelo nome', continuar: 'Continuar', voltar: 'Voltar', apagar: 'Apagar', espaco: 'Espaço',
      comoPagar: 'Como você quer pagar?', cartao: 'Cartão ou celular (NFC)', pix: 'Pix',
      aproxime: 'Aproxime o cartão ou o celular na maquininha', processando: 'Processando...', aprovado: 'Pagamento aprovado!',
      recusado: 'Pagamento recusado', expirado: 'Tempo esgotado', tentarDeNovo: 'Tentar de novo', pagarPix: 'Pagar com Pix',
      cancelarPag: 'Cancelar pagamento', simAprov: 'Simular aprovado', simRec: 'Simular recusado',
      abraBanco: 'Abra o app do seu banco e pague com Pix', validade: 'Válido por 5 minutos', copiaCola: 'Pix copia e cola',
      mostreComprovante: 'Mostre o comprovante ao atendente', confirmarAtendente: 'Confirmar pagamento (atendente)', pinAtendente: 'PIN do atendente',
      pinErrado: 'PIN incorreto', semConexao: 'Sem conexão. Chame um atendente.', pixNaoConfig: 'Pix não configurado. Chame um atendente.',
      suaSenha: 'Sua senha', retire: 'Retire seu pedido no balcão', chameAtendente: 'Chame um atendente', reimprimir: 'Reimprimir', impressoraFalhou: 'Impressora indisponível',
      novoPedido: 'Novo pedido', confirmarCancelar: 'Cancelar o pedido?', confirmarCancelarTxt: 'Os itens serão removidos.', sim: 'Sim, cancelar', nao: 'Não, continuar',
      aindaAi: 'Você ainda está aí?', aindaAiTxt: 'O pedido será limpo em', segundos: 's', toqueContinuar: 'Toque para continuar',
      aguardando: 'Aguardando pedido', seuPedidoCli: 'Seu pedido', pagamento: 'Pagamento', erroMsg: 'Algo deu errado. Tente novamente.', cancelMsg: 'Pedido cancelado',
      acess: 'Acessibilidade', altoContraste: 'Alto contraste', letraGrande: 'Letra grande', cadeirante: 'Modo cadeirante', daltonismo: 'Daltonismo', voz: 'Leitura por voz', som: 'Som',
      fechar: 'Fechar', menuTecnico: 'Menu técnico', pin: 'PIN', entrar: 'Entrar', salvar: 'Salvar',
      jaPaguei: 'Já paguei', pagarCelular: 'Pagar pelo celular (Pix ou cartão)', abraCamera: 'Aponte a câmera do celular para o QR Code e pague com Pix', pagoCom: 'Pago', carregando: 'Carregando...'
    },
    en: {
      comecar: 'Touch to start', aqui: 'Eat here', levar: 'Take away', escolha: 'How would you like to eat?',
      esfihas: 'Esfihas', bebidas: 'Drinks', seuPedido: 'Your order', vazio: 'Tap items to add them',
      total: 'Total', subtotal: 'Subtotal', desconto: 'Discount (10%)', cancelar: 'Cancel', pagar: 'Pay',
      cupom: 'I have a coupon', cupomAplicado: 'Coupon applied!', cupomInvalido: 'Invalid coupon', aplicar: 'Apply',
      atendente: 'Call staff', atendenteChamado: 'Staff called. Please wait a moment.',
      nomeTitulo: 'What is your first name?', nomeDica: 'We will call you by name', continuar: 'Continue', voltar: 'Back', apagar: 'Delete', espaco: 'Space',
      comoPagar: 'How would you like to pay?', cartao: 'Card or phone (NFC)', pix: 'Pix',
      aproxime: 'Tap your card or phone on the card reader', processando: 'Processing...', aprovado: 'Payment approved!',
      recusado: 'Payment declined', expirado: 'Time is up', tentarDeNovo: 'Try again', pagarPix: 'Pay with Pix',
      cancelarPag: 'Cancel payment', simAprov: 'Simulate approved', simRec: 'Simulate declined',
      abraBanco: 'Open your bank app and pay with Pix', validade: 'Valid for 5 minutes', copiaCola: 'Pix copy and paste',
      mostreComprovante: 'Show the receipt to the staff', confirmarAtendente: 'Confirm payment (staff)', pinAtendente: 'Staff PIN',
      pinErrado: 'Wrong PIN', semConexao: 'No connection. Call staff.', pixNaoConfig: 'Pix not set up. Call staff.',
      suaSenha: 'Your number', retire: 'Pick up your order at the counter', chameAtendente: 'Call staff', reimprimir: 'Reprint', impressoraFalhou: 'Printer unavailable',
      novoPedido: 'New order', confirmarCancelar: 'Cancel the order?', confirmarCancelarTxt: 'Items will be removed.', sim: 'Yes, cancel', nao: 'No, keep going',
      aindaAi: 'Are you still there?', aindaAiTxt: 'The order will be cleared in', segundos: 's', toqueContinuar: 'Touch to continue',
      aguardando: 'Waiting for an order', seuPedidoCli: 'Your order', pagamento: 'Payment', erroMsg: 'Something went wrong. Please try again.', cancelMsg: 'Order cancelled',
      acess: 'Accessibility', altoContraste: 'High contrast', letraGrande: 'Large text', cadeirante: 'Wheelchair mode', daltonismo: 'Color blind', voz: 'Voice reading', som: 'Sound',
      fechar: 'Close', menuTecnico: 'Technical menu', pin: 'PIN', entrar: 'Enter', salvar: 'Save',
      jaPaguei: 'I have paid', pagarCelular: 'Pay with your phone (Pix or card)', abraCamera: 'Point your phone camera at the QR Code and pay with Pix', pagoCom: 'Paid', carregando: 'Loading...'
    },
    es: {
      comecar: 'Toca para empezar', aqui: 'Comer aquí', levar: 'Para llevar', escolha: '¿Cómo quieres comer?',
      esfihas: 'Esfihas', bebidas: 'Bebidas', seuPedido: 'Tu pedido', vazio: 'Toca los productos para agregar',
      total: 'Total', subtotal: 'Subtotal', desconto: 'Descuento (10%)', cancelar: 'Cancelar', pagar: 'Pagar',
      cupom: 'Tengo un cupón', cupomAplicado: '¡Cupón aplicado!', cupomInvalido: 'Cupón inválido', aplicar: 'Aplicar',
      atendente: 'Llamar al personal', atendenteChamado: 'Personal llamado. Espera un momento.',
      nomeTitulo: '¿Cuál es tu primer nombre?', nomeDica: 'Te llamaremos por tu nombre', continuar: 'Continuar', voltar: 'Volver', apagar: 'Borrar', espaco: 'Espacio',
      comoPagar: '¿Cómo quieres pagar?', cartao: 'Tarjeta o celular (NFC)', pix: 'Pix',
      aproxime: 'Acerca la tarjeta o el celular a la terminal', processando: 'Procesando...', aprovado: '¡Pago aprobado!',
      recusado: 'Pago rechazado', expirado: 'Se acabó el tiempo', tentarDeNovo: 'Intentar de nuevo', pagarPix: 'Pagar con Pix',
      cancelarPag: 'Cancelar pago', simAprov: 'Simular aprobado', simRec: 'Simular rechazado',
      abraBanco: 'Abre la app de tu banco y paga con Pix', validade: 'Válido por 5 minutos', copiaCola: 'Pix copia y pega',
      mostreComprovante: 'Muestra el comprobante al personal', confirmarAtendente: 'Confirmar pago (personal)', pinAtendente: 'PIN del personal',
      pinErrado: 'PIN incorrecto', semConexao: 'Sin conexión. Llama al personal.', pixNaoConfig: 'Pix no configurado. Llama al personal.',
      suaSenha: 'Tu número', retire: 'Retira tu pedido en el mostrador', chameAtendente: 'Llama al personal', reimprimir: 'Reimprimir', impressoraFalhou: 'Impresora no disponible',
      novoPedido: 'Nuevo pedido', confirmarCancelar: '¿Cancelar el pedido?', confirmarCancelarTxt: 'Se quitarán los productos.', sim: 'Sí, cancelar', nao: 'No, continuar',
      aindaAi: '¿Sigues ahí?', aindaAiTxt: 'El pedido se borrará en', segundos: 's', toqueContinuar: 'Toca para continuar',
      aguardando: 'Esperando pedido', seuPedidoCli: 'Tu pedido', pagamento: 'Pago', erroMsg: 'Algo salió mal. Intenta de nuevo.', cancelMsg: 'Pedido cancelado',
      acess: 'Accesibilidad', altoContraste: 'Alto contraste', letraGrande: 'Letra grande', cadeirante: 'Modo silla de ruedas', daltonismo: 'Daltonismo', voz: 'Lectura por voz', som: 'Sonido',
      fechar: 'Cerrar', menuTecnico: 'Menú técnico', pin: 'PIN', entrar: 'Entrar', salvar: 'Guardar',
      jaPaguei: 'Ya pagué', pagarCelular: 'Pagar con el celular (Pix o tarjeta)', abraCamera: 'Apunta la cámara del celular al código QR y paga con Pix', pagoCom: 'Pagado', carregando: 'Cargando...'
    }
  };
  var lang = 'pt';
  raiz.I18N = {
    langs: ['pt', 'en', 'es'],
    set: function (l) { if (T[l]) lang = l; },
    get: function () { return lang; },
    t: function (k) { return (T[lang] && T[lang][k]) || T.pt[k] || k; },
    nome: function (item) { return item.nome[lang] || item.nome.pt; },
    voz: function () { return lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR'; }
  };
  if (typeof module !== 'undefined') module.exports = raiz.I18N;
})(typeof window !== 'undefined' ? window : globalThis);
