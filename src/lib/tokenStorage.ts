// Funções para gerenciar o uso de tokens no localStorage

/**
 * Obtém o uso de tokens do usuário atual do localStorage
 */
export const getTokensUsed = (userId: string): number => {
  const tokenUsage = localStorage.getItem(`tokenUsage_${userId}`);
  return tokenUsage ? parseInt(tokenUsage, 10) : 0;
};

/**
 * Armazena o uso de tokens do usuário atual no localStorage
 */
export const storeTokensUsed = (userId: string, tokens: number): void => {
  localStorage.setItem(`tokenUsage_${userId}`, tokens.toString());
};

/**
 * Reseta o uso de tokens do usuário atual no localStorage
 */
export const resetTokensUsed = (userId: string): void => {
  localStorage.setItem(`tokenUsage_${userId}`, '0');
}; 