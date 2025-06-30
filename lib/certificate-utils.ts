import path from 'path';
import fs from 'fs';

interface EfiConfig {
    sandbox: boolean;
    client_id: string | undefined;
    client_secret: string | undefined;
    certificate?: string;
    passphrase?: string;
}

export function getEfiConfig(isSandbox: boolean): EfiConfig {
    // Configuração base
    const config: EfiConfig = {
        sandbox: isSandbox,
        client_id: process.env.EFI_CLIENT_ID,
        client_secret: process.env.EFI_CLIENT_SECRET
    };

    // Tentar encontrar o certificado usando caminhos relativos
    const certificatePath = path.join(process.cwd(), 'certs', 'certificado-efi.p12');

    console.log('📂 Debug de caminhos:', {
        processDir: process.cwd(),
        certificatePath: certificatePath,
        nodeEnv: process.env.NODE_ENV,
        tentandoLer: 'certs/certificado-efi.p12'
    });

    try {
        if (fs.existsSync(certificatePath)) {
            console.log('✅ Certificado encontrado em:', certificatePath);
            config.certificate = certificatePath;
            config.passphrase = process.env.EFI_CERTIFICATE_PASSPHRASE;
        } else {
            console.log('⚠️ Certificado não encontrado em:', certificatePath);
            // Em produção, se não encontrar o certificado, lança erro
            if (process.env.NODE_ENV === 'production') {
                throw new Error(`Certificado não encontrado em: ${certificatePath}`);
            }
        }
    } catch (error) {
        console.error('❌ Erro ao tentar ler certificado:', error);
        if (process.env.NODE_ENV === 'production') {
            throw error;
        }
    }

    return config;
} 