# Caderninho 🌱

O caderno de contas da casa. Um app pra duas pessoas, cada uma com o seu caderno, pra enxergar pra onde o dinheiro vai.

É um **PWA**: abre no navegador, instala na tela inicial (sem loja) e funciona **sem internet**. Os dados ficam **só no celular**. Não conecta com banco nenhum: você mesmo anota o que comprou.

## O que ele faz

- **Duas pessoas, dois cadernos.** Na primeira vez ele pergunta os dois nomes. Depois, é só tocar em quem está anotando. Dá pra pôr uma senha de 4 números em cada um (em Ajustes). A senha só evita abrir o caderno do outro sem querer; não é um cofre.
- **Cartões com o dia que fecha e o dia que vence.** Com os logos de verdade dos bancos (Nubank, Banco do Brasil, Itaú, Bradesco, Santander, Caixa, Inter, C6, Mercado Pago, PicPay e outros).
- **Em qual fatura a compra cai.** Ao anotar uma compra no cartão, aparece na hora: *"Vai cair na fatura de novembro: fecha 3 de nov e vence 10 de nov"*.
  - Compra **antes** do dia do fechamento entra na fatura aberta.
  - Compra **no dia** do fechamento ou depois vai pra próxima. Por isso esse dia é o "melhor dia de compra".
  - Se o vencimento é num dia menor que o do fechamento (fecha 25, vence 5), ele vence no mês seguinte.
  - Parcelado: cada parcela cai numa fatura, uma depois da outra. Os centavos que sobram da divisão vão na primeira.
  - Mês curto: fechamento no dia 31 vira o último dia do mês.
- **O mês.** Quanto entrou, quanto saiu no Pix/débito/dinheiro, quanto foi de fatura, e a **sobra** (verde) ou o que **faltou** (vermelho). Compras no cartão contam no mês em que a fatura **vence**, porque é aí que o dinheiro sai da conta.
- **Renda (na aba Carteira).** O salário e os trabalhos paralelos, cada um com o dia em que cai (ex.: todo dia 10). Todo mês ele entra sozinho no caderno: antes do dia aparece como "vai entrar", depois como "caiu". Se um mês veio diferente (hora extra, desconto), muda só aquele mês. Saiu do emprego? "Parar" mantém os meses de antes.
- **Dívidas e carnês (na aba Carteira).** Para o que é pago fora do cartão: carnê, boleto, "na palavra". Você anota quanto deve e quanto paga por mês, e ele calcula quando termina.
  - Exemplo: deve R$ 1.475,76 e paga R$ 200 por mês. São 8 meses (7 de R$ 200 e a última de R$ 75,76).
  - Todo mês é só tocar em "Paguei". Pagou menos (R$ 150 em vez de R$ 200)? Ele refaz a conta para terminar na mesma data: primeiro a última parcela absorve a diferença; quando não dá mais, as próximas parcelas sobem por igual.
  - Prefere manter a parcela igual e terminar depois? Um toque troca ("prefiro assim"). Pagou a mais? Termina antes.
  - Mês que passou sem pagamento marcado aparece como "não pago".
  - As parcelas entram no resumo do mês, em "Dívidas e carnês".
- **Lembretes (o sininho).** Quando o app abre, aparece um bilhete:
  - 3 dias antes de vencer uma fatura ou parcela: *"A fatura do Nubank vence em 3 dias: R$ 145,89"*;
  - venceu e não foi marcada: *"Já pagou a fatura do Ourocard?"*, com "Já paguei" e "Ainda não" (pergunta de novo no dia seguinte);
  - parcela de dívida atrasada: "Paguei R$ 200", "Paguei outro valor" ou "Ainda não";
  - 15 dias sem salvar a cópia de segurança.
  Avisos com o celular fechado (notificação do sistema) precisariam de um servidor; por isso o lembrete aparece ao abrir o app.
- **Saúde.** Uma aba com três partes:
  - *Como estou:* uma nota de 0 a 100 do mês (sobra, parcelas e dívidas, contas em dia e reserva de emergência), a régua 50/30/20 e conselhos feitos com os números de vocês ("Assinaturas: R$ 55,90 por mês, R$ 670,80 por ano", "Pagando R$ 50 a mais, o carnê termina um mês antes").
  - *Pra onde foi:* categorias, maiores gastos e os últimos 6 meses.
  - *Dicas:* 39 dicas escritas para o Brasil (organizar, gastar menos, cartão, sair das dívidas, reserva, investir). A "dica de hoje" muda todo dia e escolhe o que combina com a situação (quem tem dívida vê primeiro as dicas de dívida). É conteúdo para aprender, não recomendação de investimento.
