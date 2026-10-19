# O que ficou combinado

Registro das decisões do Caderninho, para nada se perder entre sessões.

## A ideia (19/10/2026)

- **App pessoal de controle financeiro**, só para o casal. A motivação: o dinheiro escapa sem a gente perceber. A ideia é uma planilha bonita e organizada, simples de usar.
- **PWA**, igual ao Zelda Chronicles: instala pelo navegador, sem loja. APK depois, pelo PWABuilder.
- **Sem integração com banco.** Tudo é anotado à mão.
- **A função principal:** cadastrar os cartões com dia de fechamento e de vencimento, e o app calcula sozinho em qual fatura cada compra cai.
- **Login simples:** duas pessoas, cada uma com o seu caderno, sem misturar. Senha de 4 números opcional. Sem conta, sem servidor.
- **Referência de funcionalidade:** o app Pierre. **Referência de visual:** o Zelda Chronicles e o Pavio (traço feito à mão, cartoon, com alma, nada com cara de IA genérica).
- **Logos reais dos bancos** (Nubank, Banco do Brasil e outros), porque é um projeto pessoal, sem distribuição pública. Isso é uma exceção à regra "nada de terceiros" do `CLAUDE.md` dos jogos, que continua valendo para o que for publicado.

## Decisões da primeira versão (19/10/2026)

- **Nome:** Caderninho (o caderno de contas da casa, como o caderninho de fiado de antigamente).
- **Regra da fatura:** compra no dia do fechamento já vai para a próxima fatura (como fazem os bancos). Vencimento menor ou igual ao fechamento vence no mês seguinte. Dia 31 em mês curto vira o último dia.
- **Cada fatura é chamada pelo mês em que vence**, e as compras no cartão contam no mês em que a fatura vence (é quando o dinheiro sai da conta).
- **Parcelado:** cada parcela numa fatura seguida; os centavos que sobram ficam na primeira.
- **Fixos ("repete todo mês"):** servem para salário, aluguel, assinaturas (no cartão também). Apagar num mês depois do começo pergunta se é para parar de repetir; o passado fica.
- **Dados só no aparelho** (localStorage), com cópia de segurança em arquivo que leva as duas pessoas juntas.
- **O Broto** aparece no bilhete do mês e muda de humor com o saldo. Frases calmas, sem bronca: *"Esse mês apertou… mas agora a gente sabe pra onde foi."*
- **Gráfico:** entrou em verde cheio e saiu em vermelho riscado, para dar para separar mesmo sem enxergar cor; sempre com tabela.

## Renda e dívidas (19/10/2026, pedido do Rosival)

- **Renda:** salário (cai todo dia 10) e **trabalhos paralelos**, cada um com o seu dia. Entram sozinhos todo mês, sem precisar anotar. Um mês diferente pode ser ajustado só naquele mês.
- **Dívidas fora do cartão** (carnê, boleto, "na palavra", comum em cidade pequena): anota o valor que deve e quanto paga por mês; o app calcula em quantos meses termina.
- **Pagou menos num mês:** o padrão é **terminar na mesma data**, com as próximas parcelas subindo. Quando a última parcela tem folga, ela absorve a diferença primeiro (ex.: R$ 1.475,76 a R$ 200/mês, pagando R$ 150 em outubro: continua terminando em maio, e a última vai de R$ 75,76 para R$ 125,76). Dá para trocar para "manter a parcela e terminar depois".
- A aba **Cartões** virou **Carteira**: Renda, Cartões e Dívidas.

## Ideias para depois (ainda não feitas)

- Os dois verem um resumo junto (o "caderno da casa"), se quiserem: precisaria de sincronizar entre os celulares.
- Metas e caixinhas ("guardar para…").
- Orçamento por categoria com aviso quando passar.
- Lembrete de vencimento por notificação.
