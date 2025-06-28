
-- Recriar tabela Jogo com jogos do concurso 03
CREATE TABLE IF NOT EXISTS "Jogo" (
    "id" TEXT NOT NULL,
    "mandante" TEXT NOT NULL,
    "visitante" TEXT NOT NULL,
    "horario" TIMESTAMP(3) NOT NULL,
    "resultado" TEXT,
    "placarCasa" INTEGER,
    "placarVisitante" INTEGER,
    "statusJogo" TEXT,
    "tempoJogo" INTEGER,
    "fotoMandante" TEXT,
    "fotoVisitante" TEXT,
    "concursoId" TEXT NOT NULL,

    CONSTRAINT "Jogo_pkey" PRIMARY KEY ("id")
);

-- Adicionar foreign key constraint
ALTER TABLE "Jogo" 
ADD CONSTRAINT "Jogo_concursoId_fkey" 
FOREIGN KEY ("concursoId") REFERENCES "Concurso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Buscar o ID do concurso 03
DO $$
DECLARE
    concurso_03_id TEXT;
BEGIN
    SELECT id INTO concurso_03_id FROM "Concurso" WHERE numero = 3;

    IF concurso_03_id IS NOT NULL THEN
        -- Limpar jogos existentes do concurso 03
        DELETE FROM "Jogo" WHERE "concursoId" = concurso_03_id;

        -- Inserir jogos do concurso 03 com as datas e horários corretos para 2025
        INSERT INTO "Jogo" ("id", "mandante", "visitante", "horario", "resultado", "concursoId") VALUES
        (gen_random_uuid()::text, 'Palmeiras', 'Botafogo', '2025-06-28 13:00:00', '1x0', concurso_03_id),
        (gen_random_uuid()::text, 'Benfica', 'Chelsea', '2025-06-28 17:00:00', '2x1', concurso_03_id),
        (gen_random_uuid()::text, 'PSG', 'Inter Miami', '2025-06-29 13:00:00', '3x1', concurso_03_id),
        (gen_random_uuid()::text, 'Flamengo', 'Bayern de Munique', '2025-06-29 17:00:00', '0x2', concurso_03_id),
        (gen_random_uuid()::text, 'Inter de Milão', 'Fluminense', '2025-06-30 16:00:00', '1x1', concurso_03_id),
        (gen_random_uuid()::text, 'Manchester City', 'Al-Hilal', '2025-06-30 22:00:00', '4x1', concurso_03_id),
        (gen_random_uuid()::text, 'Real Madrid', 'Juventus', '2025-07-01 16:00:00', '2x0', concurso_03_id),
        (gen_random_uuid()::text, 'Borussia Dortmund', 'Monterrey', '2025-07-01 22:00:00', '3x2', concurso_03_id);

        RAISE NOTICE 'Jogos do concurso 03 atualizados com datas e horários corretos para 2025!';
    ELSE
        RAISE NOTICE 'Concurso 03 não encontrado!';
    END IF;
END $$;

-- Verificar os jogos atualizados
SELECT 
    mandante, 
    visitante, 
    to_char(horario, 'DD/MM/YYYY HH24:MI') as data_formatada,
    resultado
FROM "Jogo" 
WHERE "concursoId" = (SELECT id FROM "Concurso" WHERE numero = 3)
ORDER BY horario;
