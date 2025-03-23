import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import { createInterface } from 'readline';
import { request } from 'https';

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

// Chaves do Stripe armazenadas no código (remover em produção)
const STRIPE_PUBLIC_KEY = 'pk_test_51R5UXrRrfuwybnpzSYI5Cf28pJvZMNczdfvcL0cNIDE6GTQZpaebMUpv7qPlU2FJoAu0uklAIK8Oi4SMXpItAZOL00WefiyyBt';
const STRIPE_SECRET_KEY = 'sk_test_51R5UXrRrfuwybnpzwZdxo87wjmClLUJykcAKMftgtqpx5EeOJqDHsLr4K8AQvbxbuUq4M7rHOM512rQ4AcLufogK00XbhTYgox';

// Cabeçalho
console.log(`${colors.cyan}=========================================${colors.reset}`);
console.log(`${colors.cyan}  DIAGNÓSTICO DE CONEXÃO COM STRIPE     ${colors.reset}`);
console.log(`${colors.cyan}=========================================${colors.reset}`);

// Menu principal
function mostrarMenu() {
  console.log(`\n${colors.cyan}=== MENU DE DIAGNÓSTICO ===${colors.reset}`);
  console.log(`1. Verificar conexão com API do Stripe`);
  console.log(`2. Verificar validade das chaves API`);
  console.log(`3. Testar criação de produto (diagnóstico)`);
  console.log(`4. Verificar produtos existentes`);
  console.log(`5. Verificar DNS e conectividade`);
  console.log(`6. Sair`);
  
  rl.question(`\n${colors.yellow}Escolha uma opção (1-6): ${colors.reset}`, (opcao) => {
    switch (opcao.trim()) {
      case '1':
        verificarConexaoStripe();
        break;
      case '2':
        verificarChavesAPI();
        break;
      case '3':
        testarCriacaoProduto();
        break;
      case '4':
        listarProdutos();
        break;
      case '5':
        verificarConectividade();
        break;
      case '6':
        console.log(`${colors.green}Encerrando programa. Até logo!${colors.reset}`);
        rl.close();
        break;
      default:
        console.log(`${colors.red}Opção inválida. Tente novamente.${colors.reset}`);
        mostrarMenu();
    }
  });
}

// Verificar se conseguimos conectar no Stripe
async function verificarConexaoStripe() {
  console.log(`\n${colors.cyan}=== VERIFICANDO CONEXÃO COM API DO STRIPE ===${colors.reset}`);
  
  // Testando com o comando curl
  const comando = `curl -s -I https://api.stripe.com/v1/`;
  
  console.log(`${colors.blue}Executando teste de conexão...${colors.reset}`);
  
  try {
    const { stdout, stderr } = await exec(comando);
    
    if (stdout.includes('HTTP/2 200') || stdout.includes('HTTP/1.1 200')) {
      console.log(`${colors.green}Conexão com API do Stripe estabelecida com sucesso!${colors.reset}`);
    } else {
      console.log(`${colors.red}Falha na conexão com a API do Stripe. Resposta:${colors.reset}`);
      console.log(stdout);
    }
  } catch (error) {
    console.log(`${colors.red}Erro ao conectar com o Stripe: ${error.message}${colors.reset}`);
    console.log(`\n${colors.yellow}Recomendações:${colors.reset}`);
    console.log(`1. Verifique sua conexão com a internet`);
    console.log(`2. Verifique se há algum firewall ou proxy bloqueando conexões`);
    console.log(`3. Verifique se a URL do Stripe está acessível`);
  }
  
  mostrarMenu();
}

