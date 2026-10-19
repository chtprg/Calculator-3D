'use strict';
// Os bancos, com o logo de verdade e a cor do cartão.
// Logos: coleção "Bancos em SVG" (github.com/Tgentil/Bancos-em-SVG). Uso pessoal, sem distribuição.
const BANCOS = [
  { id: 'nubank', nome: 'Nubank', cor: '#820ad1', texto: '#fff' },
  { id: 'bb', nome: 'Banco do Brasil', cor: '#f8d117', texto: '#1b2f7a' },
  { id: 'itau', nome: 'Itaú', cor: '#ec7000', texto: '#fff' },
  { id: 'bradesco', nome: 'Bradesco', cor: '#cc092f', texto: '#fff' },
  { id: 'santander', nome: 'Santander', cor: '#d9150b', texto: '#fff' },
  { id: 'caixa', nome: 'Caixa', cor: '#005ca9', texto: '#fff' },
  { id: 'inter', nome: 'Inter', cor: '#ff7a00', texto: '#fff' },
  { id: 'c6', nome: 'C6 Bank', cor: '#242424', texto: '#f5f0e6' },
  { id: 'mercadopago', nome: 'Mercado Pago', cor: '#00a3e0', texto: '#fff' },
  { id: 'picpay', nome: 'PicPay', cor: '#11a85f', texto: '#fff' },
  { id: 'neon', nome: 'Neon', cor: '#0b2a4a', texto: '#e8f6ff' },
  { id: 'pagbank', nome: 'PagBank', cor: '#1b7f4e', texto: '#fff' },
  { id: 'sicoob', nome: 'Sicoob', cor: '#003641', texto: '#e9f7ef' },
  { id: 'sicredi', nome: 'Sicredi', cor: '#3a8f12', texto: '#fff' },
  { id: 'pan', nome: 'Banco Pan', cor: '#0090d6', texto: '#fff' },
  { id: 'bnb', nome: 'Banco do Nordeste', cor: '#a6193c', texto: '#fff' },
  { id: 'xp', nome: 'XP', cor: '#151515', texto: '#f5f0e6' },
  { id: 'btg', nome: 'BTG Pactual', cor: '#0d2240', texto: '#fff' },
  { id: 'original', nome: 'Original', cor: '#0b7a46', texto: '#fff' },
  { id: 'banrisul', nome: 'Banrisul', cor: '#0055a4', texto: '#fff' },
  { id: 'outro', nome: 'Outro banco', cor: '#6b5b4b', texto: '#fff', semLogo: true },
];
const bancoPorId = id => BANCOS.find(b => b.id === id) || BANCOS[BANCOS.length - 1];
