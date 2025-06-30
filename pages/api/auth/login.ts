import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth-middleware';
import { LoginCredentials, AuthResponse } from '@/types/auth';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<AuthResponse>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Método não permitido' });
    }

    try {
        const { email, senha } = req.body as LoginCredentials;

        if (!email || !senha) {
            return res.status(400).json({
                success: false,
                error: 'Email e senha são obrigatórios'
            });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user || !user.senhaHash) {
            return res.status(401).json({
                success: false,
                error: 'Credenciais inválidas'
            });
        }

        const senhaCorreta = await bcrypt.compare(senha, user.senhaHash);

        if (!senhaCorreta) {
            return res.status(401).json({
                success: false,
                error: 'Credenciais inválidas'
            });
        }

        if (!user.isAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Usuário não tem permissão de administrador'
            });
        }

        const token = generateToken({
            userId: user.id,
            email: user.email!,
            isAdmin: user.isAdmin
        });

        return res.status(200).json({
            success: true,
            token
        });
    } catch (error) {
        console.error('Erro no login:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
} 