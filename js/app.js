'use strict';
// As telas do Caderninho. JavaScript puro, sem frameworks.

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const R = (c, o) => Fatura.emReais(c, o);

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

const CATEGORIAS = {
  despesa: [
    { id: 'mercado', nome: 'Mercado' }, { id: 'comida', nome: 'Comida fora' }, { id: 'casa', nome: 'Casa' },
    { id: 'contas', nome: 'Contas da casa' }, { id: 'transporte', nome: 'Transporte' }, { id: 'saude', nome: 'Saúde' },
    { id: 'lazer', nome: 'Lazer' }, { id: 'roupas', nome: 'Roupas' }, { id: 'educacao', nome: 'Estudos' },
    { id: 'pets', nome: 'Bichinhos' }, { id: 'presentes', nome: 'Presentes' }, { id: 'assinaturas', nome: 'Assinaturas' },
    { id: 'beleza', nome: 'Beleza' }, { id: 'outros', nome: 'Outros' },
  ],
  receita: [
    { id: 'salario', nome: 'Salário' }, { id: 'extra', nome: 'Um extra' }, { id: 'recebido', nome: 'Recebi de alguém' }, { id: 'outros', nome: 'Outros' },
  ],
};
const categoria = (tipo, id) => CATEGORIAS[tipo].find(c => c.id === id) || CATEGORIAS[tipo][CATEGORIAS[tipo].length - 1];
const FORMAS = { pix: 'Pix', debito: 'Débito', dinheiro: 'Dinheiro' };

// "hoje" é a data do aparelho (dá para fixar com ?hoje=2026-10-19, para testes e prints)
const hojeIso = () => {
  const p = new URLSearchParams(location.search).get('hoje');
  if (p && /^\d{4}-\d{2}-\d{2}$/.test(p)) return p;
  const d = new Date(); return Fatura.isoDe(d.getFullYear(), d.getMonth(), d.getDate());
};
const dataBonita = iso => { const [, m, d] = Fatura.lerData(iso); return `${d} de ${MES_CURTO[m]}`; };
const diaMes = iso => { const [, m, d] = Fatura.lerData(iso); return `${String(d).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}`; };
const nomeMes = ch => { const [a, m] = Fatura.lerChave(ch); return `${MESES[m]} de ${a}`; };
const mesCurto = ch => { const [a, m] = Fatura.lerChave(ch); return `${MES_CURTO[m]}/${String(a).slice(2)}`; };
function rotuloDia(iso) {
  const hoje = hojeIso();
  if (iso === hoje) return 'hoje';
  const [a, m, d] = Fatura.lerData(hoje);
  const ontem = new Date(Date.UTC(a, m, d - 1)).toISOString().slice(0, 10);
  if (iso === ontem) return 'ontem';
  const [ya, ym, yd] = Fatura.lerData(iso);
  return `${SEMANA[new Date(Date.UTC(ya, ym, yd)).getUTCDay()]}, ${dataBonita(iso)}`;
}

// ------------------------------------------------------------------ estado da tela
const Tela = { aba: 'mes', mes: hojeIso().slice(0, 7) };

function aplicarAparencia() {
  const e = Dados.estado, raiz = document.documentElement;
  raiz.dataset.tema = e.tema || 'auto';
  raiz.dataset.traco = e.traco === false ? 'parado' : 'vivo';
}

function avisar(msg) {
  const el = $('#aviso'); el.textContent = msg; el.classList.add('mostrar');
  clearTimeout(avisar.t); avisar.t = setTimeout(() => el.classList.remove('mostrar'), 2600);
}

// bilhete de confirmação: devolve uma promessa com true/false
function perguntar(texto, { sim = 'Sim', detalhe = '' } = {}) {
  const dlg = $('#pergunta');
  $('#pergunta-txt').innerHTML = esc(texto) + (detalhe ? `<small>${esc(detalhe)}</small>` : '');
  $('#pergunta-sim').textContent = sim;
  return new Promise(ok => {
    const fim = v => { dlg.close(); $('#pergunta-sim').onclick = $('#pergunta-nao').onclick = dlg.oncancel = null; ok(v); };
    $('#pergunta-sim').onclick = () => fim(true);
    $('#pergunta-nao').onclick = () => fim(false);
    dlg.oncancel = e => { e.preventDefault(); fim(false); };
    dlg.showModal();
    $('#pergunta-nao').focus();
  });
}

// ------------------------------------------------------------------ a folha que sobe
let folhaAoFechar = null, focoAntes = null;
function abrirFolha(html, { aoFechar = null } = {}) {
  const f = $('#folha');
  if (f.hidden) focoAntes = document.activeElement;
  f.innerHTML = html; f.hidden = false; $('#veu').hidden = false;
  folhaAoFechar = aoFechar;
  document.body.style.overflow = 'hidden';
  f.scrollTop = 0;
  const alvo = $('[autofocus]', f) || $('h2', f);
  if (alvo) { if (!alvo.hasAttribute('tabindex') && alvo.tagName === 'H2') alvo.tabIndex = -1; alvo.focus({ preventScroll: true }); }
  return f;
}
function fecharFolha() {
  const f = $('#folha');
  if (f.hidden) return;
  f.hidden = true; $('#veu').hidden = true; f.innerHTML = '';
  document.body.style.overflow = '';
  const cb = folhaAoFechar; folhaAoFechar = null;
  if (cb) cb();
  if (focoAntes && document.contains(focoAntes)) focoAntes.focus({ preventScroll: true });
}
const topoFolha = titulo => `<div class="folha-topo"><h2 id="folha-titulo">${titulo}</h2>
  <button type="button" class="seta" data-acao="fechar" aria-label="Fechar">${ic('i-fechar')}</button></div>`;

