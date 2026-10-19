# CLAUDE.md: Caderninho

Antes de mexer, leia o `COMBINADOS.md` (o que foi decidido) e o `README.md` (como funciona).

A alma é a mesma dos outros projetos do Rosival (veja o `CLAUDE.md` do repositório `Jogo`): feito com carinho, com vida calma, em português do Brasil, simples e caloroso. Fale com ele em português, sem jargão, e explique o porquê das decisões.

## Regras deste projeto

- **JavaScript puro, sem frameworks e sem build.** Abre direto no navegador.
- **O cálculo fica sem tela, em `js/fatura.js` (faturas, mês, dívidas) e `js/saude.js` (lembretes, termômetro).** Toda mudança de regra ganha teste em `testes/` (`npm test`).
- **Dicas (`js/dicas.js`):** só informação confirmada, sem taxas que mudam; nunca prometer rendimento.
- **Dinheiro sempre em centavos (número inteiro).** Nunca somar reais com vírgula.
- **Datas em texto `AAAA-MM-DD`**, no dia do aparelho (não em UTC).
- **Dados do usuário nunca se perdem.** Mudou o formato? Faça a migração em `Dados.carregar()`. A cópia de segurança tem que continuar abrindo.
- **Visual feito à mão:** contorno de tinta com os filtros `#tremor0..2`, hachura em vez de degradê, Caveat/Alegreya Sans/Cinzel, os dois temas (papel e noite). Nada de visual genérico.
- **Celular primeiro:** testar em 320 px e 390 px (`npm run telas`), sem nada vazando, contraste AA, botões de pelo menos 44 px.
- **Ao mudar qualquer arquivo do app**, subir a `VERSAO` em `sw.js` e em `js/app.js`.
- **Registrar no `COMBINADOS.md`** o que for decidido com o Rosival.
