const { exec } = require('child_process');
const readline = require('readline');

// Criar interface para leitura de linha
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Cores para console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Lista de planos esperados no sistema
const planosEsperados = [
  {
    id: '0b8a742e-228f-4c76-92e4-32f6cb737de1',
    nome: 'Básico',
    descricao: 'Plano básico com recursos limitados',
    preco: 100, // R$ 1.00 em centavos
    stripeProductId: 'prod_RzVUyy88KVqHA3',
    stripePriceId: 'price_1R5WTjRvXVt1661Q84Z1a8rC',
  },
  {
    id: 'e147dc1f-9a63-46c5-b4cb-3bad639c8162',
    nome: 'Intermediário',
    descricao: 'Plano intermediário com mais recursos',
    preco: 1000, // R$ 10.00 em centavos
    stripeProductId: 'prod_RzVUceVCXu4FAn',
    stripePriceId: 'price_1R5WTjRvXVt1661QZo3y15p1',
  },
  {
    id: '8c8d495a-a9b8-40a6-a0da-57b1977ebc45',
    nome: 'Avançado',
    descricao: 'Plano avançado com recursos estendidos',
    preco: 1990, // R$ 19.90 em centavos
    stripeProductId: 'prod_RzVU0Y8RwIXgZM',
    stripePriceId: 'price_1R5WTjRvXVt1661QLfaiQjDm',
  },
  {
    id: '85e05cbc-de9f-46e9-b563-678e20b5cc5a',
    nome: 'Premium',
    descricao: 'Plano premium com todos os recursos',
    preco: 3990, // R$ 39.90 em centavos
    stripeProductId: 'prod_RzVU2Q5J84N5Hs',
    stripePriceId: 'price_1R5WTjRvXVt1661QujJbJ5zf',
  }
];

// Iniciar programa
console.log(`${colors.cyan}=========================================${colors.reset}`);
console.log(`${colors.cyan}  VERIFICADOR DE PRODUTOS DO STRIPE      ${colors.reset}`);
console.log(`${colors.cyan}=========================================${colors.reset}`);

rl.question(`\n${colors.yellow}Digite a chave secreta do Stripe: ${colors.reset}`, (stripeKey) => {
  if (!stripeKey.trim()) {
    console.log(`${colors.red}Chave do Stripe não fornecida. Encerrando programa.${colors.reset}`);
    rl.close();
    return;
  }

  console.log(`\n${colors.green}Usando chave: ${colors.reset}${stripeKey.substring(0, 7)}***${stripeKey.substring(stripeKey.length - 4)}`);
  
  mostrarMenu(stripeKey);
});

// Mostrar menu principal
function mostrarMenu(stripeKey) {
  console.log(`\n${colors.cyan}=== MENU PRINCIPAL ===${colors.reset}`);
  console.log(`1. Verificar produtos no Stripe`);
  console.log(`2. Recriar produtos no Stripe`);
  console.log(`3. Sair`);
  
  rl.question(`\n${colors.yellow}Escolha uma opção (1-3): ${colors.reset}`, (opcao) => {
    switch (opcao.trim()) {
      case '1':
        verificarProdutos(stripeKey);
        break;
      case '2':
        confirmarRecriacao(stripeKey);
        break;
      case '3':
        console.log(`${colors.green}Encerrando programa. Até logo!${colors.reset}`);
        rl.close();
        break;
      default:
        console.log(`${colors.red}Opção inválida. Tente novamente.${colors.reset}`);
        mostrarMenu(stripeKey);
    }
  });
}