// ------------------------------------------------------------------ desenhar a tela
function render() {
  const p = Dados.pessoa;
  $('#quem').innerHTML = p ? `<span>${esc(p.nome)}</span><span class="avatar" style="--cor:${p.cor}" aria-hidden="true">${esc(p.nome.trim()[0] || '?')}</span>` : '';
  $$('.abas [data-aba]').forEach(b => b.dataset.aba === Tela.aba ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  const tela = $('#tela');
  tela.innerHTML = ({ mes: telaMes, cartoes: telaCartoes, onde: telaOnde, ajustes: telaAjustes })[Tela.aba]();
}
function irPara(aba) {
  Tela.aba = aba; render(); scrollTo({ top: 0 });
}

function seletorMes() {
  const atual = hojeIso().slice(0, 7);
  const dif = (() => { const [a, m] = Fatura.lerChave(Tela.mes), [b, n] = Fatura.lerChave(atual); return (a - b) * 12 + (m - n); })();
  const sub = dif === 0 ? 'este mês' : dif === 1 ? 'mês que vem' : dif === -1 ? 'mês passado' : dif > 0 ? `daqui a ${dif} meses` : `há ${-dif} meses`;
  return `<div class="meses">
    <button type="button" class="seta" data-acao="mes" data-passo="-1" aria-label="Mês anterior">${ic('i-esq')}</button>
    <h2 aria-live="polite">${nomeMes(Tela.mes)}<small>${sub}${dif !== 0 ? ` · <button type="button" class="so-texto" data-acao="mes" data-passo="0" style="min-height:0;padding:0">voltar pra hoje</button>` : ''}</small></h2>
    <button type="button" class="seta" data-acao="mes" data-passo="1" aria-label="Próximo mês">${ic('i-dir')}</button>
  </div>`;
}

// uma linha do caderno
function linhaLanc(it) {
  const l = it.lanc, rec = l.tipo === 'receita';
  const cat = categoria(l.tipo, l.categoria);
  const extras = [];
  if (it.cartao) extras.push(`${seloBanco(it.cartao.banco, 'p')}${esc(it.cartao.apelido)}`);
  else if (!rec && l.forma) extras.push(esc(FORMAS[l.forma] || l.forma));
  if (it.deParcelas > 1) extras.push(`<span class="etiqueta">${it.parcela}/${it.deParcelas}</span>`);
  if (l.fixo) extras.push(`<span class="etiqueta">${ic('i-repete')}todo mês</span>`);
  if (!extras.length) extras.push(esc(cat.nome));
  return `<button type="button" class="lanc" data-acao="editar" data-id="${l.id}">
    <span class="cat">${ic('c-' + cat.id)}</span>
    <span class="meio"><b>${esc(l.descricao || cat.nome)}</b><small>${extras.join(' · ')}</small></span>
    <span class="valor ${rec ? 'pos' : 'neg'}">${rec ? '+ ' : '− '}${R(it.valor)}</span>
  </button>`;
}

// ------------------------------------------------------------------ tela: o mês
function frasesDoMes(r, vazio) {
  if (vazio) return { humor: 'dormindo', nota: 'Caderno novinho. Bora anotar a primeira coisa?' };
  if (r.saldo > 0 && r.entrou > 0 && r.saldo >= r.entrou * 0.2) return { humor: 'feliz', nota: 'Sobrou um bom pedaço. Guarda com carinho.' };
  if (r.saldo > 0) return { humor: 'feliz', nota: 'Fechando no azul. Devagarinho a gente chega.' };
  if (r.saldo === 0) return { humor: 'contente', nota: 'Zero a zero. Nem sobrou, nem faltou.' };
  if (r.entrou === 0) return { humor: 'apertado', nota: 'Ainda não anotou o que entrou este mês.' };
  return { humor: 'apertado', nota: 'Esse mês apertou… mas agora a gente sabe pra onde foi.' };
}

function telaMes() {
  const cad = Dados.caderno, r = Fatura.resumoDoMes(cad, Tela.mes), hoje = hojeIso();
  const vazio = r.itens.length === 0;
  const { humor, nota } = frasesDoMes(r, vazio);
  const tom = r.saldo > 0 ? 'pos' : r.saldo < 0 ? 'neg' : '';
  const marca = r.saldo > 0 ? 'verde' : r.saldo < 0 ? 'vermelho' : '';

  // faturas que vencem neste mês
  const faturas = cad.cartoes.map(c => {
    const total = r.porCartao[c.id] || 0;
    const f = Fatura.faturaPelaChave(c, Tela.mes);
    return { c, f, total, sit: Fatura.situacao(f, hoje, Dados.faturaPaga(c.id, Tela.mes)) };
  }).filter(x => x.total > 0);

  // o caderno, agrupado por dia
  let lista = '', diaAtual = '';
  for (const it of r.itens) {
    if (it.data !== diaAtual) { diaAtual = it.data; lista += `<div class="dia">${rotuloDia(it.data)}</div>`; }
    lista += linhaLanc(it);
  }

  return `<div>
    ${seletorMes()}
    <section class="bilhete rabisco vivo" aria-label="Resumo do mês">
      <div class="saldo">
        ${broto(humor, { tamanho: 88 })}
        <div class="saldo-txt">
          <div class="saldo-rot">${r.saldo < 0 ? 'Faltou no mês' : 'Sobra do mês'}</div>
          <div class="saldo-valor ${tom}"><span class="marcado ${marca}">${R(r.saldo)}</span></div>
          <div class="nota">${nota}</div>
        </div>
      </div>
      <div class="contas-mes">
        <div><span>Entrou</span><b class="pos">+ ${R(r.entrou)}</b></div>
        <div><span>Saiu no Pix, débito e dinheiro</span><b class="neg">− ${R(r.direto)}</b></div>
        <div><span>Faturas dos cartões</span><b class="neg">− ${R(r.faturas)}</b></div>
      </div>
    </section>

    ${faturas.length ? `<h3 class="titulo">Faturas deste mês</h3><div class="fichas">${faturas.map(({ c, f, total, sit }) => `
      <button type="button" class="ficha rabisco fino" data-acao="fatura" data-cartao="${c.id}" data-chave="${Tela.mes}">
        ${seloBanco(c.banco, 'm')}
        <span class="meio"><b>${esc(c.apelido)}</b><small>vence ${dataBonita(f.vencimento)}</small></span>
        <span class="valor">${R(total)}<small><span class="carimbo ${sit}">${sit}</span></small></span>
      </button>`).join('')}</div>` : ''}

    <h3 class="titulo">O caderno <small>${r.itens.length} ${r.itens.length === 1 ? 'anotação' : 'anotações'}</small></h3>
    ${vazio ? `<div class="vazio"><p>Nada anotado em ${MESES[Fatura.lerChave(Tela.mes)[1]]}.</p>
        <button type="button" class="botao principal rabisco" data-acao="anotar">${ic('i-mais')} Anotar</button></div>`
      : `<div class="caderno rabisco fino">${lista}</div>
         <p class="nota" style="text-align:center;font-size:17px">Compras no cartão aparecem no mês em que a fatura vence.</p>`}
  </div>`;
}

// ------------------------------------------------------------------ tela: cartões
// quanto do limite está comprometido: tudo que ainda não foi pago, da fatura fechada em diante
function limiteUsado(cad, c, hoje) {
  const aberta = Fatura.faturaAberta(c, hoje).chave;
  let usado = 0;
  for (let k = -1; k < 48; k++) {
    const ch = Fatura.proximaChave(aberta, k);
    if (Dados.faturaPaga(c.id, ch)) continue;
    for (const it of Fatura.itensDaFatura(cad, c.id, ch)) if (!it.lanc.fixo || k <= 0) usado += it.valor;
  }
  return usado;
}

function plastico(c, extra = '') {
  const b = bancoPorId(c.banco);
  return `<div class="frente" style="--cor:${b.cor};--cor-txt:${b.texto}">
    <div class="cima">
      <div style="min-width:0"><div class="apelido">${esc(c.apelido)}</div>${c.apelido.trim().toLowerCase() !== b.nome.toLowerCase() ? `<div class="banco">${esc(b.nome)}</div>` : ''}</div>
      ${seloBanco(c.banco, 'g')}
    </div>
    <div class="chip" aria-hidden="true"></div>
    <div class="baixo">
      <span class="numero">${c.final ? '•••• ' + esc(c.final) : ''}</span>
      <span class="datas">fecha dia ${c.fechamento}<br>vence dia ${c.vencimento}</span>
    </div>${extra}
  </div>`;
}

function telaCartoes() {
  const cad = Dados.caderno, hoje = hojeIso();
  if (!cad.cartoes.length) return `<div>
    <h2 class="titulo" style="font-size:34px">Cartões</h2>
    <div class="vazio">${broto('dormindo', { tamanho: 110 })}
      <p>Nenhum cartão por aqui ainda.<br>Cadastra com o dia que fecha e o dia que vence,<br>que eu calculo em qual fatura cada compra cai.</p>
      <button type="button" class="botao principal rabisco" data-acao="novo-cartao">${ic('i-mais')} Cadastrar cartão</button>
    </div></div>`;

  return `<div>
    <h2 class="titulo" style="font-size:34px">Cartões <small>toca no cartão pra ver a fatura</small></h2>
    <div class="cartoes">${cad.cartoes.map(c => {
      const f = Fatura.faturaAberta(c, hoje);
      const total = Fatura.itensDaFatura(cad, c.id, f.chave).reduce((s, it) => s + it.valor, 0);
      const usado = c.limite ? limiteUsado(cad, c, hoje) : 0;
      const pct = c.limite ? Math.min(100, Math.round(usado / c.limite * 100)) : 0;
      return `<div>
        <button type="button" class="plastico" data-acao="fatura" data-cartao="${c.id}" data-chave="${f.chave}" aria-label="${esc(c.apelido)}: ver fatura">${plastico(c)}</button>
        <div class="sob-cartao">
          <div><small>Fatura aberta · vence ${dataBonita(f.vencimento)}</small><span class="total">${R(total)}</span></div>
          <button type="button" class="botao pequeno rabisco fino" data-acao="editar-cartao" data-id="${c.id}">${ic('i-lapis')} Editar</button>
        </div>
        ${c.limite ? `<div class="limite" role="img" aria-label="Limite usado: ${pct}%"><i style="width:${pct}%"></i></div>
          <div class="sob-cartao" style="padding-top:4px"><small>Limite usado: ${R(usado)} de ${R(c.limite)}</small><small>livre: ${R(Math.max(0, c.limite - usado))}</small></div>` : ''}
        <div class="dica-compra">Melhor dia de compra: dia ${c.fechamento} ✦</div>
      </div>`;
    }).join('')}</div>
    <div class="linha-botoes" style="margin-top:24px"><button type="button" class="botao rabisco" data-acao="novo-cartao">${ic('i-mais')} Novo cartão</button></div>
  </div>`;
}

// a fatura de um cartão, na folha
function abrirFatura(cartaoId, chave) {
  const cad = Dados.caderno, c = cad.cartoes.find(x => x.id === cartaoId);
  if (!c) return;
  const f = Fatura.faturaPelaChave(c, chave), paga = Dados.faturaPaga(c.id, chave);
  const sit = Fatura.situacao(f, hojeIso(), paga);
  const itens = Fatura.itensDaFatura(cad, c.id, chave);
  const total = itens.reduce((s, it) => s + it.valor, 0);
  abrirFolha(`${topoFolha(`Fatura ${esc(c.apelido)}`)}
    <div class="meses">
      <button type="button" class="seta" data-acao="fatura" data-cartao="${c.id}" data-chave="${Fatura.proximaChave(chave, -1)}" aria-label="Fatura anterior">${ic('i-esq')}</button>
      <h2>${MESES[Fatura.lerChave(chave)[1]]}<small>fecha ${dataBonita(f.fechamento)} · vence ${dataBonita(f.vencimento)}</small></h2>
      <button type="button" class="seta" data-acao="fatura" data-cartao="${c.id}" data-chave="${Fatura.proximaChave(chave, 1)}" aria-label="Próxima fatura">${ic('i-dir')}</button>
    </div>
    <div class="fatura-total">
      <span class="carimbo grande ${sit}">${sit}</span>
      <div class="valor">${R(total)}</div>
      <small>${itens.length} ${itens.length === 1 ? 'compra' : 'compras'} nesta fatura</small>
    </div>
    ${itens.length ? `<div class="caderno rabisco fino">${itens.map(linhaLanc).join('')}</div>`
      : `<div class="vazio">${broto('contente', { tamanho: 72 })}<p>Nenhuma compra nesta fatura.</p></div>`}
    <div class="linha-botoes">
      ${total > 0 || paga ? `<button type="button" class="botao ${paga ? '' : 'principal'} rabisco" data-acao="pagar" data-cartao="${c.id}" data-chave="${chave}">${ic('i-check')} ${paga ? 'Desmarcar paga' : 'Marcar como paga'}</button>` : ''}
    </div>`);
}

// cadastro de cartão
function formCartao(id) {
  const cad = Dados.caderno, c = cad.cartoes.find(x => x.id === id) || { banco: 'nubank', apelido: '', final: '', fechamento: 3, vencimento: 10, limite: 0 };
  const dias = sel => Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}" ${i + 1 === sel ? 'selected' : ''}>dia ${i + 1}</option>`).join('');
  const f = abrirFolha(`${topoFolha(id ? 'Editar cartão' : 'Novo cartão')}
    <form id="form-cartao" novalidate>
      <div id="previa-cartao" style="margin:10px 0 4px"></div>
      <div class="campo"><span class="campo-rot" id="rot-banco">Banco</span>
        <div class="bancos" role="group" aria-labelledby="rot-banco">${BANCOS.map(b => `
          <button type="button" class="escolha" data-banco="${b.id}" aria-pressed="${b.id === c.banco}">${seloBanco(b.id, 'm')}${esc(b.nome)}</button>`).join('')}
        </div></div>
      <label class="campo"><span>Nome do cartão</span><input class="entrada-texto" name="apelido" maxlength="24" value="${esc(c.apelido)}" placeholder="ex.: Nubank roxinho" autocomplete="off"></label>
      <div class="duas">
        <label class="campo"><span>Fecha no</span><select class="entrada-texto" name="fechamento">${dias(c.fechamento)}</select></label>
        <label class="campo"><span>Vence no</span><select class="entrada-texto" name="vencimento">${dias(c.vencimento)}</select></label>
      </div>
      <div class="recado" id="recado-cartao"></div>
      <div class="duas">
        <label class="campo"><span>Final do cartão (opcional)</span><input class="entrada-texto" name="final" inputmode="numeric" maxlength="4" pattern="[0-9]*" value="${esc(c.final)}" placeholder="1234"></label>
        <label class="campo"><span>Limite (opcional)</span><input class="entrada-texto" name="limite" inputmode="decimal" value="${c.limite ? Fatura.emReais(c.limite).replace('R$ ', '') : ''}" placeholder="0,00"></label>
      </div>
      <div class="linha-botoes" style="margin-top:22px">
        ${id ? `<button type="button" class="botao rabisco fino perigo" data-acao="apagar-cartao" data-id="${id}">${ic('i-lixo')} Apagar</button>` : ''}
        <button type="submit" class="botao principal rabisco">${ic('i-check')} Guardar cartão</button>
      </div>
    </form>`);

  const form = $('#form-cartao', f);
  let banco = c.banco;
  const atualizar = () => {
    const fe = +form.fechamento.value, ve = +form.vencimento.value;
    const previa = { banco, apelido: form.apelido.value.trim() || bancoPorId(banco).nome, final: form.final.value.replace(/\D/g, ''), fechamento: fe, vencimento: ve };
    $('#previa-cartao', f).innerHTML = `<div class="plastico">${plastico(previa)}</div>`;
    const antes = fe === 1 ? null : fe - 1;
    $('#recado-cartao', f).innerHTML = `${ic('i-cartao')}<span>${antes ? `Comprou até o dia ${antes}? Entra na fatura que vence dia ${ve}.` : `Fecha no dia 1: tudo do mês entra junto.`}
      <small>A partir do dia ${fe}, a compra já vai pra fatura seguinte${ve <= fe ? ` (o vencimento é no mês depois do fechamento)` : ''}. Por isso o dia ${fe} é o melhor dia de compra.</small></span>`;
  };
  atualizar();
  form.addEventListener('input', atualizar);
  $$('[data-banco]', f).forEach(b => b.addEventListener('click', () => {
    banco = b.dataset.banco;
    $$('[data-banco]', f).forEach(x => x.setAttribute('aria-pressed', x === b));
    atualizar();
  }));
  form.addEventListener('submit', e => {
    e.preventDefault();
    const novo = {
      id: c.id, banco,
      apelido: form.apelido.value.trim() || bancoPorId(banco).nome,
      final: form.final.value.replace(/\D/g, '').slice(0, 4),
      fechamento: +form.fechamento.value, vencimento: +form.vencimento.value,
      limite: Fatura.lerReais(form.limite.value) || 0,
    };
    if (!novo.id) delete novo.id;
    Dados.salvarCartao(novo);
    fecharFolha(); Tela.aba = 'cartoes'; render();
    avisar(id ? 'Cartão atualizado.' : 'Cartão guardado no caderno.');
  });
}

