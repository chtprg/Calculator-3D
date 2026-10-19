'use strict';
// Saúde financeira e lembretes: tudo calculado no próprio celular, com os números do caderno.
// Sem tela aqui dentro, só conta. Roda no navegador e nos testes (node --test).

(function (raiz) {
  const F = typeof module !== 'undefined' && module.exports ? require('./fatura.js') : raiz.Fatura;
  const R = c => F.emReais(c);
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const nomeMes = ch => MESES[F.lerChave(ch)[1]];
  const limitar = (v, a, b) => Math.min(b, Math.max(a, v));
  const soma = (lista, f = x => x.valor) => lista.reduce((s, x) => s + f(x), 0);

  // dias de `de` até `ate` (datas AAAA-MM-DD); negativo se `ate` já passou
  function diasAte(de, ate) {
    const [a, m, d] = F.lerData(de), [b, n, e] = F.lerData(ate);
    return Math.round((Date.UTC(b, n, e) - Date.UTC(a, m, d)) / 864e5);
  }
  const somarDias = (iso, n) => { const [a, m, d] = F.lerData(iso); return new Date(Date.UTC(a, m, d + n)).toISOString().slice(0, 10); };

  // ---------------------------------------------------------------- lembretes
  // O que perguntar quando o app abre:
  // - fatura que venceu e não foi marcada como paga (até 60 dias atrás): "já pagou?"
  // - fatura que vence em até 3 dias: "vence dia tal"
  // - parcela de dívida que passou do dia sem pagamento marcado (até 3 meses atrás): "já pagou?"
  // - parcela de dívida que vence em até 3 dias
  // - cópia de segurança: 15 dias sem salvar
  // `cad.avisos` guarda até quando cada lembrete fica quieto ({ id: 'AAAA-MM-DD' }).
  const ANTES = 3, COPIA_DIAS = 15;
  function lembretes(cad, hoje, { ultimaCopia, criadoEm, todos = false } = {}) {
    const out = [], hojeCh = hoje.slice(0, 7), quieto = cad.avisos || {};
    for (const c of cad.cartoes || []) {
      const aberta = F.faturaAberta(c, hoje).chave;
      for (let k = -3; k <= 0; k++) {
        const ch = F.proximaChave(aberta, k);
        if (cad.pagas && cad.pagas[c.id + '|' + ch]) continue;
        const valor = soma(F.itensDaFatura(cad, c.id, ch));
        if (!valor) continue;
        const fatura = F.faturaPelaChave(c, ch), dias = diasAte(hoje, fatura.vencimento);
        const base = { cartao: c, chave: ch, fatura, valor, dias, ate: fatura.vencimento };
        if (dias < 0 && dias >= -60) out.push(Object.assign({ id: `fat|${c.id}|${ch}|atrasada`, tipo: 'fatura-atrasada' }, base));
        else if (dias >= 0 && dias <= ANTES) out.push(Object.assign({ id: `fat|${c.id}|${ch}|vence`, tipo: 'fatura-vence' }, base));
      }
    }
    for (const d of cad.dividas || []) {
      const p = F.planoDivida(d, hojeCh);
      for (const l of p.linhas) {
        if (l.tipo === 'pago') continue;
        const [a, m] = F.lerChave(l.chave);
        const venc = F.isoDe(a, m, Math.min(d.dia || 1, F.diasNoMes(a, m))), dias = diasAte(hoje, venc);
        const base = { divida: d, chave: l.chave, valor: l.esperado, dias, ate: venc };
        if (dias < 0 && dias >= -92) out.push(Object.assign({ id: `div|${d.id}|${l.chave}|atrasada`, tipo: 'divida-atrasada' }, base));
        else if (dias >= 0 && dias <= ANTES) out.push(Object.assign({ id: `div|${d.id}|${l.chave}|vence`, tipo: 'divida-vence' }, base));
      }
    }
    const tem = (cad.lancamentos || []).length + (cad.dividas || []).length + (cad.cartoes || []).length;
    const ref = (ultimaCopia || criadoEm || '').slice(0, 10);
    if (tem && ref && diasAte(ref, hoje) >= COPIA_DIAS) out.push({ id: 'copia', tipo: 'copia', dias: diasAte(ref, hoje), nunca: !ultimaCopia });

    const ordem = { 'fatura-atrasada': 0, 'divida-atrasada': 1, 'fatura-vence': 2, 'divida-vence': 3, copia: 4 };
    return out
      .filter(x => todos || !(quieto[x.id] && quieto[x.id] >= hoje))
      .sort((a, b) => ordem[a.tipo] - ordem[b.tipo] || (a.dias || 0) - (b.dias || 0));
  }

  // até quando um lembrete fica quieto, conforme a resposta
  function silenciarAte(lembrete, resposta, hoje) {
    if (resposta === 'ok' && lembrete.ate) return lembrete.ate;        // "tá bom": só volta se atrasar
    if (lembrete.tipo === 'copia') return somarDias(hoje, 3);           // "depois": daqui a 3 dias
    return hoje;                                                        // "ainda não": pergunta amanhã de novo
  }

  // ---------------------------------------------------------------- termômetro
  // Uma nota de 0 a 100, somando quatro coisas (sem julgamento, só referência):
  // - sobra do mês (até 40): 20% da renda ou mais é a nota cheia
  // - parcelas e dívidas (até 25): até 10% da renda é nota cheia; 50% ou mais, zero
  // - contas atrasadas (até 15): nenhuma é nota cheia
  // - reserva de emergência (até 20): 6 meses de gastos é a nota cheia
  const ESSENCIAIS = new Set(['mercado', 'casa', 'contas', 'transporte', 'saude', 'educacao', 'dividas', 'pets']);

  function termometro(cad, hoje) {
    const ch = hoje.slice(0, 7);
    const r = F.resumoDoMes(cad, ch, ch);
    const renda = r.entrou;
    const gastos = [-3, -2, -1].map(k => F.resumoDoMes(cad, F.proximaChave(ch, k), ch).saiu).filter(v => v > 0);
    const gastoMedio = gastos.length ? Math.round(soma(gastos, x => x) / gastos.length) : r.saiu;
    const parcelado = soma(r.itens.filter(it => it.cartao && it.deParcelas > 1));
    const comprometido = r.dividas + parcelado;
    const atrasos = lembretes(cad, hoje, { todos: true }).filter(l => l.tipo.endsWith('atrasada')).length;
    const reserva = cad.reserva || 0;
    const mesesReserva = gastoMedio ? reserva / gastoMedio : null;
    const vazio = !r.itens.length && !reserva;

    const sobraPct = renda ? r.saldo / renda : null;
    const comprPct = renda ? comprometido / renda : null;
    const partes = {
      sobra: sobraPct == null ? 0 : Math.round(limitar(sobraPct / 0.2, 0, 1) * 40),
      dividas: comprPct == null ? (comprometido ? 0 : 25) : Math.round(limitar(1 - (comprPct - 0.1) / 0.4, 0, 1) * 25),
      atrasos: atrasos === 0 ? 15 : atrasos === 1 ? 7 : 0,
      reserva: mesesReserva == null ? 0 : Math.round(limitar(mesesReserva / 6, 0, 1) * 20),
    };
    const nota = vazio ? null : partes.sobra + partes.dividas + partes.atrasos + partes.reserva;
    const nivel = nota == null ? 'vazio' : nota >= 75 ? 'saudavel' : nota >= 50 ? 'caminho' : nota >= 25 ? 'atencao' : 'apertado';

    // 50/30/20: essenciais, desejos e o que sobra, em relação ao que entrou
    let essencial = 0, desejos = 0;
    for (const [cat, v] of Object.entries(r.porCategoria)) (ESSENCIAIS.has(cat) ? (essencial += v) : (desejos += v));

    return { nota, nivel, partes, renda, saldo: r.saldo, saiu: r.saiu, sobraPct, comprometido, comprPct, atrasos, reserva, gastoMedio, mesesReserva, essencial, desejos, resumo: r };
  }

  // ---------------------------------------------------------------- diagnóstico: dicas com os números de vocês
  function diagnostico(cad, hoje) {
    const ch = hoje.slice(0, 7), t = termometro(cad, hoje), r = t.resumo, out = [];
    const anterior = F.resumoDoMes(cad, F.proximaChave(ch, -1), ch);
    const cats = Object.entries(r.porCategoria).sort((a, b) => b[1] - a[1]);

    if (t.saldo < 0) {
      out.push({ id: 'faltou', tom: 'atencao', titulo: `Faltou ${R(-t.saldo)} em ${nomeMes(ch)}`,
        texto: cats.length ? `Onde mais saiu: ${cats.slice(0, 2).map(([c, v]) => `${NOMES[c] || c} (${R(v)})`).join(' e ')}. É por aí que dá pra começar.` : '' });
    } else if (t.saldo > 0 && t.renda) {
      let texto = `É ${Math.round(t.sobraPct * 100)}% do que entrou.`;
      if (t.gastoMedio && t.reserva < t.gastoMedio) {
        const meses = Math.ceil((t.gastoMedio - t.reserva) / Math.max(1, Math.floor(t.saldo / 2)));
        texto += ` Guardando metade da sobra todo mês, em ${meses} ${meses === 1 ? 'mês' : 'meses'} a reserva cobre um mês inteiro de gastos.`;
      } else if (t.mesesReserva != null && t.mesesReserva >= 1) {
        texto += ` A reserva já cobre ${t.mesesReserva.toFixed(1).replace('.', ',')} meses de gastos.`;
      }
      out.push({ id: 'sobrou', tom: 'bom', titulo: `Sobra de ${R(t.saldo)} em ${nomeMes(ch)}`, texto });
    }

    if (t.atrasos) out.push({ id: 'atrasos', tom: 'atencao', titulo: t.atrasos === 1 ? 'Tem uma conta atrasada' : `Tem ${t.atrasos} contas atrasadas`,
      texto: 'Pagar em dia evita multa e juros. Se já pagou, é só marcar (o sininho lá em cima mostra quais).' });

    if (t.comprPct != null && t.comprPct > 0.3) out.push({ id: 'comprometido', tom: 'atencao',
      titulo: `${Math.round(t.comprPct * 100)}% do que entra já vai pra parcelas e dívidas`,
      texto: 'Uma referência comum é deixar isso abaixo de 30%. Antes de parcelar algo novo, vale esperar umas parcelas acabarem.' });

    // a categoria que mais cresceu em relação ao mês anterior
    let subiu = null;
    for (const [c, v] of cats) {
      const antes = anterior.porCategoria[c] || 0;
      if (antes && v > antes * 1.3 && v - antes >= 5000 && (!subiu || v - antes > subiu.dif)) subiu = { c, v, antes, dif: v - antes };
    }
    if (subiu) out.push({ id: 'subiu', tom: 'atencao', titulo: `${NOMES[subiu.c] || subiu.c} subiu ${Math.round((subiu.v / subiu.antes - 1) * 100)}%`,
      texto: `Foi de ${R(subiu.antes)} em ${nomeMes(F.proximaChave(ch, -1))} para ${R(subiu.v)} agora.` });

    const comida = r.porCategoria.comida || 0;
    if (t.saiu && comida / t.saiu > 0.15) out.push({ id: 'comida', tom: 'dica', titulo: `Comida fora é ${Math.round(comida / t.saiu * 100)}% dos gastos`,
      texto: `Foram ${R(comida)} este mês. Trocar uma saída por semana por comida feita em casa já faz diferença.` });

    const assin = (cad.lancamentos || []).filter(l => l.fixo && l.categoria === 'assinaturas' && F.fixoValeNoMes(l, ch));
    if (assin.length) {
      const mes = soma(assin, l => F.valorNoMes(l, ch));
      out.push({ id: 'assinaturas', tom: 'dica', titulo: `Assinaturas: ${R(mes)} por mês`, texto: `Dá ${R(mes * 12)} por ano. Vale olhar se usa todas.` });
    }

    // parcelas de cartão que já estão compradas para os próximos meses
    let futuro = 0, ultimo = null;
    for (let k = 1; k <= 36; k++) {
      const m = F.proximaChave(ch, k), v = soma(F.itensDoMes(cad, m, ch).filter(it => it.cartao && it.deParcelas > 1));
      if (v) { futuro += v; ultimo = m; }
    }
    if (futuro) out.push({ id: 'parcelas', tom: 'dica', titulo: `${R(futuro)} já comprometidos em parcelas do cartão`,
      texto: `Vão até ${nomeMes(ultimo)} de ${ultimo.slice(0, 4)}. É dinheiro de meses que ainda nem chegaram.` });

    // dívida: quanto adianta pagar R$ 50 a mais por mês
    const abertas = (cad.dividas || []).map(d => ({ d, p: F.planoDivida(d, ch) })).filter(x => !x.p.quitada).sort((a, b) => b.p.restante - a.p.restante);
    if (abertas.length) {
      const { d, p } = abertas[0];
      const agora = Math.ceil(p.restante / d.parcela), com50 = Math.ceil(p.restante / (d.parcela + 5000));
      if (agora - com50 >= 1) out.push({ id: 'divida50', tom: 'dica', titulo: `${d.nome}: R$ 50 a mais por mês`,
        texto: `Pagando ${R(d.parcela + 5000)} em vez de ${R(d.parcela)}, termina ${agora - com50 === 1 ? 'um mês' : `${agora - com50} meses`} antes.` });
    }
    return out;
  }
  const NOMES = {
    mercado: 'Mercado', comida: 'Comida fora', casa: 'Casa', contas: 'Contas da casa', transporte: 'Transporte', saude: 'Saúde',
    lazer: 'Lazer', roupas: 'Roupas', educacao: 'Estudos', pets: 'Bichinhos', presentes: 'Presentes', assinaturas: 'Assinaturas',
    beleza: 'Beleza', outros: 'Outros', dividas: 'Dívidas e carnês',
  };

  // ---------------------------------------------------------------- a dica do dia
  // Escolhe entre as dicas que combinam com a situação; muda uma vez por dia.
  function situacoes(cad, hoje) {
    const t = termometro(cad, hoje), s = new Set(['sempre']);
    if ((cad.dividas || []).some(d => !F.planoDivida(d, hoje.slice(0, 7)).quitada) || t.comprometido) s.add('divida');
    if ((cad.cartoes || []).length) s.add('cartao');
    if (t.saldo < 0) s.add('negativo');
    if (t.saldo > 0) s.add('sobra');
    if (t.mesesReserva == null || t.mesesReserva < 1) s.add('sem-reserva');
    if (t.mesesReserva != null && t.mesesReserva >= 3) s.add('reserva-ok');
    return s;
  }
  function dicaDoDia(dicas, cad, hoje) {
    const s = situacoes(cad, hoje);
    const boas = dicas.filter(d => d.quando.some(q => s.has(q) && q !== 'sempre'));
    const lista = boas.length ? boas : dicas;
    const [a, m, d] = F.lerData(hoje), dia = Math.floor(Date.UTC(a, m, d) / 864e5);
    return lista[dia % lista.length];
  }

  const Saude = { diasAte, somarDias, lembretes, silenciarAte, termometro, diagnostico, situacoes, dicaDoDia, ESSENCIAIS };
  if (typeof module !== 'undefined' && module.exports) module.exports = Saude;
  else raiz.Saude = Saude;
})(typeof self !== 'undefined' ? self : this);