// Verificar produtos
function verificarProdutos(stripeKey) {
  console.log(`\n${colors.cyan}=== VERIFICANDO PRODUTOS NO STRIPE ===${colors.reset}`);
  
  // Verificar cada produto
  let produtosVerificados = 0;
  let produtosEncontrados = 0;
  let produtosNaoEncontrados = 0;
  
  const verificacoes = planosEsperados.map((plano, index) => {
    return new Promise((resolve) => {
      console.log(`\n${colors.blue}Verificando plano ${index + 1}/${planosEsperados.length}: ${plano.nome}${colors.reset}`);
      
      // Verificar produto
      const comandoProduto = `curl -s https://api.stripe.com/v1/products/${plano.stripeProductId} -u "${stripeKey}:"`;
      
      exec(comandoProduto, (error, stdout, stderr) => {
        if (error) {
          console.log(`${colors.red}Erro ao verificar produto: ${error.message}${colors.reset}`);
          produtosNaoEncontrados++;
          resolve({ id: plano.id, existe: false, erro: error.message });
          return;
        }
        
        try {
          const produtoResultado = JSON.parse(stdout);
          
          if (produtoResultado.error) {
            console.log(`${colors.red}Produto não encontrado: ${produtoResultado.error.message}${colors.reset}`);
            produtosNaoEncontrados++;
            resolve({ id: plano.id, existe: false, erro: produtoResultado.error.message });
            return;
          }
          
          // Verificar preço
          const comandoPreco = `curl -s https://api.stripe.com/v1/prices/${plano.stripePriceId} -u "${stripeKey}:"`;
          
          exec(comandoPreco, (errorPreco, stdoutPreco, stderrPreco) => {
            if (errorPreco) {
              console.log(`${colors.red}Erro ao verificar preço: ${errorPreco.message}${colors.reset}`);
              produtosNaoEncontrados++;
              resolve({ id: plano.id, existe: false, erro: errorPreco.message });
              return;
            }
            
            try {
              const precoResultado = JSON.parse(stdoutPreco);
              
              if (precoResultado.error) {
                console.log(`${colors.red}Preço não encontrado: ${precoResultado.error.message}${colors.reset}`);
                produtosNaoEncontrados++;
                resolve({ id: plano.id, existe: false, erro: precoResultado.error.message });
                return;
              }
              
              // Verificar se o preço pertence ao produto
              if (precoResultado.product !== plano.stripeProductId) {
                console.log(`${colors.red}Preço não pertence ao produto!${colors.reset}`);
                produtosNaoEncontrados++;
                resolve({ id: plano.id, existe: false, erro: 'Preço não pertence ao produto' });
                return;
              }
              
              console.log(`${colors.green}Produto e preço encontrados com sucesso!${colors.reset}`);
              produtosEncontrados++;
              resolve({ id: plano.id, existe: true });
              
            } catch (e) {
              console.log(`${colors.red}Erro ao processar resposta do preço: ${e.message}${colors.reset}`);
              produtosNaoEncontrados++;
              resolve({ id: plano.id, existe: false, erro: e.message });
            }
          });
          
        } catch (e) {
          console.log(`${colors.red}Erro ao processar resposta do produto: ${e.message}${colors.reset}`);
          produtosNaoEncontrados++;
          resolve({ id: plano.id, existe: false, erro: e.message });
        }
      });
    });
  });
  
  Promise.all(verificacoes).then((resultados) => {
    console.log(`\n${colors.cyan}=== RESUMO DA VERIFICAÇÃO ===${colors.reset}`);
    console.log(`Total de planos: ${planosEsperados.length}`);
    console.log(`Produtos encontrados: ${produtosEncontrados}`);
    console.log(`Produtos não encontrados: ${produtosNaoEncontrados}`);
    
    if (produtosNaoEncontrados > 0) {
      console.log(`\n${colors.yellow}Alguns produtos não foram encontrados. Você pode recriá-los usando a opção 2 do menu.${colors.reset}`);
    } else {
      console.log(`\n${colors.green}Todos os produtos foram encontrados com sucesso!${colors.reset}`);
    }
    
    mostrarMenu(stripeKey);
  });
}

// Confirmar recriação
function confirmarRecriacao(stripeKey) {
  console.log(`\n${colors.red}ATENÇÃO: Esta ação irá criar NOVOS produtos no Stripe com NOVOS IDs.${colors.reset}`);
  console.log(`${colors.red}Você precisará atualizar esses IDs no banco de dados depois.${colors.reset}`);
  
  rl.question(`\n${colors.yellow}Deseja continuar? (S/N): ${colors.reset}`, (resposta) => {
    if (resposta.trim().toLowerCase() === 's') {
      recriarProdutos(stripeKey);
    } else {
      console.log(`${colors.green}Operação cancelada.${colors.reset}`);
      mostrarMenu(stripeKey);
    }
  });
}