// ------------------------------------------------------------------ anotar (gasto ou entrada)
function formLanc(id, mesContexto) {
  const cad = Dados.caderno, l0 = cad.lancamentos.find(x => x.id === id);
  const hoje = hojeIso();
  // padrão: se estou olhando outro mês, a data sugerida é nesse mês
  const dataPadrao = Tela.mes === hoje.slice(0, 7) ? hoje : `${Tela.mes}-01`;
  const st = l0 ? Object.assign({}, l0) : {
    tipo: 'despesa', valor: null, descricao: '', data: dataPadrao, categoria: 'mercado',
    forma: cad.cartoes.length ? 'cartao' : 'pix', cartaoId: cad.cartoes[0] ? cad.cartoes[0].id : null, parcelas: 1, fixo: false,
  };
  if (st.forma === 'cartao' && !cad.cartoes.some(c => c.id === st.cartaoId)) { st.forma = 'pix'; st.cartaoId = null; }

  const f = abrirFolha(`${topoFolha(l0 ? 'Editar anotação' : 'Anotar')}
    <form id="form-lanc" novalidate>
      <div class="alternar" role="group" aria-label="Tipo">
        <button type="button" class="t-gasto" data-tipo="despesa">Gastei</button>
        <button type="button" class="t-entrada" data-tipo="receita">Entrou</button>
      </div>
      <div class="valor-caixa rabisco fino" style="margin-top:14px">
        <label for="valor" class="sr">Valor em reais</label>
        <input id="valor" class="valor-grande" name="valor" inputmode="decimal" autocomplete="off" placeholder="R$ 0,00" ${l0 ? '' : 'autofocus'}
          value="${st.valor ? Fatura.emReais(st.valor) : ''}">
        <small id="valor-dica"></small>
      </div>
      <label class="campo"><span id="rot-desc">O que foi?</span><input class="entrada-texto" name="descricao" maxlength="60" value="${esc(st.descricao)}" placeholder="ex.: feira do sábado" autocomplete="off"></label>

      <div id="bloco-forma">
        <div class="campo"><span class="campo-rot" id="rot-forma">Como pagou?</span>
          <div class="escolhas" role="group" aria-labelledby="rot-forma">
            ${cad.cartoes.map(c => `<button type="button" class="escolha" data-forma="cartao" data-cartao="${c.id}">${seloBanco(c.banco, 'p')}${esc(c.apelido)}</button>`).join('')}
            <button type="button" class="escolha" data-forma="pix">${ic('i-pix')}Pix</button>
            <button type="button" class="escolha" data-forma="debito">${ic('i-debito')}Débito</button>
            <button type="button" class="escolha" data-forma="dinheiro">${ic('i-dinheiro')}Dinheiro</button>
          </div>
          ${cad.cartoes.length ? '' : `<p class="nota" style="font-size:17px;margin:2px 0 0">Dica: cadastra teus cartões na aba Cartões, que eu calculo as faturas.</p>`}
        </div>
        <div class="campo" id="bloco-parcelas"><span class="campo-rot">Parcelas</span>
          <div class="parcelas">
            <button type="button" class="redondo" data-parc="-1" aria-label="Menos parcelas">−</button>
            <output id="parc-txt" aria-live="polite"></output>
            <button type="button" class="redondo" data-parc="1" aria-label="Mais parcelas">+</button>
          </div>
        </div>
      </div>

      <div class="duas">
        <label class="campo"><span>Quando?</span><input class="entrada-texto" type="date" name="data" value="${st.data}" required></label>
        <div class="campo"><span class="campo-rot">&nbsp;</span>
          <div class="escolhas" style="padding:0"><button type="button" class="escolha" data-dia="0">hoje</button><button type="button" class="escolha" data-dia="-1">ontem</button></div>
        </div>
      </div>

      <div class="recado" id="recado" hidden></div>

      <div class="campo"><span class="campo-rot" id="rot-cat">Categoria</span>
        <div class="escolhas quebra" role="group" aria-labelledby="rot-cat" id="cats"></div></div>

      <label class="chave"><span>Repete todo mês<small id="fixo-dica">salário, aluguel, internet, assinatura…</small></span><input type="checkbox" name="fixo" ${st.fixo ? 'checked' : ''}></label>

      <div class="linha-botoes" style="margin-top:18px">
        ${l0 ? `<button type="button" class="botao rabisco fino perigo" id="apagar-lanc">${ic('i-lixo')} Apagar</button>` : ''}
        <button type="submit" class="botao principal rabisco">${ic('i-check')} ${l0 ? 'Guardar' : 'Anotar'}</button>
      </div>
    </form>`);

  const form = $('#form-lanc', f);
  const desenharCats = () => {
    $('#cats', f).innerHTML = CATEGORIAS[st.tipo].map(c =>
      `<button type="button" class="escolha" data-cat="${c.id}" aria-pressed="${c.id === st.categoria}">${ic('c-' + c.id)}${c.nome}</button>`).join('');
  };
  const atualizar = () => {
    const desp = st.tipo === 'despesa';
    $$('[data-tipo]', f).forEach(b => b.setAttribute('aria-pressed', b.dataset.tipo === st.tipo));
    $('#bloco-forma', f).hidden = !desp;
    $('#rot-desc', f).textContent = desp ? 'O que foi?' : 'De onde veio?';
    $$('[data-forma]', f).forEach(b => b.setAttribute('aria-pressed', b.dataset.forma === st.forma && (st.forma !== 'cartao' || b.dataset.cartao === st.cartaoId)));
    const noCartao = desp && st.forma === 'cartao';
    $('#bloco-parcelas', f).hidden = !noCartao || st.fixo;
    const valor = Fatura.lerReais(form.valor.value) || 0;
    const n = noCartao && !st.fixo ? st.parcelas : 1;
    const partes = Fatura.dividir(valor, n);
    $('#parc-txt', f).innerHTML = n === 1 ? 'à vista<small>uma vez só</small>' : `${n}x<small>de ${R(partes[partes.length - 1])}</small>`;
    $('#valor-dica', f).textContent = valor && n > 1 ? `total ${R(valor)} em ${n}x` : '';
    $('#fixo-dica', f).textContent = desp ? 'aluguel, internet, assinatura…' : 'salário, pensão, aluguel recebido…';

    // o recadinho: em qual fatura cai
    const rec = $('#recado', f), cartao = cad.cartoes.find(c => c.id === st.cartaoId);
    const data = form.data.value;
    if (noCartao && cartao && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
      const fat = Fatura.faturaDaCompra(cartao, data);
      const ult = Fatura.faturaDaCompra(cartao, data, n - 1);
      rec.hidden = false;
      rec.innerHTML = `${seloBanco(cartao.banco, 'p')}<span>Vai cair na fatura de ${MESES[Fatura.lerChave(fat.chave)[1]]}
        <small>${esc(cartao.apelido)} fecha ${dataBonita(fat.fechamento)} e vence ${dataBonita(fat.vencimento)}.${n > 1 ? ` A última parcela vence em ${dataBonita(ult.vencimento)} de ${ult.vencimento.slice(0, 4)}.` : ''}${st.fixo ? ' Todo mês, de novo.' : ''}</small></span>`;
    } else rec.hidden = true;
  };
  desenharCats(); atualizar();

  form.addEventListener('input', atualizar);
  f.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || !f.contains(b)) return;
    if (b.dataset.tipo) {
      st.tipo = b.dataset.tipo;
      st.categoria = CATEGORIAS[st.tipo][0].id;
      desenharCats(); atualizar();
    } else if (b.dataset.forma) {
      st.forma = b.dataset.forma; st.cartaoId = b.dataset.cartao || null; atualizar();
    } else if (b.dataset.parc) {
      st.parcelas = Math.min(48, Math.max(1, (st.parcelas || 1) + +b.dataset.parc)); atualizar();
    } else if (b.dataset.cat) {
      st.categoria = b.dataset.cat;
      $$('[data-cat]', f).forEach(x => x.setAttribute('aria-pressed', x === b));
    } else if (b.dataset.dia) {
      const [a, m, d] = Fatura.lerData(hojeIso());
      form.data.value = new Date(Date.UTC(a, m, d + +b.dataset.dia)).toISOString().slice(0, 10); atualizar();
    }
  });
  form.fixo.addEventListener('change', () => { st.fixo = form.fixo.checked; atualizar(); });
  // deixa o valor bonitinho quando sai do campo
  form.valor.addEventListener('blur', () => { const v = Fatura.lerReais(form.valor.value); if (v) form.valor.value = Fatura.emReais(v); });

  if (l0) $('#apagar-lanc', f).addEventListener('click', async () => {
    if (l0.fixo && mesContexto && Fatura.compararChave(mesContexto, l0.data.slice(0, 7)) > 0) {
      // fixo: dá para parar de repetir daqui pra frente, sem apagar o passado
      const parar = await perguntar('Parar de repetir?', { sim: 'Parar depois deste mês', detalhe: `Os meses até ${nomeMes(mesContexto)} continuam no caderno. Se quiser apagar tudo, inclusive o passado, toca em "Deixa quieto" e depois mude a data para o primeiro mês.` });
      if (parar) { Dados.salvarLancamento(Object.assign({}, l0, { ate: mesContexto })); fecharFolha(); render(); avisar('Não repete mais.'); }
      return;
    }
    if (await perguntar('Apagar esta anotação?', { sim: 'Apagar', detalhe: l0.fixo ? 'Ela some de todos os meses.' : '' })) {
      Dados.apagarLancamento(l0.id); fecharFolha(); render(); avisar('Apagado.');
    }
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const valor = Fatura.lerReais(form.valor.value);
    if (!valor) { form.valor.focus(); $('.valor-caixa', f).classList.remove('tremer'); void f.offsetWidth; $('.valor-caixa', f).classList.add('tremer'); avisar('Faltou o valor.'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.data.value)) { form.data.focus(); avisar('Faltou a data.'); return; }
    const desp = st.tipo === 'despesa', noCartao = desp && st.forma === 'cartao' && st.cartaoId;
    const novo = {
      id: l0 ? l0.id : undefined, criado: l0 ? l0.criado : undefined,
      tipo: st.tipo, valor, descricao: form.descricao.value.trim(), data: form.data.value, categoria: st.categoria,
      forma: desp ? (noCartao ? 'cartao' : st.forma === 'cartao' ? 'pix' : st.forma) : null,
      cartaoId: noCartao ? st.cartaoId : null,
      parcelas: noCartao && !form.fixo.checked ? st.parcelas : 1,
      fixo: form.fixo.checked,
    };
    if (l0 && l0.ate && novo.fixo) novo.ate = l0.ate;
    for (const k of Object.keys(novo)) if (novo[k] === undefined) delete novo[k];
    Dados.salvarLancamento(novo);
    fecharFolha();
    // vai para o mês onde o dinheiro sai (a fatura, se for cartão)
    if (!l0) {
      const cartao = noCartao && cad.cartoes.find(c => c.id === st.cartaoId);
      const destino = cartao ? Fatura.faturaDaCompra(cartao, novo.data).chave : novo.data.slice(0, 7);
      if (Tela.aba !== 'mes' && Tela.aba !== 'onde') Tela.aba = 'mes';
      Tela.mes = destino;
      avisar(cartao ? `Anotado! Cai na fatura de ${MESES[Fatura.lerChave(destino)[1]]}.` : desp ? 'Anotado no caderno.' : 'Que bom! Anotado.');
    } else avisar('Guardado.');
    render();
  });
}

