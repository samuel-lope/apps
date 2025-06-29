# Gerador de Recibo e PIX QR Code

Esta é uma aplicação web simples desenvolvida para facilitar a criação de recibos de pagamento e a geração de códigos PIX.

## Funcionalidades Principais

### Gerador de Recibo
- **Formulário Intuitivo:** Preencha facilmente os dados do pagador, recebedor, valor e a descrição do serviço/produto.
- **Valor por Extenso:** O sistema converte automaticamente o valor numérico para sua representação por extenso (atualmente limitado a R$ 99.999,99).
- **Impressão:** Gere um recibo formatado, pronto para ser impresso ou salvo como PDF.

### Gerador de PIX
- **Criação Rápida:** Gere códigos "PIX Copia e Cola" e o respectivo QR Code de forma rápida.
- **Flexibilidade:** Permite a inclusão de valor, identificador da transação (TxID) e descrição.
- **Segurança:** A integração com a API para gerar o PIX é feita de forma segura, com suporte a autenticação via Bearer Token.
- **Impressão do QR Code:** Facilidade para imprimir o QR Code gerado para pagamentos presenciais.