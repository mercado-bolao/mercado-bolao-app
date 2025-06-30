import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-aqui';

export function generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
        return null;
    }
}

type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

export function withAuth(handler: ApiHandler): ApiHandler {
    return async (req: NextApiRequest, res: NextApiResponse) => {
        try {
            // Verificar se o token está presente no header
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Token não fornecido' });
            }

            // Extrair e verificar o token
            const token = authHeader.split(' ')[1];
            const payload = verifyToken(token);

            if (!payload) {
                return res.status(401).json({ error: 'Token inválido ou expirado' });
            }

            // Verificar se é admin
            if (!payload.isAdmin) {
                return res.status(403).json({ error: 'Acesso não autorizado' });
            }

            // Adicionar o usuário ao request
            (req as any).user = payload;

            // Prosseguir com o handler
            return await handler(req, res);
        } catch (error) {
            console.error('Erro na autenticação:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    };
} 