// ------------------------------------------------------------------ tela: pra onde foi
function telaOnde() {
  const cad = Dados.caderno, r = Fatura.resumoDoMes(cad, Tela.mes);
  const cats = Object.entries(r.porCategoria).sort((a, b) => b[1] - a[1]);
  const maior = cats.length ? cats[0][1] : 1;
  const gastos = r.itens.filter(it => it.lanc.tipo === 'despesa').sort((a, b) => b.valor - a.valor).slice(0, 5);

  // os últimos 6 meses: entrou x saiu
  const meses = Array.from({ length: 6 }, (_, i) => Fatura.proximaChave(Tela.mes, i - 5));
  const serie = meses.map(ch => { const x = Fatura.resumoDoMes(cad, ch); return { ch, entrou: x.entrou, saiu: x.saiu, saldo: x.saldo }; });

  return `<div>
    ${seletorMes()}
    <section class="bilhete rabisco" style="transform:rotate(.4deg)">
      <div class="saldo-rot">Saiu em ${MESES[Fatura.lerChave(Tela.mes)[1]]}</div>
      <div class="saldo-valor neg"><span class="marcado vermelho">${R(r.saiu)}</span></div>
      ${r.entrou ? `<div class="nota">${r.saiu > r.entrou ? `Saiu ${R(r.saiu - r.entrou)} a mais do que entrou.` : `Isso é ${Math.round(r.saiu / r.entrou * 100)}% do que entrou.`}</div>` : ''}
    </section>

    <h3 class="titulo">Por categoria</h3>
    ${cats.length ? `<div class="caderno rabisco fino"><div class="categorias">${cats.map(([id, v]) => {
      const c = categoria('despesa', id);
      return `<div class="catlinha">${ic('c-' + c.id)}<span class="nome">${c.nome} <small>${Math.round(v / r.saiu * 100)}%</small></span><span class="valor">${R(v)}</span>
        <span class="barra" aria-hidden="true"><i style="width:${Math.max(1.5, v / maior * 100)}%"></i></span></div>`;
    }).join('')}</div></div>` : `<div class="vazio">${broto('dormindo', { tamanho: 80 })}<p>Nenhum gasto neste mês.</p></div>`}

    ${gastos.length ? `<h3 class="titulo">Os maiores gastos</h3><div class="caderno rabisco fino">${gastos.map(linhaLanc).join('')}</div>` : ''}

    <h3 class="titulo">Os últimos 6 meses</h3>
    <div class="caderno rabisco fino grafico" style="position:relative">
      ${graficoMeses(serie)}
      <div class="legenda"><span><i class="leg-entrou"></i>Entrou (cheio)</span><span><i class="leg-saiu"></i>Saiu (riscado)</span></div>
    </div>
    <details class="ver-tabela"><summary>Ver em tabela</summary>
      <table class="tabela"><thead><tr><th>Mês</th><th>Entrou</th><th>Saiu</th><th>Sobra</th></tr></thead>
      <tbody>${serie.map(s => `<tr><td>${mesCurto(s.ch)}</td><td>${R(s.entrou)}</td><td>${R(s.saiu)}</td><td class="${s.saldo < 0 ? 'neg' : 'pos'}">${R(s.saldo)}</td></tr>`).join('')}</tbody></table>
    </details>
  </div>`;
}

