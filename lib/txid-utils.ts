
/**
 * Utilitários para geração e validação de TXID conforme padrão EFI Pay
 * TXID deve ter entre 26-35 caracteres alfanuméricos (a-zA-Z0-9)
 */

export class TxidUtils {
  private static readonly CARACTERES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  private static readonly TXID_PATTERN = /^[a-zA-Z0-9]{26,35}$/;
  private static readonly TXID_LENGTH = 32; // Tamanho padrão (meio do range)

  /**
   * Gera um TXID válido conforme padrão EFI Pay
   * @returns TXID de 32 caracteres alfanuméricos
   */
  static gerarTxid(): string {
    let txid = '';
    
    for (let i = 0; i < this.TXID_LENGTH; i++) {
      txid += this.CARACTERES.charAt(Math.floor(Math.random() * this.CARACTERES.length));
    }
    
    // Garantir que está no formato correto
    if (!this.validarTxid(txid)) {
      throw new Error(`TXID gerado inválido: ${txid}`);
    }
    
    return txid;
  }

  /**
   * Valida se um TXID está no formato correto
   * @param txid TXID para validar
   * @returns true se válido, false caso contrário
   */
  static validarTxid(txid: string): boolean {
    if (!txid || typeof txid !== 'string') {
      return false;
    }
    
    return this.TXID_PATTERN.test(txid);
  }

  /**
   * Sanitiza um TXID removendo caracteres inválidos
   * @param txid TXID para sanitizar
   * @returns TXID sanitizado
   */
  static sanitizarTxid(txid: string): string {
    if (!txid) return '';
    
    return txid.trim().replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Analisa um TXID e retorna informações detalhadas
   * @param txid TXID para analisar
   * @returns Objeto com análise detalhada
   */
  static analisarTxid(txid: string) {
    const sanitizado = this.sanitizarTxid(txid);
    
    return {
      original: txid,
      sanitizado: sanitizado,
      comprimento: sanitizado.length,
      valido: this.validarTxid(sanitizado),
      caracteresInvalidos: txid.match(/[^a-zA-Z0-9]/g) || [],
      dentroDoRange: sanitizado.length >= 26 && sanitizado.length <= 35,
      hexDump: Buffer.from(txid).toString('hex'),
      recomendacao: this.validarTxid(sanitizado) 
        ? 'TXID válido para EFI Pay' 
        : `TXID inválido - deve ter 26-35 caracteres alfanuméricos. Atual: ${sanitizado.length} caracteres`
    };
  }

  /**
   * Gera um TXID único baseado em timestamp e randomização
   * @param prefixo Prefixo opcional para identificação
   * @returns TXID único
   */
  static gerarTxidUnico(prefixo?: string): string {
    const timestamp = Date.now().toString(36); // Base36 para economizar caracteres
    const random = Math.random().toString(36).substring(2);
    
    let txid = prefixo ? `${prefixo}${timestamp}${random}` : `${timestamp}${random}`;
    
    // Ajustar para 32 caracteres
    if (txid.length > 32) {
      txid = txid.substring(0, 32);
    } else if (txid.length < 32) {
      // Completar com caracteres aleatórios
      while (txid.length < 32) {
        txid += this.CARACTERES.charAt(Math.floor(Math.random() * this.CARACTERES.length));
      }
    }
    
    // Sanitizar para garantir que só tem caracteres válidos
    txid = this.sanitizarTxid(txid);
    
    if (!this.validarTxid(txid)) {
      throw new Error(`Falha ao gerar TXID único válido: ${txid}`);
    }
    
    return txid;
  }
}