// Recriar produtos
function recriarProdutos(stripeKey) {
  console.log(`\n${colors.cyan}=== RECRIANDO PRODUTOS NO STRIPE ===${colors.reset}`);
  
  const produtosNovos = [];
  let produtosCriados = 0;
  let produtosComErro = 0;
  
  const criacoes = planosEsperados.map((plano, index) => {
    return new Promise((resolve) => {
      console.log(`\n${colors.blue}Criando plano ${index + 1}/${planosEsperados.length}: ${plano.nome}${colors.reset}`);
      
      // Criar produto
      const comandoProduto = `curl -s https://api.stripe.com/v1/products -u "${stripeKey}:" \\
        -d "name=${plano.nome}" \\
        -d "description=${plano.descricao}" \\
        -d "metadata[plano_id]=${plano.id}"`;
      
      exec(comandoProduto, (error, stdout, stderr) => {
        if (error) {
          console.log(`${colors.red}Erro ao criar produto: ${error.message}${colors.reset}`);
          produtosComErro++;
          resolve({ id: plano.id, sucesso: false, erro: error.message });
          return;
        }
        
        try {
          const produtoResultado = JSON.parse(stdout);
          
          if (produtoResultado.error) {
            console.log(`${colors.red}Erro ao criar produto: ${produtoResultado.error.message}${colors.reset}`);
            produtosComErro++;
            resolve({ id: plano.id, sucesso: false, erro: produtoResultado.error.message });
            return;
          }
          
          console.log(`${colors.green}Produto criado: ${produtoResultado.id}${colors.reset}`);
          
          // Criar preço
          const comandoPreco = `curl -s https://api.stripe.com/v1/prices -u "${stripeKey}:" \\
            -d "product=${produtoResultado.id}" \\
            -d "unit_amount=${plano.preco}" \\
            -d "currency=brl" \\
            -d "recurring[interval]=month" \\
            -d "metadata[plano_id]=${plano.id}"`;
          
          exec(comandoPreco, (errorPreco, stdoutPreco, stderrPreco) => {
            if (errorPreco) {
              console.log(`${colors.red}Erro ao criar preço: ${errorPreco.message}${colors.reset}`);
              produtosComErro++;
              resolve({ id: plano.id, sucesso: false, erro: errorPreco.message });
              return;
            }
            
            try {
              const precoResultado = JSON.parse(stdoutPreco);
              
              if (precoResultado.error) {
                console.log(`${colors.red}Erro ao criar preço: ${precoResultado.error.message}${colors.reset}`);
                produtosComErro++;
                resolve({ id: plano.id, sucesso: false, erro: precoResultado.error.message });
                return;
              }
              
              console.log(`${colors.green}Preço criado: ${precoResultado.id}${colors.reset}`);
              
              // Adicionar à lista de produtos novos
              produtosNovos.push({
                planoId: plano.id,
                nome: plano.nome,
                produtoId: produtoResultado.id,
                precoId: precoResultado.id
              });
              
              produtosCriados++;
              resolve({ id: plano.id, sucesso: true, produtoId: produtoResultado.id, precoId: precoResultado.id });
              
            } catch (e) {
              console.log(`${colors.red}Erro ao processar resposta do preço: ${e.message}${colors.reset}`);
              produtosComErro++;
              resolve({ id: plano.id, sucesso: false, erro: e.message });
            }
          });
          
        } catch (e) {
          console.log(`${colors.red}Erro ao processar resposta do produto: ${e.message}${colors.reset}`);
          produtosComErro++;
          resolve({ id: plano.id, sucesso: false, erro: e.message });
        }
      });
    });
  });
  
  Promise.all(criacoes).then((resultados) => {
    console.log(`\n${colors.cyan}=== RESUMO DA CRIAÇÃO ===${colors.reset}`);
    console.log(`Total de planos: ${planosEsperados.length}`);
    console.log(`Produtos criados: ${produtosCriados}`);
    console.log(`Produtos com erro: ${produtosComErro}`);
    
    if (produtosCriados > 0) {
      console.log(`\n${colors.cyan}=== SQL PARA ATUALIZAÇÃO ===${colors.reset}`);
      
      const sql = produtosNovos.map(produto => 
        `UPDATE planos SET stripe_product_id = '${produto.produtoId}', stripe_price_id = '${produto.precoId}' WHERE id = '${produto.planoId}';`
      ).join('\n');
      
      console.log(`\n${sql}\n`);
      
      console.log(`${colors.yellow}Copie e execute o SQL acima no seu banco de dados para atualizar os IDs.${colors.reset}`);
    }
    
    mostrarMenu(stripeKey);
  });
}

// Tratamento para encerrar o programa
process.on('SIGINT', () => {
  console.log(`\n${colors.green}Programa encerrado pelo usuário.${colors.reset}`);
  rl.close();
  process.exit(0);
}); 