// barras em pares (entrou | saiu), com hachura de lápis; tocar mostra os valores
function graficoMeses(serie) {
  const W = 340, H = 170, base = 140, topo = 14, larg = 15, maxV = Math.max(1, ...serie.flatMap(s => [s.entrou, s.saiu]));
  const passo = W / serie.length;
  const barra = (x, v, cor, rot) => {
    const h = Math.max(v ? 3 : 0, (v / maxV) * (base - topo)), y = base - h, r = Math.min(4, h / 2);
    if (!h) return '';
    return `<path d="M${x} ${base}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + larg - r}Q${x + larg} ${y} ${x + larg} ${y + r}V${base}Z"
      fill="url(#hach-${rot})" stroke="${cor}" stroke-width="1.7"/>`;
  };
  return `<svg viewBox="0 0 ${W} ${H + 8}" role="img" aria-label="Entrou e saiu nos últimos 6 meses">
    <defs>
      <pattern id="hach-e" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="var(--verde)" opacity=".7"/></pattern>
      <pattern id="hach-s" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="5" height="5" fill="var(--vermelho)" opacity=".15"/><line x1="0" y1="0" x2="0" y2="5" stroke="var(--vermelho)" stroke-width="2"/></pattern>
    </defs>
    <g style="filter:url(#tremor0)">
      <line class="eixo" x1="0" x2="${W}" y1="${base + .5}" y2="${base + .5}"/>
      ${serie.map((s, i) => {
        const cx = passo * i + passo / 2;
        return barra(cx - larg - 1, s.entrou, 'var(--verde)', 'e') + barra(cx + 1, s.saiu, 'var(--vermelho)', 's');
      }).join('')}
    </g>
    ${serie.map((s, i) => {
      const cx = passo * i + passo / 2;
      return `<text class="rot-mes" x="${cx}" y="${base + 20}" text-anchor="middle">${mesCurto(s.ch)}</text>
        <rect x="${passo * i}" y="0" width="${passo}" height="${H}" fill="transparent" data-dica="${mesCurto(s.ch)}|${R(s.entrou)}|${R(s.saiu)}" tabindex="0" style="outline:none"/>`;
    }).join('')}
  </svg>`;
}

