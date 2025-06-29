import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        console.log('🔍 Verificando status do webhook EFI...');

        // Configurar EFI
        const efiSandbox = process.env.EFI_SANDBOX || 'false';
        const isSandbox = efiSandbox === 'true';

        const EfiPay = require('sdk-node-apis-efi');

        let efiConfig: any = {
            sandbox: isSandbox,
            client_id: process.env.EFI_CLIENT_ID,
            client_secret: process.env.EFI_CLIENT_SECRET
        };

        // Configurar certificado para produção
        if (!isSandbox) {
            console.log('🔐 Configurando certificado para produção...');
            const certificatePath = path.resolve('./certs/certificado-efi.p12');

            if (fs.existsSync(certificatePath) && process.env.EFI_CERTIFICATE_PASSPHRASE) {
                efiConfig.certificate = certificatePath;
                efiConfig.passphrase = process.env.EFI_CERTIFICATE_PASSPHRASE;
                console.log('✅ Certificado configurado com sucesso');
            } else {
                console.error('❌ Certificado não encontrado ou passphrase não configurada');
                return res.status(400).json({
                    success: false,
                    error: 'Certificado não configurado para produção'
                });
            }
        }

        const efipay = new EfiPay(efiConfig);
        const pixKey = process.env.EFI_PIX_KEY;

        if (!pixKey) {
            console.error('❌ Chave PIX não configurada');
            return res.status(400).json({
                success: false,
                error: 'Chave PIX não configurada'
            });
        }

        // URL esperada do webhook
        const domain = req.headers.host;
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const expectedWebhookUrl = `${protocol}://${domain}/api/webhook-pix`;

        // Verificar webhooks configurados
        console.log('🔍 Verificando webhooks existentes...');
        const webhookList = await efipay.pixListWebhook();
        console.log('📋 Webhooks existentes:', JSON.stringify(webhookList, null, 2));

        const registeredWebhook = webhookList[pixKey];

        if (!registeredWebhook) {
            console.warn('⚠️ Nenhum webhook registrado para a chave PIX');
            return res.status(200).json({
                success: false,
                error: 'Nenhum webhook registrado',
                data: {
                    pixKey: pixKey,
                    ambiente: isSandbox ? 'sandbox' : 'producao',
                    webhookEsperado: expectedWebhookUrl,
                    webhookRegistrado: null
                }
            });
        }

        // Verificar se o webhook registrado corresponde ao esperado
        const webhookMatch = registeredWebhook === expectedWebhookUrl;

        if (!webhookMatch) {
            console.warn('⚠️ Webhook registrado não corresponde ao esperado:', {
                registrado: registeredWebhook,
                esperado: expectedWebhookUrl
            });
        } else {
            console.log('✅ Webhook está corretamente configurado');
        }

        return res.status(200).json({
            success: true,
            data: {
                pixKey: pixKey,
                ambiente: isSandbox ? 'sandbox' : 'producao',
                webhookEsperado: expectedWebhookUrl,
                webhookRegistrado: registeredWebhook,
                webhookCorreto: webhookMatch
            }
        });

    } catch (error) {
        console.error('❌ Erro ao verificar status do webhook:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao verificar status do webhook',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
} 