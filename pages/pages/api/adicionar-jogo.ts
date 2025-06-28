import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Criar diretório se não existir
    const uploadDir = './public/uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      uploadDir: uploadDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
    });

    const [fields, files] = await form.parse(req);

    const concursoId = Array.isArray(fields.concursoId) ? fields.concursoId[0] : fields.concursoId;
    const mandante = Array.isArray(fields.mandante) ? fields.mandante[0] : fields.mandante;
    const visitante = Array.isArray(fields.visitante) ? fields.visitante[0] : fields.visitante;
    const horario = Array.isArray(fields.horario) ? fields.horario[0] : fields.horario;

    if (!concursoId || !mandante || !visitante || !horario) {
      return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
    }

    // Processar fotos
    let fotoMandanteUrl = null;
    let fotoVisitanteUrl = null;

    if (files.fotoMandante) {
      const fotoMandante = Array.isArray(files.fotoMandante) ? files.fotoMandante[0] : files.fotoMandante;
      if (fotoMandante && fotoMandante.filepath) {
        const filename = `mandante_${Date.now()}_${fotoMandante.originalFilename || 'image.jpg'}`;
        const newPath = path.join(uploadDir, filename);
        fs.renameSync(fotoMandante.filepath, newPath);
        fotoMandanteUrl = `/uploads/${filename}`;
      }
    }

    if (files.fotoVisitante) {
      const fotoVisitante = Array.isArray(files.fotoVisitante) ? files.fotoVisitante[0] : files.fotoVisitante;
      if (fotoVisitante && fotoVisitante.filepath) {
        const filename = `visitante_${Date.now()}_${fotoVisitante.originalFilename || 'image.jpg'}`;
        const newPath = path.join(uploadDir, filename);
        fs.renameSync(fotoVisitante.filepath, newPath);
        fotoVisitanteUrl = `/uploads/${filename}`;
      }
    }

    // Salvar no banco de dados
    // Converter horário brasileiro para UTC
      const horarioBrasil = new Date(horario);
      const horarioUTC = new Date(horarioBrasil.getTime() + (3 * 60 * 60 * 1000)); // Adicionar 3 horas para converter BRT para UTC

      const jogo = await prisma.jogo.create({
        data: {
          concursoId,
          mandante: mandante.trim(),
          visitante: visitante.trim(),
          horario: horarioUTC, // Salvar em UTC
          fotoMandante: fotoMandanteUrl,
          fotoVisitante: fotoVisitanteUrl,
        },
      });

    res.status(200).json({ 
      success: true, 
      jogo,
      message: 'Jogo adicionado com sucesso!' 
    });

  } catch (error) {
    console.error('Erro ao adicionar jogo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}