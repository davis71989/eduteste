import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import { createInterface } from 'readline';
import { writeFileSync } from 'fs';

const exec = promisify(execCallback);

// Criar interface para leitura de linha
const rl = createInterface({
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

// Chave do Stripe para teste
const STRIPE_SECRET_KEY = 'sk_test_51R5UXrRrfuwybnpzwZdxo87wjmClLUJykcAKMftgtqpx5EeOJqDHsLr4K8AQvbxbuUq4M7rHOM512rQ4AcLufogK00XbhTYgox';

// Cabeçalho
console.log(`${colors.cyan}=========================================${colors.reset}`);
console.log(`${colors.cyan}  CORREÇÃO DE PRODUTOS DO STRIPE        ${colors.reset}`);
console.log(`${colors.cyan}=========================================${colors.reset}`);

// Função principal
async function main() {
  console.log(`\n${colors.blue}Verificando a conexão com o Stripe...${colors.reset}`);
  
  try {
    // Testar a conexão com o Stripe
    const { stdout: testResult } = await exec(`curl -s -X GET https://api.stripe.com/v1/balance -H "Authorization: Bearer ${STRIPE_SECRET_KEY}"`);
    
    try {
      JSON.parse(testResult);
      console.log(`${colors.green}✓ Conexão com o Stripe funcionando corretamente${colors.reset}`);
    } catch (e) {
      console.log(`${colors.red}✗ Erro ao verificar a conexão: Resposta não é um JSON válido${colors.reset}`);
      console.log(testResult);
      process.exit(1);
    }
  } catch (error) {
    console.log(`${colors.red}✗ Erro ao conectar com o Stripe: ${error.message}${colors.reset}`);
    process.exit(1);
  }
  
  const opcoes = [
    'Verificar produtos no Stripe',
    'Criar produtos no Stripe',
    'Sair'
  ];
  
  const escolherOpcao = () => {
    console.log(`\n${colors.cyan}=== MENU DE OPÇÕES ===${colors.reset}`);
    opcoes.forEach((opcao, index) => {
      console.log(`${index + 1}. ${opcao}`);
    });
    
    rl.question(`\n${colors.yellow}Escolha uma opção (1-${opcoes.length}): ${colors.reset}`, (resposta) => {
      const opcao = parseInt(resposta.trim());
      
      if (opcao >= 1 && opcao <= opcoes.length) {
        switch (opcao) {
          case 1:
            verificarProdutos();
            break;
          case 2:
            confirmarCriacaoProdutos();
            break;
          case 3:
            console.log(`${colors.green}Encerrando programa. Até logo!${colors.reset}`);
            rl.close();
            break;
        }
      } else {
        console.log(`${colors.red}Opção inválida. Tente novamente.${colors.reset}`);
        escolherOpcao();
      }
    });
  };
  
  const verificarProdutos = async () => {
    console.log(`\n${colors.cyan}=== VERIFICANDO PRODUTOS NO STRIPE ===${colors.reset}`);
    
    // Obter lista de produtos existentes
    try {
      const { stdout: produtos } = await exec(`curl -s -X GET https://api.stripe.com/v1/products?limit=100 -H "Authorization: Bearer ${STRIPE_SECRET_KEY}"`);
      const produtosObj = JSON.parse(produtos);
      
      if (produtosObj.data && produtosObj.data.length > 0) {
        console.log(`${colors.green}${produtosObj.data.length} produtos encontrados na conta Stripe${colors.reset}`);
        
        // Verificar cada produto esperado
        for (const plano of planosEsperados) {
          console.log(`\n${colors.blue}Verificando plano: ${plano.nome} (${plano.id})${colors.reset}`);
          
          // Verificar se o produto existe pelo ID
          const produtoExistente = produtosObj.data.find(p => p.id === plano.stripeProductId);
          
          if (produtoExistente) {
            console.log(`${colors.green}✓ Produto encontrado: ${produtoExistente.id} (${produtoExistente.name})${colors.reset}`);
            
            // Verificar o preço
            try {
              const { stdout: precoResult } = await exec(`curl -s -X GET https://api.stripe.com/v1/prices/${plano.stripePriceId} -H "Authorization: Bearer ${STRIPE_SECRET_KEY}"`);
              const precoObj = JSON.parse(precoResult);
              
              if (precoObj.error) {
                console.log(`${colors.red}✗ Preço não encontrado: ${precoObj.error.message}${colors.reset}`);
              } else {
                console.log(`${colors.green}✓ Preço encontrado: ${precoObj.id} (${precoObj.unit_amount} ${precoObj.currency})${colors.reset}`);
                
                // Verificar se o preço pertence ao produto
                if (precoObj.product === plano.stripeProductId) {
                  console.log(`${colors.green}✓ Preço pertence ao produto correto${colors.reset}`);
                } else {
                  console.log(`${colors.red}✗ Preço não pertence ao produto! (${precoObj.product} ≠ ${plano.stripeProductId})${colors.reset}`);
                }
              }
            } catch (error) {
              console.log(`${colors.red}✗ Erro ao verificar preço: ${error.message}${colors.reset}`);
            }
          } else {
            console.log(`${colors.red}✗ Produto não encontrado: ${plano.stripeProductId}${colors.reset}`);
          }
        }
      } else {
        console.log(`${colors.yellow}Nenhum produto encontrado na conta Stripe${colors.reset}`);
      }
    } catch (error) {
      console.log(`${colors.red}Erro ao obter produtos: ${error.message}${colors.reset}`);
    }
    
    escolherOpcao();
  };
  
  const confirmarCriacaoProdutos = () => {
    console.log(`\n${colors.red}ATENÇÃO: Esta operação criará NOVOS produtos no Stripe.${colors.reset}`);
    console.log(`${colors.red}Você precisará atualizar o banco de dados com os novos IDs.${colors.reset}`);
    
    rl.question(`\n${colors.yellow}Deseja continuar? (S/N): ${colors.reset}`, (resposta) => {
      if (resposta.trim().toLowerCase() === 's') {
        criarProdutos();
      } else {
        console.log(`${colors.green}Operação cancelada.${colors.reset}`);
        escolherOpcao();
      }
    });
  };
  
  const criarProdutos = async () => {
    console.log(`\n${colors.cyan}=== CRIANDO PRODUTOS NO STRIPE ===${colors.reset}`);
    
    const produtosCriados = [];
    
    for (const plano of planosEsperados) {
      console.log(`\n${colors.blue}Criando plano: ${plano.nome}${colors.reset}`);
      
      try {
        // Criar produto
        const createProductCmd = `curl -s -X POST https://api.stripe.com/v1/products -H "Authorization: Bearer ${STRIPE_SECRET_KEY}" -d name="${plano.nome}" -d description="${plano.descricao}" -d "metadata[plano_id]=${plano.id}"`;
        
        const { stdout: produtoResult } = await exec(createProductCmd);
        const produtoObj = JSON.parse(produtoResult);
        
        if (produtoObj.error) {
          console.log(`${colors.red}✗ Erro ao criar produto: ${produtoObj.error.message}${colors.reset}`);
          continue;
        }
        
        console.log(`${colors.green}✓ Produto criado: ${produtoObj.id} (${produtoObj.name})${colors.reset}`);
        
        // Criar preço
        const createPriceCmd = `curl -s -X POST https://api.stripe.com/v1/prices -H "Authorization: Bearer ${STRIPE_SECRET_KEY}" -d "product=${produtoObj.id}" -d "unit_amount=${plano.preco}" -d "currency=brl" -d "recurring[interval]=month" -d "metadata[plano_id]=${plano.id}"`;
        
        const { stdout: precoResult } = await exec(createPriceCmd);
        const precoObj = JSON.parse(precoResult);
        
        if (precoObj.error) {
          console.log(`${colors.red}✗ Erro ao criar preço: ${precoObj.error.message}${colors.reset}`);
          continue;
        }
        
        console.log(`${colors.green}✓ Preço criado: ${precoObj.id} (${precoObj.unit_amount} ${precoObj.currency})${colors.reset}`);
        
        // Adicionar ao array de produtos criados
        produtosCriados.push({
          planoId: plano.id,
          nome: plano.nome,
          produtoId: produtoObj.id,
          precoId: precoObj.id
        });
      } catch (error) {
        console.log(`${colors.red}✗ Erro: ${error.message}${colors.reset}`);
      }
    }
    
    if (produtosCriados.length > 0) {
      console.log(`\n${colors.green}=== RESUMO: ${produtosCriados.length} PRODUTOS CRIADOS ===${colors.reset}`);
      
      // Gerar SQL para atualização
      const sql = produtosCriados.map(item => 
        `UPDATE planos SET stripe_product_id = '${item.produtoId}', stripe_price_id = '${item.precoId}' WHERE id = '${item.planoId}';`
      ).join('\n');
      
      console.log(`\n${colors.cyan}=== SQL PARA ATUALIZAÇÃO ===${colors.reset}`);
      console.log(sql);
      
      // Salvar SQL em arquivo
      const filename = `stripe_update_${Date.now()}.sql`;
      try {
        writeFileSync(filename, sql);
        console.log(`\n${colors.green}SQL salvo no arquivo: ${filename}${colors.reset}`);
      } catch (error) {
        console.log(`${colors.red}Erro ao salvar arquivo SQL: ${error.message}${colors.reset}`);
      }
      
      // Criar objeto de mapeamento dos IDs para atualização do código
      const novosIds = produtosCriados.map(item => ({
        id: item.planoId,
        nome: item.nome,
        stripeProductId: item.produtoId,
        stripePriceId: item.precoId
      }));
      
      console.log(`\n${colors.cyan}=== DADOS PARA ATUALIZAÇÃO DO CÓDIGO ===${colors.reset}`);
      console.log(JSON.stringify(novosIds, null, 2));
    } else {
      console.log(`\n${colors.red}Nenhum produto foi criado.${colors.reset}`);
    }
    
    escolherOpcao();
  };
  
  // Iniciar o programa
  escolherOpcao();
}

// Tratamento para encerrar o programa
process.on('SIGINT', () => {
  console.log(`\n${colors.green}Programa encerrado pelo usuário.${colors.reset}`);
  rl.close();
  process.exit(0);
});

// Executar o programa principal
main(); 