// Verificar validade das chaves API
async function verificarChavesAPI() {
  console.log(`\n${colors.cyan}=== VERIFICANDO VALIDADE DAS CHAVES API ===${colors.reset}`);
  
  // Verificar chave pública
  console.log(`${colors.blue}Verificando chave pública...${colors.reset}`);
  const comandoPublica = `curl -s "https://api.stripe.com/v1/customers" -H "Authorization: Bearer ${STRIPE_PUBLIC_KEY}"`;
  
  try {
    const { stdout: stdoutPublica } = await exec(comandoPublica);
    
    try {
      const resultadoPublica = JSON.parse(stdoutPublica);
      
      if (resultadoPublica.error) {
        if (resultadoPublica.error.type === 'invalid_request_error' && 
            resultadoPublica.error.message.includes('API key')) {
          console.log(`${colors.green}Chave pública reconhecida pelo Stripe (validação correta de erro de tipo de chave)${colors.reset}`);
        } else {
          console.log(`${colors.red}Problema com a chave pública: ${resultadoPublica.error.message}${colors.reset}`);
        }
      } else {
        console.log(`${colors.yellow}Resposta inesperada para a chave pública${colors.reset}`);
      }
    } catch (e) {
      console.log(`${colors.red}Erro ao processar resposta da chave pública: ${e.message}${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}Erro ao executar verificação da chave pública: ${error.message}${colors.reset}`);
  }
  
  // Verificar chave privada
  console.log(`\n${colors.blue}Verificando chave secreta...${colors.reset}`);
  const comandoSecreta = `curl -s "https://api.stripe.com/v1/balance" -H "Authorization: Bearer ${STRIPE_SECRET_KEY}"`;
  
  try {
    const { stdout: stdoutSecreta } = await exec(comandoSecreta);
    
    try {
      const resultadoSecreta = JSON.parse(stdoutSecreta);
      
      if (resultadoSecreta.error) {
        console.log(`${colors.red}Problema com a chave secreta: ${resultadoSecreta.error.message}${colors.reset}`);
        
        if (resultadoSecreta.error.type === 'invalid_request_error' && 
            resultadoSecreta.error.message.includes('API key')) {
          console.log(`${colors.yellow}A chave secreta parece ser inválida ou expirada${colors.reset}`);
        } else if (resultadoSecreta.error.type === 'authentication_error') {
          console.log(`${colors.yellow}Erro de autenticação. A chave pode estar incorreta ou sem permissões suficientes${colors.reset}`);
        }
      } else {
        console.log(`${colors.green}Chave secreta é válida!${colors.reset}`);
      }
    } catch (e) {
      console.log(`${colors.red}Erro ao processar resposta da chave secreta: ${e.message}${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}Erro ao executar verificação da chave secreta: ${error.message}${colors.reset}`);
  }
  
  // Adicionando informações sobre o formato das chaves
  console.log(`\n${colors.blue}Análise do formato das chaves:${colors.reset}`);
  
  if (STRIPE_PUBLIC_KEY.startsWith('pk_')) {
    console.log(`${colors.green}Formato da chave pública parece correto (começa com 'pk_')${colors.reset}`);
  } else {
    console.log(`${colors.red}Formato da chave pública parece incorreto (deve começar com 'pk_')${colors.reset}`);
  }
  
  if (STRIPE_SECRET_KEY.startsWith('sk_')) {
    console.log(`${colors.green}Formato da chave secreta parece correto (começa com 'sk_')${colors.reset}`);
  } else {
    console.log(`${colors.red}Formato da chave secreta parece incorreto (deve começar com 'sk_')${colors.reset}`);
  }
  
  mostrarMenu();
}

// Testar criação de produto simples
async function testarCriacaoProduto() {
  console.log(`\n${colors.cyan}=== TESTANDO CRIAÇÃO DE PRODUTO DIAGNÓSTICO ===${colors.reset}`);
  
  // Nome aleatório para evitar conflitos
  const produtoNome = `Produto Teste ${new Date().toISOString()}`;
  const comando = `curl -s https://api.stripe.com/v1/products -u "${STRIPE_SECRET_KEY}:" \\
    -d "name=${produtoNome}" \\
    -d "description=Produto de diagnóstico" \\
    -d "metadata[tipo]=diagnostico"`;
  
  console.log(`${colors.blue}Tentando criar produto de teste...${colors.reset}`);
  
  try {
    const { stdout } = await exec(comando);
    
    try {
      const resultado = JSON.parse(stdout);
      
      if (resultado.error) {
        console.log(`${colors.red}Erro retornado pelo Stripe: ${resultado.error.message}${colors.reset}`);
        console.log(`${colors.yellow}Tipo de erro: ${resultado.error.type}${colors.reset}`);
        
        // Análise de erros específicos
        if (resultado.error.type === 'authentication_error') {
          console.log(`${colors.yellow}Problema de autenticação. Verifique se a chave secreta está correta e tem permissões para criar produtos.${colors.reset}`);
        } else if (resultado.error.type === 'invalid_request_error') {
          console.log(`${colors.yellow}Problema no formato da requisição. Verifique os parâmetros enviados.${colors.reset}`);
        } else if (resultado.error.type === 'api_error') {
          console.log(`${colors.yellow}Erro interno do Stripe. Isso é raro e pode indicar problemas temporários com a API.${colors.reset}`);
        }
      } else {
        console.log(`${colors.green}Produto criado com sucesso!${colors.reset}`);
        console.log(`${colors.green}ID do produto: ${resultado.id}${colors.reset}`);
        console.log(`${colors.green}Nome: ${resultado.name}${colors.reset}`);
        console.log(`${colors.green}Criado em: ${new Date(resultado.created * 1000).toLocaleString()}${colors.reset}`);
      }
    } catch (e) {
      console.log(`${colors.red}Erro ao processar resposta: ${e.message}${colors.reset}`);
      console.log(`${colors.blue}Resposta bruta:${colors.reset}`);
      console.log(stdout);
    }
  } catch (error) {
    console.log(`${colors.red}Erro ao executar comando: ${error.message}${colors.reset}`);
  }
  
  mostrarMenu();
}

// Listar produtos existentes
async function listarProdutos() {
  console.log(`\n${colors.cyan}=== LISTANDO PRODUTOS EXISTENTES ===${colors.reset}`);
  
  const comando = `curl -s https://api.stripe.com/v1/products?limit=10 -u "${STRIPE_SECRET_KEY}:"`;
  
  console.log(`${colors.blue}Obtendo lista de produtos...${colors.reset}`);
  
  try {
    const { stdout } = await exec(comando);
    
    try {
      const resultado = JSON.parse(stdout);
      
      if (resultado.error) {
        console.log(`${colors.red}Erro retornado pelo Stripe: ${resultado.error.message}${colors.reset}`);
      } else {
        if (resultado.data && resultado.data.length > 0) {
          console.log(`${colors.green}${resultado.data.length} produtos encontrados:${colors.reset}`);
          
          resultado.data.forEach((produto, index) => {
            console.log(`\n${colors.blue}Produto ${index+1}:${colors.reset}`);
            console.log(`${colors.green}ID: ${produto.id}${colors.reset}`);
            console.log(`${colors.green}Nome: ${produto.name}${colors.reset}`);
            console.log(`${colors.green}Ativo: ${produto.active ? 'Sim' : 'Não'}${colors.reset}`);
            console.log(`${colors.green}Criado em: ${new Date(produto.created * 1000).toLocaleString()}${colors.reset}`);
          });
        } else {
          console.log(`${colors.yellow}Nenhum produto encontrado na conta.${colors.reset}`);
        }
      }
    } catch (e) {
      console.log(`${colors.red}Erro ao processar resposta: ${e.message}${colors.reset}`);
      console.log(`${colors.blue}Resposta bruta:${colors.reset}`);
      console.log(stdout);
    }
  } catch (error) {
    console.log(`${colors.red}Erro ao executar comando: ${error.message}${colors.reset}`);
  }
  
  mostrarMenu();
}

// Verificar DNS e conectividade
async function verificarConectividade() {
  console.log(`\n${colors.cyan}=== VERIFICANDO DNS E CONECTIVIDADE ===${colors.reset}`);
  
  console.log(`${colors.blue}Testando DNS para api.stripe.com...${colors.reset}`);
  
  try {
    const { stdout } = await exec('nslookup api.stripe.com');
    console.log(`${colors.green}Resolução DNS bem-sucedida:${colors.reset}`);
    console.log(stdout);
  } catch (error) {
    console.log(`${colors.red}Erro ao resolver DNS: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}Isso pode indicar problemas de DNS no seu sistema.${colors.reset}`);
  }
  
  console.log(`\n${colors.blue}Testando conectividade HTTPS com o Stripe...${colors.reset}`);
  
  try {
    // Testar conexão HTTPS usando promisify
    const testarHTTPS = () => {
      return new Promise((resolve, reject) => {
        const req = request({
          hostname: 'api.stripe.com',
          port: 443,
          path: '/v1/',
          method: 'GET',
          timeout: 5000
        }, (res) => {
          resolve({ statusCode: res.statusCode });
        });
        
        req.on('error', (e) => {
          reject(e);
        });
        
        req.on('timeout', () => {
          reject(new Error('Timeout'));
          req.destroy();
        });
        
        req.end();
      });
    };
    
    const resultado = await testarHTTPS();
    console.log(`${colors.green}Conexão HTTPS estabelecida com sucesso!${colors.reset}`);
    console.log(`${colors.green}Código de status: ${resultado.statusCode}${colors.reset}`);
  } catch (e) {
    console.log(`${colors.red}Erro na conexão HTTPS: ${e.message}${colors.reset}`);
    console.log(`${colors.yellow}Isso pode indicar problemas de rede ou firewall.${colors.reset}`);
  }
  
  mostrarMenu();
}

// Iniciar menu principal
mostrarMenu();

// Tratamento para encerrar o programa
process.on('SIGINT', () => {
  console.log(`\n${colors.green}Programa encerrado pelo usuário.${colors.reset}`);
  rl.close();
  process.exit(0);
}); 