- **Repete todo mês.** Salário, aluguel, internet, assinaturas. Apagar um fixo num mês depois do primeiro pergunta se é pra **parar de repetir** (o passado fica).
- **Faturas.** Ver cada fatura (anterior e próximas), com carimbo de *aberta*, *fechada*, *vencida* ou *paga*, e marcar como paga. Com o limite do cartão, mostra quanto já está comprometido.
- **Pra onde foi.** Gastos por categoria, os 5 maiores gastos do mês e os últimos 6 meses (entrou × saiu), também em tabela.
- **Cópia de segurança.** Em Ajustes: "Salvar cópia" baixa um arquivo com os dois cadernos; "Restaurar cópia" traz de volta (pra trocar de celular, por exemplo).
- **Tema papel ou noite**, ou igual ao celular. **Traço vivo**: a tinta treme de leve, como desenho feito quadro a quadro (desliga em Ajustes; quem pede menos movimento no celular já recebe tudo parado).

## O visual

Feito à mão em código, com a mesma alma do Zelda Chronicles e do Pavio:

- papel com textura e fibras, folhas pautadas com a margem vermelha, bilhete com fita adesiva;
- contorno de tinta tremidinho (filtros SVG que se revezam 8 vezes por segundo), hachura de lápis em vez de degradê, marca-texto por cima dos valores;
- letras **Caveat** (escrita à mão), **Alegreya Sans** (texto) e **Cinzel** (carimbos);
- ícones de categoria desenhados como rabisco de caneta;
- o **Broto** toma conta do caderno: feliz quando sobra, apertado quando falta, dormindo quando o caderno está vazio. Ele respira devagar.

## Como usar no celular

1. Publicar a pasta (veja abaixo) e abrir o endereço no Chrome do Android ou no Safari do iPhone.
2. **Android:** Ajustes › Instalar, ou o menu ⋮ › "Instalar app". **iPhone:** botão Compartilhar › "Adicionar à Tela de Início".
3. Cada um instala no próprio celular. Os dados de um celular não vão para o outro (não tem servidor). Se os dois usarem o mesmo celular, cada um toca no seu nome.

## Publicar

Igual ao Zelda Chronicles:

```bash
python3 empacotar.py      # gera caderninho.zip só com o app
```

Arrastar o `caderninho.zip` na aba **Deploys** do Netlify. Precisa ser **https** pra instalar e funcionar offline.

Ao mudar qualquer arquivo do app, suba a `VERSAO` em `sw.js` (e em `js/app.js`) para os celulares buscarem a versão nova.

### Virar APK (depois)

Com o site publicado, usar o **PWABuilder** (pwabuilder.com) › pacote Android (TWA). Ele gera o APK e o arquivo `.well-known/assetlinks.json`, que vai para a pasta do site (o mesmo caminho do Zelda Chronicles).

## Pastas

| Caminho | O que é |
|---|---|
| `index.html` | a página, com os ícones de rabisco e os filtros do traço |
| `css/app.css` | o papel, a tinta, os dois temas |
| `js/fatura.js` | **o cálculo das faturas, das dívidas e do mês** (sem tela; é o que os testes conferem) |
| `js/saude.js` | lembretes, termômetro e conselhos com os números (sem tela, com testes) |
| `js/dicas.js` | a biblioteca de dicas |
| `js/dados.js` | onde os dados são guardados (localStorage) e a cópia de segurança |
| `js/bancos.js` | a lista de bancos, com a cor de cada cartão |
| `js/desenho.js` | a textura de papel, o Broto e o selo do banco |
| `js/app.js` | as telas |
| `sw.js`, `manifest.webmanifest` | o que faz virar app e funcionar offline |
| `logos/` | logos dos bancos (coleção [Bancos em SVG](https://github.com/Tgentil/Bancos-em-SVG)); uso pessoal |
| `icones/` | ícones do app; `node icones/gerar.js` gera de novo a partir de `molde.html` |
| `testes/` | testes do cálculo e o passeio pelas telas |

## Testes

```bash
npm test                  # o cálculo das faturas (node, sem instalar nada)
npm run servir            # em outro terminal
npm run telas             # passeio pelas telas em 390 e 320 px, tema papel e noite; prints em prints/
```

O passeio usa `?hoje=2026-10-19` para fixar o dia e conferir sempre as mesmas faturas.