// ------------------------------------------------------------------ tela: ajustes
function telaAjustes() {
  const e = Dados.estado, p = Dados.pessoa;
  const tema = e.tema || 'auto';
  return `<div>
    <h2 class="titulo" style="font-size:34px">Ajustes</h2>

    <section class="secao rabisco fino">
      <h3>Quem usa</h3>
      <p>Cada pessoa tem o seu caderno. O que um anota, o outro não vê misturado.</p>
      ${e.usuarios.map(u => `<div class="ficha" style="padding:8px 0;background:none">
        <span class="avatar" style="--cor:${u.cor}" aria-hidden="true">${esc(u.nome.trim()[0] || '?')}</span>
        <span class="meio"><b>${esc(u.nome)}${u.id === p.id ? ' <small>(você agora)</small>' : ''}</b><small>${u.pin ? 'com senha de 4 números' : 'sem senha'}</small></span>
        <button type="button" class="botao pequeno rabisco fino" data-acao="editar-pessoa" data-id="${u.id}">${ic('i-lapis')}<span class="sr">Editar ${esc(u.nome)}</span></button>
      </div>`).join('')}
      <div class="linha-botoes"><button type="button" class="botao rabisco fino" data-acao="trocar">${ic('i-pessoas')} Trocar de pessoa</button></div>
    </section>

    <section class="secao rabisco fino">
      <h3>Aparência</h3>
      <div class="escolhas quebra" role="group" aria-label="Tema">
        ${[['auto', 'Igual ao celular'], ['papel', 'Papel (claro)'], ['noite', 'Noite (escuro)']].map(([v, n]) =>
          `<button type="button" class="escolha" data-acao="tema" data-tema="${v}" aria-pressed="${tema === v}">${n}</button>`).join('')}
      </div>
      <label class="chave"><span>Traço vivo<small>a tinta treme de leve, como desenho feito à mão</small></span><input type="checkbox" data-acao="traco" ${e.traco !== false ? 'checked' : ''}></label>
    </section>

    <section class="secao rabisco fino">
      <h3>Cópia de segurança</h3>
      <p>Tudo fica guardado só neste celular. De vez em quando, salva uma cópia (leva as duas pessoas juntas). Se trocar de celular, é só restaurar.</p>
      <div class="linha-botoes">
        <button type="button" class="botao rabisco fino" data-acao="exportar">${ic('i-baixar')} Salvar cópia</button>
        <button type="button" class="botao rabisco fino" data-acao="importar">${ic('i-subir')} Restaurar cópia</button>
      </div>
      <input type="file" id="arquivo" accept="application/json,.json" hidden>
    </section>

    <section class="secao rabisco fino" id="secao-instalar" ${Instalar.evento ? '' : 'hidden'}>
      <h3>Instalar no celular</h3>
      <p>Fica com ícone na tela inicial e abre sem a barra do navegador, até sem internet.</p>
      <div class="linha-botoes"><button type="button" class="botao principal rabisco" data-acao="instalar">${ic('i-baixar')} Instalar</button></div>
    </section>

    <section class="secao rabisco fino">
      <h3>Começar de novo</h3>
      <p>Apaga só o caderno de ${esc(p.nome)}: cartões, anotações e faturas pagas.</p>
      <div class="linha-botoes"><button type="button" class="botao rabisco fino perigo" data-acao="zerar">${ic('i-lixo')} Apagar meu caderno</button></div>
    </section>

    <div class="rodape">${broto('contente', { tamanho: 64 })}<div class="mao">Feito à mão, pra casa da gente.</div><small>Caderninho · versão ${VERSAO}</small></div>
  </div>`;
}

