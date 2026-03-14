import React from 'react';
import { motion } from 'motion/react';
import { MessageCircle, HelpCircle, PackageX, AlertTriangle, ArrowRight } from 'lucide-react';

export function PaginaContato() {
  const WHATSAPP_NUMBER = '5513974055873';

  return (
    <div className="min-h-screen bg-black pt-28 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6 uppercase tracking-tight">
            Central de <span className="text-red-600">Atendimento</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Estamos aqui para ajudar com qualquer dúvida, problema ou cancelamento de pedido.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Fale Conosco (WhatsApp) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900 border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center hover:border-red-500/30 transition-colors"
          >
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
              <MessageCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Fale Conosco</h2>
            <p className="text-zinc-400 mb-8 flex-grow">
              Suporte rápido para compras, dúvidas sobre os discos, relato de bugs ou problemas na entrega via WhatsApp.
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20um%20pedido%20na%20loja%20Sylvio%27s%20Records!`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl transition-all"
            >
              Chamar no WhatsApp <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>

          {/* Política de Cancelamento */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900 border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center hover:border-red-500/30 transition-colors"
          >
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
              <PackageX className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Cancelamentos</h2>
            <p className="text-zinc-400 mb-8 flex-grow">
              Mudou de ideia? Você pode solicitar o cancelamento integral do seu pedido antes do envio diretamente pelo nosso WhatsApp.
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=Ol%C3%A1%2C%20gostaria%20de%20solicitar%20o%20cancelamento%20do%20meu%20pedido.%20Meu%20cpf%2Femail%20%C3%A9:`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 px-8 rounded-xl transition-all"
            >
              Solicitar Cancelamento <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>
        </div>

        {/* Como funciona o processo de cancelamento (Explicativo) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-black/50 border border-red-900/30 rounded-2xl p-8"
        >
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Como funciona o Reembolso?</h3>
              <p className="text-zinc-400 mb-4 leading-relaxed">
                Nossos pagamentos são processados com total segurança pelo <strong>Mercado Pago</strong>. 
                Assim que você solicitar o cancelamento no WhatsApp (informando os dados da compra), nossa equipe fará o estorno 
                diretamente pelo painel do Mercado Pago.
              </p>
              <ul className="text-zinc-400 space-y-2 list-disc list-inside">
                <li><strong>Cartão de Crédito:</strong> O valor estornado constará na próxima fatura (ou na seguinte, dependendo do fechamento).</li>
                <li><strong>PIX:</strong> O valor é devolvido em até 24h para a mesma conta bancária de origem.</li>
              </ul>
              <p className="text-zinc-500 text-sm mt-4 italic">
                * Importante: Caso o pedido já tenha sido despachado (com código de rastreio gerado), será necessário recusar o recebimento no ato da entrega para que o reembolso seja processado após o retorno do disco.
              </p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
