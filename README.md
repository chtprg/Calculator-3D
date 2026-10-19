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
| `js/fatura.js` | **o cálculo das faturas e do mês** (sem tela; é o que os testes conferem) |
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
