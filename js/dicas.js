'use strict';
// A biblioteca de dicas: organizar, gastar menos, sair das dívidas, reserva e investir.
// Escrita para o Brasil, em linguagem de gente. Sem taxas que mudam toda hora (Selic, juros do mês),
// para não ficar desatualizada. Conteúdo educativo, não é recomendação de investimento.
//
// `quando` diz em que situação a dica aparece primeiro como "dica do dia":
// sempre · divida · cartao · negativo · sobra · sem-reserva · reserva-ok

const TEMAS = [
  { id: 'organizar', nome: 'Organizar', ic: 'i-mes' },
  { id: 'gastar', nome: 'Gastar menos', ic: 'c-mercado' },
  { id: 'cartao', nome: 'Cartão', ic: 'i-cartao' },
  { id: 'dividas', nome: 'Sair das dívidas', ic: 'c-dividas' },
  { id: 'reserva', nome: 'Reserva', ic: 'c-casa' },
  { id: 'investir', nome: 'Investir', ic: 'c-extra' },
];

const DICAS = [
  // ---------------------------------------------------------------- organizar
  { id: 'pague-se', tema: 'organizar', quando: ['sobra', 'sem-reserva'], titulo: 'Pague você primeiro',
    texto: 'Quando o salário cair, separe logo o que vai guardar, nem que sejam R$ 20. O que sobra no fim do mês quase nunca sobra; o que é separado no começo, fica.' },
  { id: '503020', tema: 'organizar', quando: ['sempre'], titulo: 'A regra do 50, 30, 20',
    texto: 'Uma referência simples: uns 50% do que entra para o essencial (casa, mercado, contas), até 30% para os desejos (lazer, comida fora, roupas) e pelo menos 20% para guardar ou pagar dívida. Não é lei; é uma régua pra comparar.' },
  { id: 'anote-na-hora', tema: 'organizar', quando: ['sempre'], titulo: 'Anote na hora',
    texto: 'Gasto anotado no fim do dia é gasto esquecido. Comprou, abriu o Caderninho, anotou. Leva dez segundos.' },
  { id: 'conversa', tema: 'organizar', quando: ['sempre', 'negativo'], titulo: 'Conversa de casal sobre dinheiro',
    texto: 'Uma vez por mês, 20 minutos, sem procurar culpado: o que entrou, o que saiu, o que dá pra mudar. Dinheiro vira briga quando ninguém fala dele.' },
  { id: 'meta-nome', tema: 'organizar', quando: ['sobra'], titulo: 'Meta com nome e data',
    texto: '"Guardar dinheiro" é vago. "R$ 1.200 para a moto até julho" é uma meta: dá R$ 150 por mês, e fica fácil saber se está no caminho.' },
  { id: 'gastos-anuais', tema: 'organizar', quando: ['sempre'], titulo: 'Os gastos que vêm uma vez por ano',
    texto: 'IPVA, IPTU, material escolar, presente de Natal. Eles não são surpresa: divida o valor por 12 e guarde um pouco todo mês.' },

  // ---------------------------------------------------------------- gastar menos
  { id: '48h', tema: 'gastar', quando: ['sempre', 'negativo'], titulo: 'Espere 48 horas',
    texto: 'Bateu vontade de comprar algo que não é essencial? Espera dois dias. Se ainda fizer sentido, compra sem culpa. Na maioria das vezes, a vontade passa.' },
  { id: 'pequenos', tema: 'gastar', quando: ['sempre', 'negativo'], titulo: 'Os gastos pequenos somam',
    texto: 'R$ 15 por dia num lanche, num refri, num cafezinho, dá uns R$ 450 por mês. Não precisa cortar tudo; precisa saber quanto é.' },
  { id: 'lista', tema: 'gastar', quando: ['sempre'], titulo: 'Mercado com lista e de barriga cheia',
    texto: 'Lista feita em casa, olhando a despensa, e nada de ir com fome. Compra por impulso no mercado é das mais comuns.' },
  { id: 'preco-kg', tema: 'gastar', quando: ['sempre'], titulo: 'Compare o preço por quilo',
    texto: 'O pacote maior nem sempre sai mais barato. Olhe na etiqueta da prateleira o preço por quilo ou por litro antes de escolher.' },
  { id: 'assinaturas', tema: 'gastar', quando: ['sempre'], titulo: 'Assinaturas esquecidas',
    texto: 'Streaming, aplicativo, clube, plano que ninguém usa. Uma vez por mês, olhe a lista e cancele o que não usou. Dá pra assinar de novo quando quiser.' },
  { id: 'delivery', tema: 'gastar', quando: ['negativo'], titulo: 'Delivery é conveniência cara',
    texto: 'Taxa de entrega, preço maior no aplicativo e o pedido que sempre cresce. Cozinhar em casa a maior parte da semana é uma das economias mais fortes.' },
  { id: 'dia-sem-gasto', tema: 'gastar', quando: ['negativo'], titulo: 'Um dia sem gastar',
    texto: 'Escolha um dia na semana para não gastar nada. Parece pouco, mas ajuda a perceber quanto dos gastos é hábito.' },
  { id: 'a-vista', tema: 'gastar', quando: ['cartao'], titulo: 'Pergunte o preço à vista',
    texto: 'Muita loja dá desconto no Pix ou no dinheiro. Se o "sem juros" no cartão custa o mesmo que à vista, o juro já está embutido no preço.' },

  // ---------------------------------------------------------------- cartão
  { id: 'rotativo', tema: 'cartao', quando: ['cartao', 'divida', 'negativo'], titulo: 'Nunca pague só o mínimo',
    texto: 'Pagar o mínimo joga o resto da fatura no rotativo, um dos juros mais altos que existem. Se não der pra pagar tudo, compare com o parcelamento da fatura, que costuma sair mais barato, e segure o cartão até equilibrar.' },
  { id: 'limite', tema: 'cartao', quando: ['cartao'], titulo: 'Limite não é salário',
    texto: 'O limite é quanto o banco empresta, não quanto você pode gastar. Uma referência usada por muita gente: fatura abaixo de 30% do que entra no mês.' },
  { id: 'parcela-total', tema: 'cartao', quando: ['cartao', 'divida'], titulo: 'Parcela pequena, total grande',
    texto: 'Antes de parcelar, faça a conta inteira: 12 vezes de R$ 89 são R$ 1.068. E lembre que cada parcela come um pedaço dos próximos meses.' },
  { id: 'melhor-dia', tema: 'cartao', quando: ['cartao'], titulo: 'O melhor dia de compra',
    texto: 'Comprando no dia em que a fatura fecha, você só paga na fatura seguinte, até uns 40 dias depois. Ajuda a organizar, mas não faz o dinheiro render mais.' },
  { id: 'um-cartao', tema: 'cartao', quando: ['cartao'], titulo: 'Menos cartões, menos susto',
    texto: 'Cada cartão é uma fatura a mais para acompanhar. Se tem vários, concentre os gastos em um ou dois e deixe os outros guardados.' },

  // ---------------------------------------------------------------- dívidas
  { id: 'listar', tema: 'dividas', quando: ['divida', 'negativo'], titulo: 'Coloque todas no papel',
    texto: 'Anote aqui todas as dívidas, até as da palavra. Ver o total pode assustar, mas é o primeiro passo: não dá pra resolver o que não se vê.' },
  { id: 'qual-primeiro', tema: 'dividas', quando: ['divida'], titulo: 'Qual dívida pagar primeiro',
    texto: 'Dois jeitos que funcionam: começar pela de juros mais altos (economiza mais) ou pela menor (a vitória rápida dá ânimo). O importante é escolher um e manter as outras em dia.' },
  { id: 'negociar', tema: 'dividas', quando: ['divida', 'negativo'], titulo: 'Negociar vale a pena',
    texto: 'Quem empresta prefere receber. Pergunte por desconto à vista ou parcela que caiba no bolso. Mutirões de negociação e os aplicativos dos próprios credores costumam ter descontos grandes.' },
  { id: 'cheque-especial', tema: 'dividas', quando: ['divida', 'negativo'], titulo: 'Cheque especial é para um dia só',
    texto: 'Os juros do cheque especial estão entre os mais altos. Se ficou nele mais que uns dias, troque por um empréstimo mais barato (o consignado costuma ter juros menores) e saia dele.' },
  { id: 'palavra', tema: 'dividas', quando: ['divida'], titulo: 'Dívida na palavra também é dívida',
    texto: 'Com o vizinho, com a loja do bairro: combine valor e data, anote e cumpra. Se não der num mês, avise antes. Em cidade pequena, o nome vale muito.' },
  { id: 'nova-por-velha', tema: 'dividas', quando: ['divida'], titulo: 'Dívida nova só se for mais barata',
    texto: 'Pegar um empréstimo para pagar outra dívida só vale se os juros do novo forem menores. Senão, é trocar seis por meia dúzia, mais caro.' },
  { id: 'extra-divida', tema: 'dividas', quando: ['divida', 'sobra'], titulo: 'Dinheiro extra adianta parcela',
    texto: 'Recebeu um extra, um 13º, uma venda? Usar uma parte para adiantar dívida encurta o caminho, e muita loja dá desconto para quem adianta.' },

  // ---------------------------------------------------------------- reserva
  { id: 'reserva-o-que', tema: 'reserva', quando: ['sem-reserva', 'sempre'], titulo: 'O que é reserva de emergência',
    texto: 'É o dinheiro para o imprevisto: a moto quebrou, um remédio, um mês sem trabalho. A referência é de 3 a 6 meses do custo de vida. Ninguém junta de uma vez: começa com pouco.' },
  { id: 'reserva-onde', tema: 'reserva', quando: ['sem-reserva', 'sobra'], titulo: 'Onde guardar a reserva',
    texto: 'Ela precisa ser segura e dar pra sacar em qualquer dia. Bons lugares: Tesouro Selic ou um CDB com liquidez diária de banco grande. A poupança também serve, mas costuma render menos.' },
  { id: 'reserva-separada', tema: 'reserva', quando: ['sem-reserva'], titulo: 'Reserva longe da conta do dia a dia',
    texto: 'Dinheiro guardado na mesma conta do cartão de débito some sem perceber. Deixe a reserva num lugar separado, que dê um pouquinho de trabalho pra tirar.' },
  { id: 'reserva-nao-investe', tema: 'reserva', quando: ['reserva-ok', 'sobra'], titulo: 'Reserva não é pra arriscar',
    texto: 'O papel da reserva é estar lá quando precisar, não render muito. Ações e cripto podem cair justo no mês do imprevisto.' },

  // ---------------------------------------------------------------- investir
  { id: 'dividas-antes', tema: 'investir', quando: ['divida', 'sobra'], titulo: 'Primeiro as dívidas caras',
    texto: 'Nenhum investimento seguro rende mais que os juros do cartão ou do cheque especial. Quitar dívida cara é o melhor "investimento" que existe.' },
  { id: 'tesouro-selic', tema: 'investir', quando: ['sobra', 'reserva-ok', 'sem-reserva'], titulo: 'Tesouro Selic',
    texto: 'É um título do governo federal que rende perto da taxa Selic. Dá para começar com pouco dinheiro, pelo app do banco ou de uma corretora, e resgatar em qualquer dia útil. Bom para reserva e para começar.' },
  { id: 'cdb-fgc', tema: 'investir', quando: ['sobra', 'reserva-ok'], titulo: 'CDB e a proteção do FGC',
    texto: 'No CDB você empresta para o banco. Se o banco quebrar, o FGC (Fundo Garantidor de Créditos) devolve até R$ 250 mil por CPF em cada instituição. Prefira os que rendem 100% do CDI ou mais.' },
  { id: 'poupanca', tema: 'investir', quando: ['sobra'], titulo: 'E a poupança?',
    texto: 'É simples e não tem imposto de renda, mas na maior parte do tempo rende menos que o Tesouro Selic e que bons CDBs. Não é errado usar; só dá pra fazer o dinheiro render um pouco mais.' },
  { id: 'lci-lca', tema: 'investir', quando: ['reserva-ok'], titulo: 'LCI e LCA',
    texto: 'Parecidas com o CDB e também protegidas pelo FGC, mas sem imposto de renda para pessoa física. Em troca, costumam ter um prazo mínimo antes de poder sacar. Melhor para dinheiro que pode ficar parado.' },
  { id: 'juros-compostos', tema: 'investir', quando: ['sobra', 'reserva-ok'], titulo: 'O tempo trabalha a favor',
    texto: 'Um exemplo: R$ 100 por mês, rendendo 0,8% ao mês, viram cerca de R$ 1.250 em um ano e uns R$ 20 mil em dez anos (antes do imposto). O segredo é a constância, não o valor.' },
  { id: 'golpe', tema: 'investir', quando: ['sempre', 'sobra'], titulo: 'Rendimento alto e garantido é golpe',
    texto: 'Pirâmide, "investimento" em grupo de WhatsApp, robô que dobra o dinheiro. Se promete muito, rápido e sem risco, desconfie. Antes de investir, confira se a empresa é autorizada pela CVM ou pelo Banco Central.' },
  { id: 'taxas', tema: 'investir', quando: ['reserva-ok'], titulo: 'Olhe as taxas',
    texto: 'Taxa de administração, de custódia, de carregamento. Uma taxa de 2% ao ano parece pouco, mas come uma parte grande do rendimento. Para renda fixa simples, prefira opções sem taxa ou com taxa baixa.' },
  { id: 'renda-variavel', tema: 'investir', quando: ['reserva-ok'], titulo: 'Ações e cripto: só depois',
    texto: 'Sobem e descem muito. Só faz sentido com a reserva pronta, as dívidas caras pagas e com dinheiro que pode ficar anos sem mexer.' },
];

if (typeof module !== 'undefined' && module.exports) module.exports = { TEMAS, DICAS };
