// Passeio pelas telas no navegador: monta um caderno de exemplo, tira prints e confere
// que nada vaza da tela (320 px e 390 px) e que não aparece erro no console.
// Rodar: npx http-server -p 8123 . (em outro terminal) e depois: node testes/telas.js [pasta-dos-prints]
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const URL0 = process.env.URL || 'http://localhost:8123/?hoje=2026-10-19';
const pasta = process.argv[2] || 'prints';
const fs = require('fs'); fs.mkdirSync(pasta, { recursive: true });

(async () => {
  const b = await chromium.launch();
  let falhas = 0;
  for (const [largura, tema] of [[390, 'papel'], [320, 'papel'], [390, 'noite']]) {
    const ctx = await b.newContext({ viewport: { width: largura, height: 800 }, deviceScaleFactor: 2, reducedMotion: 'reduce', locale: 'pt-BR' });
    const p = await ctx.newPage();
    const erros = [];
    p.on('pageerror', e => erros.push(e.message));
    p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
    const foto = async nome => {
      const vaza = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      if (vaza) { console.log(`VAZA ${largura}px em ${nome}`); falhas++; }
      await p.screenshot({ path: `${pasta}/${largura}-${tema}-${nome}.png`, fullPage: true });
    };
    await p.goto(URL0);
    await p.evaluate(t => { localStorage.clear(); sessionStorage.clear(); }, tema);
    await p.reload();
    await foto('01-boas-vindas');
    await p.fill('[name=n1]', 'Rosa'); await p.fill('[name=n2]', 'Tiago');
    await p.click('#form-nomes button[type=submit]');
    await foto('02-quem');
    await p.click('[data-pessoa=p1]');
    if (tema === 'noite') await p.evaluate(() => { Dados.estado.tema = 'noite'; Dados.salvar(); aplicarAparencia(); });
    await foto('03-mes-vazio');
    // cartões
    await p.click('[data-aba=carteira]');
    await p.click('[data-acao=novo-cartao]');
    await p.click('[data-banco=nubank]'); await p.fill('[name=apelido]', 'Nubank');
    await p.selectOption('[name=fechamento]', '3'); await p.selectOption('[name=vencimento]', '10');
    await p.fill('[name=limite]', '3.000'); await p.fill('[name=final]', '4821');
    await foto('04-novo-cartao');
    await p.click('#form-cartao [type=submit]');
    await p.click('[data-acao=novo-cartao]');
    await p.click('[data-banco=bb]'); await p.fill('[name=apelido]', 'Ourocard');
    await p.selectOption('[name=fechamento]', '25'); await p.selectOption('[name=vencimento]', '5');
    await p.click('#form-cartao [type=submit]');
    // anotações
    const anotar = async (o) => {
      await p.click('#anotar');
      if (o.entrada) await p.click('[data-tipo=receita]');
      await p.fill('#valor', o.valor); await p.fill('[name=descricao]', o.desc);
      if (o.forma) await p.click(o.forma);
      if (o.data) await p.fill('[name=data]', o.data);
      for (let i = 1; i < (o.parc || 1); i++) await p.click('[data-parc="1"]');
      if (o.cat) await p.click(`[data-cat=${o.cat}]`);
      if (o.fixo) await p.check('[name=fixo]');
      if (o.foto) await foto(o.foto);
      await p.click('#form-lanc [type=submit]');
    };
    // renda: salário todo dia 10 e um trabalho paralelo todo dia 25
    await p.click('[data-aba=carteira]');
    await p.click('[data-acao=nova-renda]');
    await p.fill('[name=nome]', 'Loja do centro'); await p.fill('#valor-renda', '2500');
    await p.selectOption('#form-renda [name=dia]', '10');
    await foto('05a-nova-renda');
    await p.click('#form-renda [type=submit]');
    await p.click('[data-acao=nova-renda] >> nth=-1');
    await p.click('[data-renda=paralelo]');
    await p.fill('[name=nome]', 'Conserto de celular'); await p.fill('#valor-renda', '700');
    await p.selectOption('#form-renda [name=dia]', '25');
    await p.click('#form-renda [type=submit]');
    // a dívida do exemplo: R$ 1.475,76, pagando R$ 200 por mês; em outubro só deu R$ 150
    await p.click('[data-acao=nova-divida]');
    await p.fill('#form-divida [name=nome]', 'Geladeira da loja'); await p.fill('[name=credor]', 'Zé da loja');
    await p.fill('[name=total]', '1475,76'); await p.fill('[name=parcela]', '200');
    await p.selectOption('#form-divida [name=dia]', '15');
    await foto('05b-nova-divida');
    await p.click('#form-divida [type=submit]');
    await p.fill('#valor-pago', '150');
    await p.click('[data-acao=pagar-divida]');
    await foto('05c-divida');
    const recado = await p.locator('#folha .recado').innerText();
    if (!/150,00 de R\$ 200,00/.test(recado)) { console.log('ERRO: recado do recálculo:', recado); falhas++; }
    await p.click('#folha [data-acao=fechar]');
    await foto('05d-carteira');
    await anotar({ entrada: true, valor: '150', desc: 'Bico de sábado', data: '2026-10-11', cat: 'paralelo' });
    await anotar({ valor: '412,37', desc: 'Feira do mês', data: '2026-10-02', forma: '[data-forma=pix]', cat: 'mercado' });
    await anotar({ valor: '1200', desc: 'Aluguel', data: '2026-10-10', forma: '[data-forma=pix]', cat: 'casa', fixo: true });
    await anotar({ valor: '899,90', desc: 'Geladeira nova', data: '2026-10-19', forma: '[data-forma=cartao]:first-of-type', parc: 10, cat: 'casa', foto: '05-anotar-parcelado' });
    await anotar({ valor: '55,90', desc: 'Streaming', data: '2026-09-15', forma: '[data-forma=cartao]', cat: 'assinaturas', fixo: true });
    await anotar({ valor: '86', desc: 'Pizza de sexta', data: '2026-10-01', forma: '[data-forma=cartao]', cat: 'comida' });
    await anotar({ valor: '230', desc: 'Farmácia', data: '2026-10-12', forma: '[data-forma=debito]', cat: 'saude' });
    await anotar({ valor: '149,90', desc: 'Tênis', data: '2026-09-20', forma: '[data-forma=cartao]:nth-of-type(2)', cat: 'roupas' });
    await p.click('[data-acao=mes][data-passo="0"]').catch(() => {});
    await p.click('[data-aba=mes]');
    await foto('06-mes');
    await p.click('[data-acao=mes][data-passo="1"]');
    await foto('07-mes-novembro');
    await p.click('[data-aba=carteira]');
    await foto('08-cartoes');
    await p.click('.plastico >> nth=0');
    await foto('09-fatura');
    await p.click('[data-acao=pagar]');
    await p.click('[data-acao=fatura][aria-label="Fatura anterior"]');
    await foto('10-fatura-anterior');
    await p.click('#folha [data-acao=fechar]');
    await p.click('[data-aba=onde]');
    await foto('11-pra-onde-foi');
    await p.click('[data-aba=ajustes]');
    await foto('12-ajustes');
    // editar e confirmar apagar
    await p.click('[data-aba=mes]');
    await p.click('.lanc[data-acao=editar] >> nth=0');
    await p.click('#apagar-lanc');
    await foto('13-confirmar');
    await p.click('#pergunta-nao');
    await p.click('#folha [data-acao=fechar]');
    // a outra pessoa tem o caderno vazio
    await p.click('#quem');
    await p.click('[data-pessoa=p2]');
    const vazio = await p.locator('.lanc').count();
    if (vazio) { console.log('ERRO: o caderno da outra pessoa não está separado'); falhas++; }
    if (erros.length) { console.log(`ERROS ${largura}px:`, erros); falhas += erros.length; }
    await ctx.close();
  }
  await b.close();
  console.log(falhas ? `${falhas} problema(s)` : 'Tudo certo nas telas.');
  process.exit(falhas ? 1 : 0);
})();
