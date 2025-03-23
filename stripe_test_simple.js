import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import { createInterface } from 'readline';

const exec = promisify(execCallback);

// Cores para console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

// Chave do Stripe para teste
const STRIPE_SECRET_KEY = 'sk_test_51R5UXrRrfuwybnpzwZdxo87wjmClLUJykcAKMftgtqpx5EeOJqDHsLr4K8AQvbxbuUq4M7rHOM512rQ4AcLufogK00XbhTYgox';

// Função principal
async function main() {
  try {
    console.log(`${colors.blue}Iniciando teste simplificado de conexão com Stripe${colors.reset}`);
    
    // Teste 1: Verificar conexão básica
    console.log(`\n${colors.blue}TESTE 1: Verificando conexão básica com o Stripe${colors.reset}`);
    try {
      const { stdout: result1 } = await exec(`curl -s -X GET https://api.stripe.com/v1/balance -H "Authorization: Bearer ${STRIPE_SECRET_KEY}"`);
      console.log(`${colors.green}Resposta:${colors.reset}\n${result1}`);
    } catch (error) {
      console.log(`${colors.red}Erro no teste 1:${colors.reset} ${error.message}`);
      if (error.stderr) console.log(`${colors.red}Erro detalhado:${colors.reset}\n${error.stderr}`);
    }
    
    // Teste 2: Tentar criar um produto (formato Windows-friendly)
    console.log(`\n${colors.blue}TESTE 2: Tentando criar um produto (comando compatível com Windows)${colors.reset}`);
    const productName = `Test Product ${Date.now()}`;
    
    // Usando sintaxe que funciona no Windows (sem barras invertidas)
    const createProductCmd = `curl -s -X POST https://api.stripe.com/v1/products -H "Authorization: Bearer ${STRIPE_SECRET_KEY}" -d name="${productName}" -d description="Test product" -d "metadata[source]=test"`;
    
    try {
      const { stdout: result2 } = await exec(createProductCmd);
      console.log(`${colors.green}Resposta:${colors.reset}\n${result2}`);
    } catch (error) {
      console.log(`${colors.red}Erro no teste 2:${colors.reset} ${error.message}`);
      if (error.stderr) console.log(`${colors.red}Erro detalhado:${colors.reset}\n${error.stderr}`);
      console.log(`${colors.yellow}Comando tentado:${colors.reset}\n${createProductCmd}`);
    }
    
    // Teste 3: Verificar produtos existentes
    console.log(`\n${colors.blue}TESTE 3: Verificando produtos existentes${colors.reset}`);
    try {
      const { stdout: result3 } = await exec(`curl -s -X GET https://api.stripe.com/v1/products?limit=5 -H "Authorization: Bearer ${STRIPE_SECRET_KEY}"`);
      console.log(`${colors.green}Resposta:${colors.reset}\n${result3}`);
    } catch (error) {
      console.log(`${colors.red}Erro no teste 3:${colors.reset} ${error.message}`);
      if (error.stderr) console.log(`${colors.red}Erro detalhado:${colors.reset}\n${error.stderr}`);
    }
    
    console.log(`\n${colors.blue}Teste concluído. Verifique os resultados acima.${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}Erro geral:${colors.reset} ${error.message}`);
  }
}

// Executar o programa
main(); 