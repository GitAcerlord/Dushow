/**
 * Detecta padrões de contato externo para evitar bypass da plataforma
 */
export const scanMessageForBypass = (text: string): { isSafe: boolean; reason?: string } => {
  // Bloqueio adicional: qualquer caractere numérico
  const hasAnyDigitRegex = /\d/;

  // Regex para telefones (vários formatos brasileiros)
  const phoneRegex = /(\(?\d{2}\)?\s?\d{4,5}-?\d{4})|(\d{10,11})/;
  
  // Regex para e-mails
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  
  // Palavras-chave suspeitas
  const suspiciousKeywords = [
    'whatsapp', 'zap', 'telefone', 'meu numero', 'me chama no', 
    'pix direto', 'por fora', 'transferencia', 'meu email', 'instagram'
  ];

  if (hasAnyDigitRegex.test(text)) {
    return { isSafe: false, reason: "Mensagens com números estão bloqueadas por segurança." };
  }

  if (phoneRegex.test(text)) {
    return { isSafe: false, reason: "Compartilhamento de telefone não permitido por segurança." };
  }

  if (emailRegex.test(text)) {
    return { isSafe: false, reason: "Compartilhamento de e-mail não permitido por segurança." };
  }

  const lowerText = text.toLowerCase();
  if (suspiciousKeywords.some(keyword => lowerText.includes(keyword))) {
    return { isSafe: false, reason: "Detectamos termos que sugerem negociação fora da plataforma." };
  }

  return { isSafe: true };
};
