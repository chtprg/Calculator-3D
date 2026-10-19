'use strict';
// Testes do cálculo das faturas. Rodar com: node --test testes/
const test = require('node:test');
const assert = require('node:assert/strict');
const F = require('../js/fatura.js');

// fecha dia 3, vence dia 10 (vence no mesmo mês em que fecha)
const nubank = { id: 'nu', fechamento: 3, vencimento: 10 };
// fecha dia 25, vence dia 5 (vence no mês seguinte ao fechamento)
const bb = { id: 'bb', fechamento: 25, vencimento: 5 };
// fecha dia 31: em mês curto, fecha no último dia
const fim = { id: 'fim', fechamento: 31, vencimento: 8 };

test('compra antes do fechamento entra na fatura aberta', () => {
  const f = F.faturaDaCompra(nubank, '2026-10-02');
  assert.deepEqual(f, { chave: '2026-10', fechamento: '2026-10-03', vencimento: '2026-10-10' });
});

test('compra no dia do fechamento já vai para a próxima fatura (melhor dia de compra)', () => {
  assert.equal(F.faturaDaCompra(nubank, '2026-10-03').chave, '2026-11');
  assert.equal(F.faturaDaCompra(nubank, '2026-10-20').chave, '2026-11');
});

test('vencimento menor que o fechamento cai no mês seguinte', () => {
  assert.deepEqual(F.faturaDaCompra(bb, '2026-10-24'), { chave: '2026-11', fechamento: '2026-10-25', vencimento: '2026-11-05' });
  assert.deepEqual(F.faturaDaCompra(bb, '2026-10-25'), { chave: '2026-12', fechamento: '2026-11-25', vencimento: '2026-12-05' });
});

test('virada de ano', () => {
  assert.deepEqual(F.faturaDaCompra(bb, '2026-12-28'), { chave: '2027-02', fechamento: '2027-01-25', vencimento: '2027-02-05' });
});

test('mês curto: fechamento 31 vira o último dia do mês', () => {
  assert.equal(F.faturaDaCompra(fim, '2027-02-27').fechamento, '2027-02-28');
  assert.equal(F.faturaDaCompra(fim, '2027-02-28').fechamento, '2027-03-31');
  assert.equal(F.faturaDaCompra(fim, '2028-02-28').fechamento, '2028-02-29'); // ano bissexto
  assert.equal(F.faturaDaCompra(fim, '2026-04-29').vencimento, '2026-05-08');
});

test('vencimento 31 em mês curto', () => {
  const c = { fechamento: 20, vencimento: 31 };
  assert.equal(F.faturaDaCompra(c, '2027-02-01').vencimento, '2027-02-28');
});

test('parcelas caem em faturas seguidas', () => {
  const chaves = [0, 1, 2].map(i => F.faturaDaCompra(nubank, '2026-11-15', i).chave);
  assert.deepEqual(chaves, ['2026-12', '2027-01', '2027-02']);
});

test('dividir em parcelas não perde centavo', () => {
  assert.deepEqual(F.dividir(1000, 3), [334, 333, 333]);
  assert.equal(F.dividir(99999, 7).reduce((a, b) => a + b), 99999);
  assert.deepEqual(F.dividir(500, 0), [500]);
});

test('fatura pela chave bate com a fatura da compra', () => {
  for (const c of [nubank, bb, fim]) {
    for (const d of ['2026-01-15', '2026-02-28', '2026-07-31', '2026-12-30']) {
      const f = F.faturaDaCompra(c, d);
      assert.deepEqual(F.faturaPelaChave(c, f.chave), f);
    }
  }
});

test('resumo do mês: cartão conta no mês em que a fatura vence', () => {
  const dados = {
    cartoes: [nubank],
    lancamentos: [
      { id: 1, tipo: 'receita', valor: 300000, data: '2026-10-05', forma: 'pix', fixo: true },
      { id: 2, tipo: 'despesa', valor: 12000, data: '2026-10-08', forma: 'pix', categoria: 'mercado' },
      { id: 3, tipo: 'despesa', valor: 60000, data: '2026-10-20', forma: 'cartao', cartaoId: 'nu', parcelas: 3, categoria: 'casa' },
      { id: 4, tipo: 'despesa', valor: 5590, data: '2026-09-10', forma: 'cartao', cartaoId: 'nu', fixo: true, categoria: 'contas' },
    ],
  };
  const out = F.resumoDoMes(dados, '2026-10');
  assert.equal(out.entrou, 300000);
  assert.equal(out.direto, 12000);
  assert.equal(out.faturas, 5590); // só a assinatura de setembro (a compra parcelada começa em novembro)
  const nov = F.resumoDoMes(dados, '2026-11');
  assert.equal(nov.entrou, 300000); // o salário fixo repete
  assert.equal(nov.faturas, 20000 + 5590);
  assert.equal(nov.saldo, 300000 - 25590);
  assert.equal(F.resumoDoMes(dados, '2027-01').faturas, 20000 + 5590);
  assert.equal(F.resumoDoMes(dados, '2027-02').faturas, 5590);
  assert.equal(F.resumoDoMes(dados, '2026-09').entrou, 0); // o fixo não volta para trás
});

test('fixo com fim para de repetir', () => {
  const l = { data: '2026-01-10', fixo: true, ate: '2026-03' };
  assert.equal(F.fixoValeNoMes(l, '2025-12'), false);
  assert.equal(F.fixoValeNoMes(l, '2026-03'), true);
  assert.equal(F.fixoValeNoMes(l, '2026-04'), false);
});