function formPessoa(id) {
  const u = Dados.estado.usuarios.find(x => x.id === id);
  const cores = ['#5f9d3d', '#c4577a', '#3d6fb0', '#c98a1b', '#7a55b8', '#2f8f8a'];
  const f = abrirFolha(`${topoFolha('Editar pessoa')}
    <form id="form-pessoa">
      <label class="campo"><span>Nome</span><input class="entrada-texto" name="nome" maxlength="20" value="${esc(u.nome)}" required></label>
      <div class="campo"><span class="campo-rot">Cor</span><div class="escolhas quebra">${cores.map(c =>
        `<button type="button" class="escolha" data-cor="${c}" aria-pressed="${c === u.cor}" aria-label="Cor"><span class="avatar" style="--cor:${c};width:28px;height:28px;font-size:16px">${esc(u.nome[0] || '?')}</span></button>`).join('')}</div></div>
      <label class="campo"><span>Senha de 4 números (opcional)</span>
        <input class="entrada-texto" name="pin" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" placeholder="${u.pin ? '••••  (deixe vazio para tirar)' : 'sem senha'}" autocomplete="off"></label>
      <p class="nota" style="font-size:17px">A senha só serve pra um não abrir o caderno do outro sem querer. Não é um cofre.</p>
      <div class="linha-botoes"><button type="submit" class="botao principal rabisco">${ic('i-check')} Guardar</button></div>
    </form>`);
  let cor = u.cor;
  $$('[data-cor]', f).forEach(b => b.addEventListener('click', () => { cor = b.dataset.cor; $$('[data-cor]', f).forEach(x => x.setAttribute('aria-pressed', x === b)); }));
  $('#form-pessoa', f).addEventListener('submit', e => {
    e.preventDefault();
    const fm = e.target, pin = fm.pin.value.replace(/\D/g, '');
    if (pin && pin.length !== 4) { avisar('A senha tem 4 números.'); fm.pin.focus(); return; }
    u.nome = fm.nome.value.trim() || u.nome; u.cor = cor;
    if (pin) u.pin = pin; else if (fm.pin.value === '' && u.pin) u.pin = '';
    Dados.salvar(); fecharFolha(); render(); avisar('Guardado.');
  });
}

