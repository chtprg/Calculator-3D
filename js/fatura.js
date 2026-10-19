'use strict';
// O coração do Caderninho: em qual fatura cada compra cai, e quanto sai em cada mês.
// Sem tela aqui dentro, só conta. Roda no navegador e nos testes (node --test).
//
// Como o cartão funciona (o jeito dos bancos brasileiros):
// - A fatura FECHA num dia do mês. Compra feita ANTES desse dia entra na fatura que está aberta.
// - Compra feita NO DIA do fechamento ou depois já vai para a fatura seguinte
//   (por isso o dia do fechamento é o "melhor dia de compra").
// - A fatura VENCE uns dias depois de fechar. Se o dia do vencimento é menor ou igual ao
//   do fechamento, o vencimento é no mês seguinte ao fechamento.
// - Compra parcelada: cada parcela cai numa fatura, uma depois da outra.
// - Mês curto (fevereiro, mês de 30 dias): o dia 31 vira o último dia do mês.
//
// Cada fatura é chamada pelo mês em que VENCE ("2026-11" = a fatura que vence em novembro),
// porque é nesse mês que o dinheiro sai da conta.

(function (raiz) {
  const pad = n => String(n).padStart(2, '0');
  const diasNoMes = (ano, mes) => new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate(); // mes de 0 a 11
  // anda n meses a partir de (ano, mes), devolvendo [ano, mes]
  const somarMeses = (ano, mes, n) => { const t = ano * 12 + mes + n; return [Math.floor(t / 12), ((t % 12) + 12) % 12]; };
  const chaveDe = (ano, mes) => `${ano}-${pad(mes + 1)}`;
  const lerChave = ch => { const [a, m] = ch.split('-').map(Number); return [a, m - 1]; };
  const lerData = iso => { const [a, m, d] = iso.slice(0, 10).split('-').map(Number); return [a, m - 1, d]; };
  const isoDe = (ano, mes, dia) => `${ano}-${pad(mes + 1)}-${pad(dia)}`;
  const diaSeguro = (ano, mes, dia) => Math.min(dia, diasNoMes(ano, mes));
  const proximaChave = (ch, n = 1) => chaveDe(...somarMeses(...lerChave(ch), n));
  const compararChave = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

  // datas de fechamento e vencimento da fatura que FECHA no mês (ano, mes)
  function datasDoFechamento(cartao, ano, mes) {
    const fech = isoDe(ano, mes, diaSeguro(ano, mes, cartao.fechamento));
    const [va, vm] = cartao.vencimento > cartao.fechamento ? [ano, mes] : somarMeses(ano, mes, 1);
    const venc = isoDe(va, vm, diaSeguro(va, vm, cartao.vencimento));
    return { chave: chaveDe(va, vm), fechamento: fech, vencimento: venc };
  }

  // a fatura de uma compra feita no dia `dataIso` (parcela 0 = primeira)
  function faturaDaCompra(cartao, dataIso, parcela = 0) {
    const [a, m, d] = lerData(dataIso);
    const fechaDia = diaSeguro(a, m, cartao.fechamento);
    const [fa, fm] = d < fechaDia ? [a, m] : somarMeses(a, m, 1);
    return datasDoFechamento(cartao, ...somarMeses(fa, fm, parcela));
  }

  // a fatura de um cartão que vence no mês `chave`
  function faturaPelaChave(cartao, chave) {
    const [a, m] = lerChave(chave);
    return datasDoFechamento(cartao, ...(cartao.vencimento > cartao.fechamento ? [a, m] : somarMeses(a, m, -1)));
  }

  // a fatura que está ABERTA hoje (é nela que uma compra feita hoje entra)
  const faturaAberta = (cartao, hojeIso) => faturaDaCompra(cartao, hojeIso);

  // divide em parcelas, em centavos; o que sobra da divisão vai na primeira
  function dividir(totalCentavos, n) {
    n = Math.max(1, n | 0);
    const base = Math.trunc(totalCentavos / n), resto = totalCentavos - base * n;
    return Array.from({ length: n }, (_, i) => base + (i === 0 ? resto : 0));
  }

  // um lançamento fixo ("repete todo mês") aparece nos meses entre o início e o `ate` (se tiver)
  function dataNoMes(lanc, chave) {
    const [, , d] = lerData(lanc.data);
    const [a, m] = lerChave(chave);
    return isoDe(a, m, diaSeguro(a, m, d));
  }
  const fixoValeNoMes = (lanc, chave) =>
    compararChave(chave, lanc.data.slice(0, 7)) >= 0 && (!lanc.ate || compararChave(chave, lanc.ate) <= 0);

  // Tudo que mexe no dinheiro do mês `chave`.
  // Compras no cartão entram pela fatura que VENCE no mês (é quando o dinheiro sai).
  // Devolve uma lista de "itens": { lanc, valor, data, parcela, deParcelas, fatura? }
  function itensDoMes(dados, chave) {
    const cartoes = new Map((dados.cartoes || []).map(c => [c.id, c]));
    const itens = [];
    for (const l of dados.lancamentos || []) {
      const cartao = l.forma === 'cartao' ? cartoes.get(l.cartaoId) : null;
      if (cartao) {
        // datas de compra que podem cair neste mês: a própria (ou as ocorrências do fixo nos meses de antes)
        const compras = l.fixo
          ? [-2, -1, 0].map(k => proximaChave(chave, k)).filter(ch => fixoValeNoMes(l, ch)).map(ch => dataNoMes(l, ch))
          : [l.data];
        for (const dataCompra of compras) {
          const partes = l.fixo ? [l.valor] : dividir(l.valor, l.parcelas || 1);
          partes.forEach((valor, i) => {
            const f = faturaDaCompra(cartao, dataCompra, i);
            if (f.chave === chave) itens.push({ lanc: l, valor, data: dataCompra, parcela: i + 1, deParcelas: partes.length, fatura: f, cartao });
          });
        }
      } else if (l.fixo) {
        if (fixoValeNoMes(l, chave)) itens.push({ lanc: l, valor: l.valor, data: dataNoMes(l, chave), parcela: 1, deParcelas: 1 });
      } else if (l.data.slice(0, 7) === chave) {
        itens.push({ lanc: l, valor: l.valor, data: l.data, parcela: 1, deParcelas: 1 });
      }
    }
    return itens.sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));
  }

  // os itens de uma fatura (cartão + mês de vencimento)
  const itensDaFatura = (dados, cartaoId, chave) =>
    itensDoMes(dados, chave).filter(it => it.cartao && it.cartao.id === cartaoId);

  // o resumo do mês: o que entrou, o que saiu (direto e em faturas) e o saldo
  function resumoDoMes(dados, chave) {
    const itens = itensDoMes(dados, chave);
    let entrou = 0, direto = 0, faturas = 0;
    const porCategoria = {}, porCartao = {};
    for (const it of itens) {
      if (it.lanc.tipo === 'receita') { entrou += it.valor; continue; }
      if (it.cartao) { faturas += it.valor; porCartao[it.cartao.id] = (porCartao[it.cartao.id] || 0) + it.valor; }
      else direto += it.valor;
      const cat = it.lanc.categoria || 'outros';
      porCategoria[cat] = (porCategoria[cat] || 0) + it.valor;
    }
    return { itens, entrou, direto, faturas, saiu: direto + faturas, saldo: entrou - direto - faturas, porCategoria, porCartao };
  }

  // a situação de uma fatura em relação a hoje
  function situacao(fatura, hojeIso, paga) {
    if (paga) return 'paga';
    if (hojeIso < fatura.fechamento) return 'aberta';
    if (hojeIso <= fatura.vencimento) return 'fechada';
    return 'vencida';
  }

  // dinheiro: centavos <-> texto em reais
  function emReais(centavos, { sinal = false } = {}) {
    const neg = centavos < 0, abs = Math.abs(centavos);
    const inteiro = Math.floor(abs / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const txt = `R$ ${inteiro},${pad(abs % 100)}`;
    return neg ? `− ${txt}` : sinal && centavos > 0 ? `+ ${txt}` : txt;
  }
  // aceita "12", "12,5", "1.234,56", "1234.56", "R$ 9,90"; devolve centavos ou null
  function lerReais(txt) {
    let s = String(txt || '').replace(/[^\d.,]/g, '');
    if (!s) return null;
    const ultVirg = s.lastIndexOf(','), ultPonto = s.lastIndexOf('.');
    const dec = ultVirg > -1 ? ultVirg : (ultPonto > -1 && s.length - ultPonto - 1 <= 2 && s.indexOf('.') === ultPonto ? ultPonto : -1);
    const int = (dec > -1 ? s.slice(0, dec) : s).replace(/[.,]/g, '');
    const frac = dec > -1 ? s.slice(dec + 1).replace(/[.,]/g, '').slice(0, 2).padEnd(2, '0') : '00';
    const v = Number(int || '0') * 100 + Number(frac);
    return Number.isFinite(v) ? v : null;
  }

  const Fatura = {
    diasNoMes, somarMeses, chaveDe, lerChave, lerData, isoDe, proximaChave, compararChave,
    datasDoFechamento, faturaDaCompra, faturaPelaChave, faturaAberta, dividir,
    itensDoMes, itensDaFatura, resumoDoMes, situacao, emReais, lerReais, fixoValeNoMes,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Fatura;
  else raiz.Fatura = Fatura;
})(typeof self !== 'undefined' ? self : this);
