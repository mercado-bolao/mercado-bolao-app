
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Criar concurso de exemplo
  const concurso = await prisma.concurso.create({
    data: {
      numero: 1,
      nome: 'Copa de Verão 2025',
      dataInicio: new Date('2025-01-20T10:00:00Z'),
      dataFim: new Date('2025-01-25T23:59:59Z'),
      status: 'ativo',
      premioEstimado: 50000.00,
      fechamentoPalpites: new Date('2025-01-20T14:00:00Z')
    }
  })

  console.log(`✅ Concurso criado: ${concurso.nome}`)

  // Criar jogos de exemplo
  const jogos = await Promise.all([
    prisma.jogo.create({
      data: {
        mandante: 'Flamengo',
        visitante: 'Palmeiras',
        horario: new Date('2025-01-21T19:00:00Z'),
        concursoId: concurso.id
      }
    }),
    prisma.jogo.create({
      data: {
        mandante: 'São Paulo',
        visitante: 'Corinthians',
        horario: new Date('2025-01-21T21:00:00Z'),
        concursoId: concurso.id
      }
    }),
    prisma.jogo.create({
      data: {
        mandante: 'Santos',
        visitante: 'Botafogo',
        horario: new Date('2025-01-22T19:00:00Z'),
        concursoId: concurso.id
      }
    })
  ])

  console.log(`✅ ${jogos.length} jogos criados`)

  // Criar usuários de exemplo
  const usuarios = await Promise.all([
    prisma.user.create({
      data: {
        nome: 'João Silva',
        email: 'joao@example.com',
        whatsapp: '11999999999'
      }
    }),
    prisma.user.create({
      data: {
        nome: 'Maria Santos',
        email: 'maria@example.com',
        whatsapp: '11888888888'
      }
    })
  ])

  console.log(`✅ ${usuarios.length} usuários criados`)

  // Criar palpites de exemplo
  const palpites = await Promise.all([
    prisma.palpite.create({
      data: {
        nome: 'João Silva',
        whatsapp: '11999999999',
        resultado: 'Vitória Mandante',
        jogoId: jogos[0].id,
        concursoId: concurso.id,
        userId: usuarios[0].id
      }
    }),
    prisma.palpite.create({
      data: {
        nome: 'Maria Santos',
        whatsapp: '11888888888',
        resultado: 'Empate',
        jogoId: jogos[0].id,
        concursoId: concurso.id,
        userId: usuarios[1].id
      }
    })
  ])

  console.log(`✅ ${palpites.length} palpites criados`)
  console.log('🎉 Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