// ------------------------------------------------------------------ a entrada: quem está anotando
function telaEntrada(modo = 'escolher', pessoaId) {
  const el = $('#entrada'), e = Dados.estado;
  el.hidden = false; $('#app').inert = true;
  if (!e.usuarios.length) {
    el.innerHTML = `${broto('feliz', { tamanho: 120 })}
      <h1>Caderninho</h1>
      <p>O caderno de contas da casa. Cada um anota o seu, e o dinheiro para de escapar sem a gente ver.</p>
      <form class="form-entrada" id="form-nomes">
        <label class="campo"><span>Seu nome</span><input class="entrada-texto" name="n1" maxlength="20" required autocomplete="given-name"></label>
        <label class="campo"><span>E o nome dela (ou dele)</span><input class="entrada-texto" name="n2" maxlength="20" required></label>
        <div class="linha-botoes" style="margin-top:20px"><button class="botao principal rabisco largo" type="submit">Abrir o caderno</button></div>
      </form>`;
    $('#form-nomes').addEventListener('submit', ev => {
      ev.preventDefault();
      const n1 = ev.target.n1.value.trim(), n2 = ev.target.n2.value.trim();
      if (!n1 || !n2) return;
      Dados.criarPessoas([n1, n2]);
      telaEntrada();
    });
    $('#form-nomes input').focus();
    return;
  }
  if (modo === 'pin') {
    const u = e.usuarios.find(x => x.id === pessoaId);
    let digitado = '';
    el.innerHTML = `<span class="avatar" style="--cor:${u.cor};width:72px;height:72px;font-size:40px">${esc(u.nome[0])}</span>
      <h1 style="font-size:38px">Oi, ${esc(u.nome)}</h1><p>Digita a sua senha.</p>
      <div class="pin-pontos" aria-hidden="true">${'<i></i>'.repeat(4)}</div>
      <div class="sr" aria-live="polite" id="pin-status"></div>
      <div class="teclado">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button type="button" data-n="${n}">${n}</button>`).join('')}
        <button type="button" data-n="voltar" aria-label="Voltar para a escolha">${ic('i-esq')}</button><button type="button" data-n="0">0</button><button type="button" data-n="apagar" aria-label="Apagar">⌫</button></div>`;
    const pontos = () => $$('.pin-pontos i', el).forEach((p, i) => p.classList.toggle('cheio', i < digitado.length));
    const teclar = n => {
      if (n === 'voltar') return telaEntrada();
      if (n === 'apagar') digitado = digitado.slice(0, -1);
      else if (digitado.length < 4) digitado += n;
      pontos();
      $('#pin-status').textContent = `${digitado.length} de 4`;
      if (digitado.length === 4) {
        if (digitado === u.pin) entrarComo(u.id);
        else { const pp = $('.pin-pontos', el); pp.classList.remove('tremer'); void pp.offsetWidth; pp.classList.add('tremer'); digitado = ''; setTimeout(pontos, 300); $('#pin-status').textContent = 'Senha errada'; }
      }
    };
    $('.teclado', el).addEventListener('click', ev => { const b = ev.target.closest('button'); if (b) teclar(b.dataset.n); });
    el.onkeydown = ev => { if (/^\d$/.test(ev.key)) teclar(ev.key); else if (ev.key === 'Backspace') teclar('apagar'); else if (ev.key === 'Escape') teclar('voltar'); };
    $('.teclado button', el).focus();
    return;
  }
  el.onkeydown = null;
  el.innerHTML = `${broto('contente', { tamanho: 100 })}
    <h1>Quem tá anotando?</h1>
    <p>Cada um tem o seu caderno.</p>
    <div class="pessoas">${e.usuarios.map(u => `<button type="button" class="pessoa rabisco" data-pessoa="${u.id}">
      <span class="avatar" style="--cor:${u.cor}">${esc(u.nome.trim()[0] || '?')}</span><b>${esc(u.nome)}</b>${u.pin ? `<small>${ic('i-cadeado')}</small>` : ''}</button>`).join('')}</div>`;
  $$('[data-pessoa]', el).forEach(b => b.addEventListener('click', () => {
    const u = e.usuarios.find(x => x.id === b.dataset.pessoa);
    if (u.pin) telaEntrada('pin', u.id); else entrarComo(u.id);
  }));
  $('[data-pessoa]', el).focus();
}

function entrarComo(id) {
  Dados.entrar(id);
  try { sessionStorage.setItem('caderninho.aberto', id); } catch (e) { /* sem sessionStorage, pede de novo */ }
  $('#entrada').hidden = true; $('#entrada').innerHTML = ''; $('#app').inert = false;
  Tela.aba = 'mes'; Tela.mes = hojeIso().slice(0, 7);
  render();
  avisar(`Oi, ${Dados.pessoa.nome}!`);
}

// ------------------------------------------------------------------ instalar (PWA)
const Instalar = { evento: null };
addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); Instalar.evento = e;
  const s = $('#secao-instalar'); if (s) s.hidden = false;
});

// ------------------------------------------------------------------ ações (cliques)
const acoes = {
  fechar: () => fecharFolha(),
  mes: d => { Tela.mes = +d.passo === 0 ? hojeIso().slice(0, 7) : Fatura.proximaChave(Tela.mes, +d.passo); render(); },
  anotar: () => formLanc(),
  editar: d => { fecharFolha(); formLanc(d.id, Tela.mes); },
  fatura: d => abrirFatura(d.cartao, d.chave),
  pagar: d => {
    const paga = !Dados.faturaPaga(d.cartao, d.chave);
    Dados.marcarPaga(d.cartao, d.chave, paga);
    abrirFatura(d.cartao, d.chave); render();
    avisar(paga ? 'Fatura paga. Menos uma!' : 'Desmarcada.');
  },
  'novo-cartao': () => formCartao(),
  'editar-cartao': d => formCartao(d.id),
  'apagar-cartao': async d => {
    const c = Dados.caderno.cartoes.find(x => x.id === d.id);
    const n = Dados.caderno.lancamentos.filter(l => l.cartaoId === d.id).length;
    if (await perguntar(`Apagar o cartão ${c.apelido}?`, { sim: 'Apagar', detalhe: n ? `As ${n} compras feitas nele também somem do caderno.` : '' })) {
      Dados.apagarCartao(d.id); fecharFolha(); render(); avisar('Cartão apagado.');
    }
  },
  tema: d => { Dados.estado.tema = d.tema; Dados.salvar(); aplicarAparencia(); render(); },
  traco: (d, el) => { Dados.estado.traco = el.checked; Dados.salvar(); aplicarAparencia(); },
  trocar: () => { try { sessionStorage.removeItem('caderninho.aberto'); } catch (e) { /* */ } telaEntrada(); },
  'editar-pessoa': d => formPessoa(d.id),
  exportar: () => {
    const blob = new Blob([Dados.exportar()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `caderninho-${hojeIso()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    avisar('Cópia salva nos downloads.');
  },
  importar: () => $('#arquivo').click(),
  instalar: async () => {
    if (!Instalar.evento) return;
    Instalar.evento.prompt();
    const r = await Instalar.evento.userChoice.catch(() => null);
    Instalar.evento = null; render();
    if (r && r.outcome === 'accepted') avisar('Instalado! Procura o ícone na tela inicial.');
  },
  zerar: async () => {
    if (await perguntar('Apagar o seu caderno inteiro?', { sim: 'Apagar tudo', detalhe: 'Cartões, anotações e faturas pagas. O caderno da outra pessoa fica como está. Não dá pra desfazer (a não ser com uma cópia salva).' })) {
      Dados.estado.cadernos[Dados.estado.atual] = Dados.cadernoVazio(); Dados.salvar(); irPara('mes'); avisar('Caderno zerado.');
    }
  },
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-acao]');
  if (el && !(el.tagName === 'INPUT')) { const fn = acoes[el.dataset.acao]; if (fn) { e.preventDefault(); fn(el.dataset, el); } }
  const aba = e.target.closest('.abas [data-aba]');
  if (aba) { fecharFolha(); irPara(aba.dataset.aba); }
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.matches('input[data-acao]')) acoes[el.dataset.acao](el.dataset, el);
  if (el.id === 'arquivo' && el.files[0]) {
    el.files[0].text().then(async txt => {
      if (!await perguntar('Restaurar esta cópia?', { sim: 'Restaurar', detalhe: 'O que está no celular agora é trocado pelo que está na cópia (das duas pessoas).' })) return;
      try { Dados.importar(txt); aplicarAparencia(); render(); avisar('Cópia restaurada!'); }
      catch (err) { avisar('Esse arquivo não é uma cópia do Caderninho.'); }
    }).finally(() => { el.value = ''; });
  }
});
$('#anotar').addEventListener('click', () => formLanc());
$('#quem').addEventListener('click', () => acoes.trocar());
$('#veu').addEventListener('click', fecharFolha);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#folha').hidden && !$('#pergunta').open) fecharFolha(); });

// dica do gráfico: tocar (ou passar o mouse) numa coluna mostra os valores
function mostrarDica(alvo) {
  const box = alvo.closest('.grafico'); if (!box) return;
  let d = $('.dica-toque', box);
  if (!d) { d = document.createElement('div'); d.className = 'dica-toque'; box.appendChild(d); }
  const [mes, e, s] = alvo.dataset.dica.split('|');
  d.innerHTML = `<b>${mes}</b><br>entrou ${e}<br>saiu ${s}`;
  const rb = box.getBoundingClientRect(), ra = alvo.getBoundingClientRect();
  const x = Math.min(rb.width - 70, Math.max(70, ra.left - rb.left + ra.width / 2));
  d.style.left = x + 'px'; d.style.top = '64px';
}
document.addEventListener('pointerover', e => { if (e.target.dataset && e.target.dataset.dica) mostrarDica(e.target); });
document.addEventListener('focusin', e => { if (e.target.dataset && e.target.dataset.dica) mostrarDica(e.target); });
document.addEventListener('pointerout', e => { if (e.target.dataset && e.target.dataset.dica && e.pointerType === 'mouse') { const d = $('.dica-toque'); if (d) d.remove(); } });

// ------------------------------------------------------------------ começar
const VERSAO = '1.0.0';
Dados.carregar();
aplicarAparencia();
(function iniciar() {
  const e = Dados.estado;
  let aberto = null;
  try { aberto = sessionStorage.getItem('caderninho.aberto'); } catch (err) { /* */ }
  const atual = e.usuarios.find(u => u.id === e.atual);
  // abre direto quando a pessoa não tem senha, ou quando já digitou nesta sessão
  if (atual && (!atual.pin || aberto === atual.id)) { render(); }
  else { render(); telaEntrada(atual && atual.pin ? 'pin' : 'escolher', atual && atual.id); }
})();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
