/**
 * Formata as respostas da IA para um estilo amigável e estruturado
 */

interface ExerciseData {
  numero: number;
  enunciado: string;
  resposta: string;
  explicacao: string;
  aplicacaoCotidiano: string;
}

interface AiResponseData {
  introducao: string;
  exercicios: ExerciseData[];
}

/**
 * Formata o texto da resposta da IA para torná-lo mais amigável
 * @param text Texto original retornado pela IA
 * @returns Texto formatado em HTML estruturado
 */
export function formatAiResponse(text: string): string {
  // Se a resposta estiver vazia ou for muito curta, retornar como está
  if (!text || text.trim().length < 50) {
    return text;
  }
  
  // Verificar se a resposta já está em HTML
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(text);
  if (hasHtmlTags) {
    // Se já tiver HTML, aplicar melhorias de formatação
    return melhorarFormatacaoHTML(text);
  }
  
  // Tentar extrair JSON da resposta
  let jsonData: AiResponseData | null = null;
  
  try {
    // Buscar conteúdo dentro de blocos de código markdown
    const jsonMatch = text.match(/```(?:json)?\s*({[\s\S]*?})\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonData = JSON.parse(jsonMatch[1]);
    } else {
      // Tentar extrair diretamente, caso não esteja em bloco de código
      jsonData = JSON.parse(text);
    }
  } catch (e) {
    console.error("Erro ao processar JSON da resposta:", e);
    // Se falhar em processar como JSON, tentar usar o formatador antigo
    return melhorarFormatacaoHTML(formatarRespostaTradicional(text));
  }

  // Se não conseguiu obter dados JSON válidos, usar formatação tradicional
  if (!jsonData || !jsonData.exercicios || !Array.isArray(jsonData.exercicios)) {
    return melhorarFormatacaoHTML(formatarRespostaTradicional(text));
  }
  
  // Construir HTML estruturado com base no JSON
  let formattedHtml = '';
  
  // Adicionar introdução
  if (jsonData.introducao) {
    // Substituir mensagens direcionadas às crianças por mensagens para os pais
    let introducao = jsonData.introducao;
    introducao = introducao.replace(
      /^Olá,\s+([^!]+)!\s+Vamos\s+juntos\s+aprender[^.]*/i,
      'Aqui está a resolução da tarefa para você orientar seu filho de forma clara e didática'
    );
    formattedHtml += `<div class="my-4">${introducao}</div>`;
  } else {
    // Adicionar uma introdução padrão direcionada aos pais
    formattedHtml += `<div class="my-4">Aqui está a resolução da tarefa para você orientar seu filho de forma clara e didática.</div>`;
  }
  
  // Processar cada exercício
  jsonData.exercicios.forEach(exercicio => {
    // Título/Enunciado do exercício
    formattedHtml += `<h3 class="text-xl font-semibold text-gray-800 mt-6 mb-4 pb-2 border-b border-gray-200">${exercicio.numero}. ${exercicio.enunciado}</h3>`;
    
    // Área de conteúdo do exercício com indentação
    formattedHtml += `<div class="space-y-4">`;
    
    // Resposta
    formattedHtml += `<h4 class="text-lg font-semibold text-blue-700 mb-2">Resposta:</h4>`;
    formattedHtml += `<div class="pl-4">${exercicio.resposta}</div>`;
    
    // Explicação
    formattedHtml += `<h4 class="text-lg font-semibold text-blue-700 mb-2 mt-4">Como explicar para a criança:</h4>`;
    formattedHtml += `<div class="pl-4">${exercicio.explicacao}</div>`;
    
    // Exemplo do cotidiano (se aplicável)
    if (exercicio.aplicacaoCotidiano && exercicio.aplicacaoCotidiano !== "Não se aplica") {
      formattedHtml += `<div class="exemplo-cotidiano">`;
      formattedHtml += `<h4>Exemplo do cotidiano</h4>`;
      formattedHtml += `<p>${exercicio.aplicacaoCotidiano}</p>`;
      formattedHtml += `</div>`;
    }

    // Fechar div do exercício
    formattedHtml += `</div>`;
  });
  
  return `<div class="space-y-4">${formattedHtml}</div>`;
}

/**
 * Melhora a formatação de HTML já existente
 */
function melhorarFormatacaoHTML(html: string): string {
  let formattedHtml = html;
  
  // Substitui saudação direta para criança por uma mensagem para os pais
  formattedHtml = formattedHtml.replace(
    /^\s*<div class="space-y-2"><p class="my-2">Olá,\s+([^!]+)!\s+Vamos\s+juntos\s+aprender[^<]+<\/p>/i,
    '<div class="space-y-2"><p class="my-2">Aqui está a resolução da tarefa para você orientar seu filho de forma clara e didática.</p>'
  );
  
  // Ajusta o formato dos títulos de exercícios
  formattedHtml = formattedHtml.replace(
    /(<h3[^>]*>)Exercício\s+(\d+)[:\s]+(.+?)(<\/h3>)/gi,
    '$1Exercício $2: $3$4'
  );

  // Melhora a formatação de "Resposta:" e "Explicação:"
  formattedHtml = formattedHtml.replace(
    /(<h4[^>]*>)(?:Resposta|Solução):\s*(<\/h4>)/gi,
    '$1Resposta:$2'
  );
  
  formattedHtml = formattedHtml.replace(
    /(<h4[^>]*>)(?:Explicação|Como explicar)(?:\s*para\s*(?:a\s*)?(?:criança|o\s*aluno))?:\s*(<\/h4>)/gi,
    '$1Como explicar para a criança:$2'
  );

  // Formata o "Exemplo do cotidiano:" com um estilo especial
  formattedHtml = formattedHtml.replace(
    /(<h4[^>]*>)(Exemplo d[oe] cotidiano):?(<\/h4>)([\s\S]*?)(?=<h|$)/gi,
    '<div class="exemplo-cotidiano">$1$2$3$4</div>'
  );

  // Melhora a formatação dos itens de lista
  formattedHtml = formattedHtml.replace(
    /<li>(.*?)<\/li>/gi,
    '<li class="mb-2 pl-2 text-gray-800">$1</li>'
  );

  return formattedHtml;
}

/**
 * Formata a resposta no estilo tradicional quando o formato JSON não é detectado
 * Esta é uma versão simplificada do formatador anterior
 */
function formatarRespostaTradicional(text: string): string {
  // Versão simplificada do código original
  let formattedText = text;
  
  // Processar enunciados
  formattedText = formattedText.replace(
    /\n(\d+)\.\s*([^\n]+)(?:\s*\n|$)/g, 
    function(match, number, text) {
      return `\n<h3 class="text-lg font-bold mt-4 mb-2 text-blue-700">${number}. ${text.trim()}</h3>\n`;
    }
  );
  
  // Formatação para Resposta e Explicação
  formattedText = formattedText
    .replace(/\*\*Resposta:\*\*/g, '<h4 class="font-semibold mt-2 text-green-700">Resposta:</h4>')
    .replace(/Resposta:/g, '<h4 class="font-semibold mt-2 text-green-700">Resposta:</h4>')
    .replace(/\*\*Explicação:\*\*/g, '<h4 class="font-semibold mt-3 text-green-700">Explicação:</h4>')
    .replace(/Explicação:/g, '<h4 class="font-semibold mt-3 text-green-700">Explicação:</h4>');
  
  // Formato para Exemplo
  formattedText = formattedText
    .replace(/\*\*Exemplo do cotidiano:\*\*/g, '<div class="exemplo-cotidiano-titulo">Exemplo do cotidiano:</div>')
    .replace(/Exemplo do cotidiano:/g, '<div class="exemplo-cotidiano-titulo">Exemplo do cotidiano:</div>');
  
  // Formate o conteúdo do exemplo do cotidiano
  formattedText = formattedText.replace(
    /<div class="exemplo-cotidiano-titulo">Exemplo do cotidiano:<\/div>\s*([^<]+)/g, 
    '<div class="exemplo-cotidiano-area"><div class="exemplo-cotidiano-titulo">Exemplo do cotidiano:</div><div class="exemplo-cotidiano-conteudo">$1</div></div>'
  );
  
  // Remover saudação direta à criança (como "Olá, Allan Gabriel!")
  formattedText = formattedText.replace(
    /^\s*<div class="space-y-2"><p class="my-2">Olá,\s+([^!]+)!\s+Vamos\s+juntos\s+aprender[^<]+<\/p>/i,
    '<div class="space-y-2"><p class="my-2">Aqui está a explicação da tarefa para orientar seu filho:'
  );
  
  // Formatação básica
  formattedText = formattedText
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  // Converter quebras de linha para HTML
  formattedText = formattedText
    .replace(/\n\n/g, '</p><p class="my-2">')
    .replace(/\n/g, '<br>');
    
  // Envolver em parágrafos
  formattedText = '<div class="space-y-2"><p class="my-2">' + formattedText + '</p></div>';
  
  // Adicionar divisores entre questões
  formattedText = formattedText
    .replace(/<\/h3>/g, '</h3><div class="pl-4 space-y-2 mt-1 pt-2">');
  
  // Fechar as divisões
  formattedText = formattedText
    .replace(/(<h3[^>]*>)/g, '</div>$1');
  
  // Remover o primeiro divisor fechado
  formattedText = formattedText.replace('</div><h3', '<h3');
  
  // Adicionar divisor final
  formattedText = formattedText + '</div>';
  
  return formattedText.trim();
} 