
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
   * @param length Comprimento do TXID (padrão: 32)
   * @returns TXID de caracteres alfanuméricos
   */
  static gerarTxid(length: number = 32): string {
    if (length < 26 || length > 35) {
      throw new Error(`Comprimento do TXID deve estar entre 26 e 35 caracteres. Recebido: ${length}`);
    }

    let txid = '';
    
    for (let i = 0; i < length; i++) {
      txid += this.CARACTERES.charAt(Math.floor(Math.random() * this.CARACTERES.length));
    }
    
    // Garantir que está no formato correto
    if (!this.validarTxid(txid)) {
      throw new Error(`TXID gerado inválido: ${txid}`);
    }
    
    return txid;
  }

  /**
   * Gera um TXID seguro sem prefixos ou caracteres especiais
   * @param length Comprimento do TXID (padrão: 32)
   * @returns TXID seguro para EFI Pay
   */
  static gerarTxidSeguro(length: number = 32): string {
    if (length < 26 || length > 35) {
      throw new Error(`Comprimento do TXID deve estar entre 26 e 35 caracteres. Recebido: ${length}`);
    }

    const caracteres = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let txid = '';
    
    for (let i = 0; i < length; i++) {
      txid += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    
    // Validar o TXID gerado
    if (!this.validarTxid(txid)) {
      throw new Error(`TXID seguro gerado inválido: ${txid}`);
    }
    
    console.log('✅ TXID seguro gerado:', {
      txid: txid,
      comprimento: txid.length,
      valido: this.validarTxid(txid),
      formato: 'alfanumérico mixed case'
    });
    
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
   * Gera um TXID único baseado em timestamp e randomização (SEM PREFIXO)
   * @param ignorePrefixo Ignorar prefixo antigo (compatibilidade)
   * @returns TXID único sem prefixo
   */
  static gerarTxidUnico(ignorePrefixo?: string): string {
    // Usar gerador seguro sempre, ignorando qualquer prefixo
    return this.gerarTxidSeguro(32);
  }
}
