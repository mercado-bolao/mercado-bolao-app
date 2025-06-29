
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { txid } = req.body;

  if (!txid) {
    return res.status(400).json({ 
      error: 'TXID é obrigatório',
      valido: false
    });
  }

  try {
    // Validar formato do TXID conforme especificação EFÍ
    const txidPattern = /^[a-zA-Z0-9]{26,35}$/;
    const valido = txidPattern.test(txid);

    return res.status(200).json({
      success: true,
      txid: txid,
      valido: valido,
      comprimento: txid.length,
      formato: valido ? 'Válido conforme padrão EFÍ' : 'Inválido - deve ter 26-35 caracteres alfanuméricos',
      padrao: '^[a-zA-Z0-9]{26,35}$'
    });

  } catch (error) {
    console.error('❌ Erro ao validar TXID:', error);
    return res.status(500).json({
      error: 'Erro ao validar TXID',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