test('situação da fatura', () => {
  const f = F.faturaDaCompra(nubank, '2026-10-02');
  assert.equal(F.situacao(f, '2026-10-01', false), 'aberta');
  assert.equal(F.situacao(f, '2026-10-03', false), 'fechada');
  assert.equal(F.situacao(f, '2026-10-11', false), 'vencida');
  assert.equal(F.situacao(f, '2026-10-11', true), 'paga');
});

test('reais: escrever e ler', () => {
  assert.equal(F.emReais(123456), 'R$ 1.234,56');
  assert.equal(F.emReais(-500), '− R$ 5,00');
  assert.equal(F.emReais(7, { sinal: true }), '+ R$ 0,07');
  assert.equal(F.lerReais('12'), 1200);
  assert.equal(F.lerReais('12,5'), 1250);
  assert.equal(F.lerReais('1.234,56'), 123456);
  assert.equal(F.lerReais('1234.56'), 123456);
  assert.equal(F.lerReais('1.234'), 123400);
  assert.equal(F.lerReais('R$ 9,90'), 990);
  assert.equal(F.lerReais(''), null);
});

// ---------------------------------------------------------------- renda e dívidas
test('salário fixo cai todo mês no dia certo, e um mês pode vir diferente', () => {
  const dados = { lancamentos: [{ id: 's', tipo: 'receita', valor: 250000, data: '2026-10-10', fixo: true, renda: 'salario', ajustes: { '2026-12': 310000 } }] };
  const nov = F.itensDoMes(dados, '2026-11');
  assert.equal(nov[0].data, '2026-11-10');
  assert.equal(nov[0].valor, 250000);
  assert.equal(F.resumoDoMes(dados, '2026-12').entrou, 310000); // dezembro veio com hora extra
  assert.equal(F.resumoDoMes(dados, '2027-01').entrou, 250000);
});

// o exemplo do Rosival: deve R$ 1.475,76 e paga R$ 200 por mês
const carne = { id: 'd', nome: 'Carnê da loja', total: 147576, parcela: 20000, dia: 15, inicio: '2026-10', pagamentos: {} };

test('dívida: em quantos meses termina', () => {
  const p = F.planoDivida(carne);
  assert.equal(p.n, 8);
  assert.equal(p.fim, '2027-05');
  assert.deepEqual(p.linhas.map(l => l.valor), [20000, 20000, 20000, 20000, 20000, 20000, 20000, 7576]);
  assert.equal(p.proxima.chave, '2026-10');
});

test('dívida: pagou menos, as próximas sobem para terminar na mesma data', () => {
  // com folga na última parcela, só a última sobe
  const a = F.planoDivida({ ...carne, pagamentos: { '2026-10': 15000 } });
  assert.equal(a.fim, '2027-05');
  assert.equal(a.restante, 132576);
  assert.deepEqual(a.linhas.map(l => l.valor), [15000, 20000, 20000, 20000, 20000, 20000, 20000, 12576]);
  // sem folga, as próximas parcelas aumentam por igual
  const b = F.planoDivida({ ...carne, total: 160000, pagamentos: { '2026-10': 15000 } });
  assert.equal(b.fim, '2027-05');
  assert.equal(b.linhas[1].valor, 20715); // 1.450,00 em 7 meses
  assert.equal(b.linhas.reduce((s, l) => s + l.valor, 0), 160000);
});

test('dívida: modo esticar mantém a parcela e termina depois', () => {
  const p = F.planoDivida({ ...carne, total: 160000, modo: 'esticar', pagamentos: { '2026-10': 15000 } });
  assert.equal(p.fim, '2027-06');
  assert.equal(p.linhas[1].valor, 20000);
  assert.equal(p.linhas[p.linhas.length - 1].valor, 5000);
});

test('dívida: pagou mais, termina antes', () => {
  const p = F.planoDivida({ ...carne, pagamentos: { '2026-10': 60000 } });
  assert.equal(p.fim, '2027-03');
});

test('dívida: mês que passou sem pagar fica atrasado e entra no mês', () => {
  const p = F.planoDivida(carne, '2026-12');
  assert.deepEqual(p.linhas.slice(0, 3).map(l => l.tipo), ['atrasado', 'atrasado', 'previsto']);
  assert.equal(p.atrasados, 2);
  assert.equal(p.fim, '2027-05');
  assert.equal(p.linhas[2].valor, Math.ceil(147576 / 6)); // 6 meses para pagar tudo
});

test('dívida: quitada', () => {
  const p = F.planoDivida({ ...carne, pagamentos: { '2026-10': 147576 } });
  assert.equal(p.quitada, true);
  assert.equal(p.linhas.length, 1);
  assert.equal(p.proxima, null);
});

test('resumo do mês conta a parcela da dívida', () => {
  const dados = { dividas: [{ ...carne, pagamentos: { '2026-10': 15000 } }], lancamentos: [] };
  const out = F.resumoDoMes(dados, '2026-10', '2026-10');
  assert.equal(out.dividas, 15000);
  assert.equal(out.saldo, -15000);
  assert.equal(out.itens[0].data, '2026-10-15');
  assert.equal(F.resumoDoMes(dados, '2026-11', '2026-10').dividas, 20000);
});
