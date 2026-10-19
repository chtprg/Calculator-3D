'use strict';
// Testes dos lembretes e da saúde financeira. Rodar com: node --test testes/
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../js/saude.js');
const { DICAS, TEMAS } = require('../js/dicas.js');

const nubank = { id: 'nu', banco: 'nubank', apelido: 'Nubank', fechamento: 3, vencimento: 10 };
const caderno = (extra = {}) => Object.assign({
  cartoes: [nubank], pagas: {}, avisos: {}, dividas: [],
  lancamentos: [
    { id: 's', tipo: 'receita', valor: 250000, data: '2026-08-10', fixo: true, renda: 'salario', categoria: 'salario' },
    { id: 'c', tipo: 'despesa', valor: 30000, data: '2026-09-20', forma: 'cartao', cartaoId: 'nu', categoria: 'mercado' },
  ],
}, extra);

test('fatura vence em até 3 dias: avisa', () => {
  const l = S.lembretes(caderno(), '2026-10-07');
  assert.equal(l[0].tipo, 'fatura-vence');
  assert.equal(l[0].dias, 3);
  assert.equal(l[0].valor, 30000);
  assert.equal(S.lembretes(caderno(), '2026-10-06').length, 0); // 4 dias antes ainda não
});

test('fatura venceu e não está paga: pergunta se já pagou', () => {
  const l = S.lembretes(caderno(), '2026-10-12');
  assert.equal(l[0].tipo, 'fatura-atrasada');
  assert.equal(l[0].dias, -2);
  // marcada como paga, some
  assert.equal(S.lembretes(caderno({ pagas: { 'nu|2026-10': '2026-10-10' } }), '2026-10-12').length, 0);
});

test('"ainda não" cala até amanhã; "tá bom" cala até vencer', () => {
  const cad = caderno();
  const [atrasada] = S.lembretes(cad, '2026-10-12');
  cad.avisos[atrasada.id] = S.silenciarAte(atrasada, 'nao', '2026-10-12');
  assert.equal(S.lembretes(cad, '2026-10-12').length, 0);
  assert.equal(S.lembretes(cad, '2026-10-13').length, 1);
  const cad2 = caderno();
  const [vence] = S.lembretes(cad2, '2026-10-08');
  cad2.avisos[vence.id] = S.silenciarAte(vence, 'ok', '2026-10-08');
  assert.equal(S.lembretes(cad2, '2026-10-09').length, 0);
  assert.equal(S.lembretes(cad2, '2026-10-11')[0].tipo, 'fatura-atrasada'); // passou do dia: aí pergunta
});

test('parcela da dívida: avisa antes e pergunta depois', () => {
  const carne = { id: 'd', nome: 'Carnê', total: 100000, parcela: 20000, dia: 15, inicio: '2026-10', pagamentos: {} };
  const cad = caderno({ cartoes: [], dividas: [carne] });
  assert.equal(S.lembretes(cad, '2026-10-13')[0].tipo, 'divida-vence');
  const l = S.lembretes(cad, '2026-10-16');
  assert.equal(l[0].tipo, 'divida-atrasada');
  assert.equal(l[0].valor, 20000);
  carne.pagamentos['2026-10'] = 20000;
  assert.equal(S.lembretes(cad, '2026-10-16').length, 0);
});

test('cópia de segurança: lembra depois de 15 dias', () => {
  assert.equal(S.lembretes(caderno({ cartoes: [] }), '2026-10-12', { criadoEm: '2026-10-01' }).length, 0);
  const l = S.lembretes(caderno({ cartoes: [] }), '2026-10-16', { criadoEm: '2026-10-01' });
  assert.equal(l[0].tipo, 'copia');
  assert.equal(S.lembretes(caderno({ cartoes: [] }), '2026-10-16', { criadoEm: '2026-09-01', ultimaCopia: '2026-10-10' }).length, 0);
});

test('termômetro: nota e partes', () => {
  const t = S.termometro(caderno({ pagas: { 'nu|2026-10': 'x' }, reserva: 0 }), '2026-10-19');
  assert.equal(t.renda, 250000);
  assert.equal(t.saldo, 220000);
  assert.equal(t.partes.sobra, 40);   // sobrou 88%
  assert.equal(t.partes.dividas, 25); // nada parcelado
  assert.equal(t.partes.atrasos, 15);
  assert.equal(t.partes.reserva, 0);
  assert.equal(t.nota, 80);
  assert.equal(t.nivel, 'saudavel');
  assert.equal(t.essencial, 30000);
});

test('termômetro: caderno vazio não dá nota', () => {
  assert.equal(S.termometro({ cartoes: [], lancamentos: [], dividas: [] }, '2026-10-19').nota, null);
});

test('diagnóstico com os números', () => {
  const cad = caderno({
    pagas: { 'nu|2026-10': 'x' },
    dividas: [{ id: 'd', nome: 'Carnê', total: 147576, parcela: 20000, dia: 15, inicio: '2026-10', pagamentos: { '2026-10': 15000 } }],
    lancamentos: [
      { id: 's', tipo: 'receita', valor: 100000, data: '2026-08-10', fixo: true, renda: 'salario', categoria: 'salario' },
      { id: 'a', tipo: 'despesa', valor: 120000, data: '2026-10-05', forma: 'pix', categoria: 'casa' },
      { id: 'n', tipo: 'despesa', valor: 5590, data: '2026-01-15', forma: 'pix', categoria: 'assinaturas', fixo: true },
    ],
  });
  const ids = S.diagnostico(cad, '2026-10-19').map(d => d.id);
  assert.ok(ids.includes('faltou'));
  assert.ok(ids.includes('assinaturas'));
  assert.ok(ids.includes('divida50'));
});

test('a biblioteca de dicas está completa', () => {
  const temas = new Set(TEMAS.map(t => t.id)), ids = new Set();
  for (const d of DICAS) {
    assert.ok(temas.has(d.tema), d.id);
    assert.ok(d.titulo && d.texto.length > 40, d.id);
    assert.ok(Array.isArray(d.quando) && d.quando.length, d.id);
    assert.ok(!ids.has(d.id), 'repetida: ' + d.id); ids.add(d.id);
  }
  assert.ok(DICAS.length >= 30);
});

test('dica do dia combina com a situação e muda de um dia pro outro', () => {
  const cad = caderno({ dividas: [{ id: 'd', nome: 'Carnê', total: 100000, parcela: 20000, dia: 15, inicio: '2026-10', pagamentos: {} }] });
  const d1 = S.dicaDoDia(DICAS, cad, '2026-10-19'), d2 = S.dicaDoDia(DICAS, cad, '2026-10-20');
  assert.notEqual(d1.id, d2.id);
  const sit = S.situacoes(cad, '2026-10-19');
  assert.ok(d1.quando.some(q => sit.has(q)));
});
