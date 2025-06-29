export const VALORES = {
    BILHETE: 10.0, // Valor fixo do bilhete em reais
    PALPITE: 1.0 // Valor base do palpite (usado para cálculos internos)
} as const;

export const TEMPO = {
    EXPIRACAO_PIX: 30 * 60, // 30 minutos em segundos
    VERIFICACAO_STATUS: 30 * 1000 // 30 segundos em milissegundos
} as const;

export const STATUS = {
    PENDENTE: 'PENDENTE',
    PAGO: 'PAGO',
    CANCELADO: 'CANCELADO',
    EXPIRADO: 'EXPIRADO'
} as const; 