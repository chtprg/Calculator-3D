'use strict';
// Os dados ficam só no aparelho (localStorage). Nada vai para a internet.
// Duas pessoas, cada uma com o seu caderno: os lançamentos de uma não se misturam com os da outra.

const CHAVE_DADOS = 'caderninho.v1';

const Dados = {
  estado: null,

  vazio() {
    return {
      versao: 1,
      usuarios: [],          // { id, nome, cor, pin }
      atual: null,           // id de quem está anotando
      tema: 'auto',          // auto | papel | noite
      traco: true,           // o traço "ferve" (tremidinho vivo)
      cadernos: {},          // id da pessoa -> { cartoes, lancamentos, pagas, dividas }
    };
  },
  cadernoVazio: () => ({ cartoes: [], lancamentos: [], pagas: {}, dividas: [], avisos: {}, reserva: 0 }),

  // cadernos antigos ganham o que veio depois (nada se perde)
  migrar() {
    if (!this.estado.criadoEm) this.estado.criadoEm = new Date().toISOString();
    for (const cad of Object.values(this.estado.cadernos || {})) {
      if (!Array.isArray(cad.dividas)) cad.dividas = [];
      if (!cad.pagas) cad.pagas = {};
      if (!cad.avisos) cad.avisos = {};
    }
  },

  carregar() {
    try {
      const txt = localStorage.getItem(CHAVE_DADOS);
      this.estado = txt ? Object.assign(this.vazio(), JSON.parse(txt)) : this.vazio();
    } catch (e) {
      this.estado = this.vazio();
    }
    this.migrar();
    // pede ao navegador para não apagar os dados quando faltar espaço
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    return this.estado;
  },

  salvar() {
    try { localStorage.setItem(CHAVE_DADOS, JSON.stringify(this.estado)); return true; }
    catch (e) { return false; }
  },

  novoId: () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7),

  get pessoa() { return this.estado.usuarios.find(u => u.id === this.estado.atual) || null; },
  get caderno() {
    const id = this.estado.atual;
    if (!id) return this.cadernoVazio();
    if (!this.estado.cadernos[id]) this.estado.cadernos[id] = this.cadernoVazio();
    return this.estado.cadernos[id];
  },

  // ---- pessoas
  criarPessoas(nomes) {
    const cores = ['#5f9d3d', '#c4577a'];
    this.estado.usuarios = nomes.map((nome, i) => ({ id: 'p' + (i + 1), nome, cor: cores[i], pin: '' }));
    for (const u of this.estado.usuarios) this.estado.cadernos[u.id] = this.estado.cadernos[u.id] || this.cadernoVazio();
    this.salvar();
  },
  entrar(id) { this.estado.atual = id; this.salvar(); },

  // ---- cartões
  salvarCartao(c) {
    const lista = this.caderno.cartoes, i = lista.findIndex(x => x.id === c.id);
    if (i > -1) lista[i] = c; else lista.push(Object.assign({ id: this.novoId() }, c));
    this.salvar();
  },
  apagarCartao(id) {
    const cad = this.caderno;
    cad.cartoes = cad.cartoes.filter(c => c.id !== id);
    cad.lancamentos = cad.lancamentos.filter(l => l.cartaoId !== id);
    for (const k of Object.keys(cad.pagas)) if (k.startsWith(id + '|')) delete cad.pagas[k];
    this.salvar();
  },

  // ---- lançamentos
  salvarLancamento(l) {
    const lista = this.caderno.lancamentos, i = lista.findIndex(x => x.id === l.id);
    if (i > -1) lista[i] = l; else lista.push(Object.assign({ id: this.novoId(), criado: new Date().toISOString() }, l));
    this.salvar();
  },
  apagarLancamento(id) {
    this.caderno.lancamentos = this.caderno.lancamentos.filter(l => l.id !== id);
    this.salvar();
  },

  // ---- rendas: salário e trabalhos paralelos (lançamentos de entrada que repetem todo mês)
  rendas() { return this.caderno.lancamentos.filter(l => l.renda); },
  ajustarMes(id, chave, valor) {
    const l = this.caderno.lancamentos.find(x => x.id === id);
    if (!l) return;
    l.ajustes = l.ajustes || {};
    if (valor == null || valor === l.valor) delete l.ajustes[chave]; else l.ajustes[chave] = valor;
    this.salvar();
  },

  // ---- dívidas (carnê, boleto, "na palavra")
  salvarDivida(d) {
    const lista = this.caderno.dividas, i = lista.findIndex(x => x.id === d.id);
    if (i > -1) lista[i] = d; else lista.push(Object.assign({ id: this.novoId(), pagamentos: {}, criado: new Date().toISOString() }, d));
    this.salvar();
  },
  apagarDivida(id) {
    this.caderno.dividas = this.caderno.dividas.filter(d => d.id !== id);
    this.salvar();
  },
  // valor em centavos; null desfaz o pagamento daquele mês
  pagarDivida(id, chave, valor) {
    const d = this.caderno.dividas.find(x => x.id === id);
    if (!d) return;
    d.pagamentos = d.pagamentos || {};
    if (valor == null) delete d.pagamentos[chave]; else d.pagamentos[chave] = valor;
    this.salvar();
  },

  // ---- lembretes: até quando cada um fica quieto
  silenciar(id, ate) {
    const av = this.caderno.avisos || (this.caderno.avisos = {});
    av[id] = ate;
    // limpa os muito antigos
    const corte = new Date(Date.now() - 200 * 864e5).toISOString().slice(0, 10);
    for (const k of Object.keys(av)) if (av[k] < corte) delete av[k];
    this.salvar();
  },
  copiaSalva(hoje) { this.estado.ultimaCopia = hoje; this.salvar(); },

  // ---- reserva de emergência (quanto tem guardado)
  salvarReserva(valor) { this.caderno.reserva = Math.max(0, valor | 0); this.salvar(); },

  // ---- faturas pagas
  faturaPaga(cartaoId, chave) { return !!this.caderno.pagas[cartaoId + '|' + chave]; },
  marcarPaga(cartaoId, chave, paga) {
    const k = cartaoId + '|' + chave;
    if (paga) this.caderno.pagas[k] = new Date().toISOString().slice(0, 10); else delete this.caderno.pagas[k];
    this.salvar();
  },

  // ---- cópia de segurança (o arquivo leva as duas pessoas juntas)
  exportar() {
    return JSON.stringify(Object.assign({ app: 'caderninho', salvoEm: new Date().toISOString() }, this.estado), null, 1);
  },
  importar(txt) {
    const obj = JSON.parse(txt);
    if (!obj || obj.app !== 'caderninho' || !Array.isArray(obj.usuarios) || typeof obj.cadernos !== 'object') throw new Error('arquivo');
    delete obj.app; delete obj.salvoEm;
    const atual = this.estado.atual;
    this.estado = Object.assign(this.vazio(), obj);
    this.migrar();
    if (this.estado.usuarios.some(u => u.id === atual)) this.estado.atual = atual;
    this.salvar();
  },
};
