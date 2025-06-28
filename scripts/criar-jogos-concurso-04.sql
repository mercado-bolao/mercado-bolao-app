-- Script para criar jogos no concurso 04
DO $$
DECLARE
    concurso_04_id TEXT;
    total_jogos_criados INTEGER;
BEGIN
    -- Buscar ID do concurso 04
    SELECT id INTO concurso_04_id FROM "Concurso" WHERE numero = 4;

    IF concurso_04_id IS NULL THEN
        RAISE EXCEPTION '❌ Concurso 04 não encontrado!';
    END IF;

    RAISE NOTICE '🔍 Concurso 04 encontrado: %', concurso_04_id;

    -- Verificar se já existem jogos
    SELECT COUNT(*) INTO total_jogos_criados FROM "Jogo" WHERE "concursoId" = concurso_04_id;

    IF total_jogos_criados > 0 THEN
        RAISE NOTICE '⚠️ Já existem % jogos no concurso 04. Removendo jogos antigos...', total_jogos_criados;
        DELETE FROM "Jogo" WHERE "concursoId" = concurso_04_id;
    END IF;

    -- Inserir os 8 jogos do concurso 04
    INSERT INTO "Jogo" (id, mandante, visitante, horario, "concursoId") VALUES
    (gen_random_uuid(), 'Palmeiras', 'Botafogo', '2025-01-30 16:00:00', concurso_04_id),
    (gen_random_uuid(), 'Benfica', 'Chelsea', '2025-01-30 19:00:00', concurso_04_id),
    (gen_random_uuid(), 'PSG', 'Inter Miami', '2025-01-31 16:00:00', concurso_04_id),
    (gen_random_uuid(), 'Flamengo', 'Bayern de Munique', '2025-01-31 19:00:00', concurso_04_id),
    (gen_random_uuid(), 'Inter de Milão', 'Fluminense', '2025-02-01 16:00:00', concurso_04_id),
    (gen_random_uuid(), 'Manchester City', 'Al-Hilal', '2025-02-01 19:00:00', concurso_04_id),
    (gen_random_uuid(), 'Real Madrid', 'Juventus', '2025-02-02 16:00:00', concurso_04_id),
    (gen_random_uuid(), 'Borussia Dortmund', 'Monterrey', '2025-02-02 19:00:00', concurso_04_id);

    -- Verificar quantos jogos foram criados
    SELECT COUNT(*) INTO total_jogos_criados FROM "Jogo" WHERE "concursoId" = concurso_04_id;

    RAISE NOTICE '✅ Criados % jogos no concurso 04!', total_jogos_criados;

END $$;

-- Verificar resultado final
SELECT 
    c.numero as concurso,
    c.nome,
    COUNT(j.id) as total_jogos
FROM "Concurso" c
LEFT JOIN "Jogo" j ON c.id = j."concursoId"
WHERE c.numero = 4
GROUP BY c.id, c.numero, c.nome;