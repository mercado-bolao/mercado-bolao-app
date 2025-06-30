import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/auth-middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Se chegou aqui, significa que o token é válido e o usuário é admin
    res.status(200).json({ success: true });
}

export default withAuth(handler); 