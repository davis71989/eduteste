// Configurações de CORS para as funções Edge do Supabase
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-client-info',
  'Access-Control-Max-Age': '86400',
}

// Função para lidar com requisições preflight CORS OPTIONS
export function handleCorsOptions(req: Request) {
  console.log('Verificando requisição OPTIONS para CORS preflight');
  
  // Se o método da requisição for OPTIONS
  if (req.method === 'OPTIONS') {
    console.log('Enviando resposta para preflight CORS');
    return new Response(null, {
      status: 204, // No content
      headers: corsHeaders,
    });
  }
  
  return null; // Continuar com o processamento normal se não for OPTIONS
}

// Função para incluir os headers CORS em uma resposta existente
export function addCorsHeaders(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
} 