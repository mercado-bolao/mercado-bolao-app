
-- Script para adicionar 2 jogos ao concurso 01
DO $$
DECLARE
    concurso_01_id TEXT;
    jogo_09_id TEXT;
    jogo_10_id TEXT;
BEGIN
    -- Buscar o ID do concurso 01
    SELECT id INTO concurso_01_id FROM "Concurso" WHERE numero = 1;
    
    IF concurso_01_id IS NULL THEN
        RAISE NOTICE '❌ Concurso 01 não encontrado!';
        RETURN;
    END IF;
    
    RAISE NOTICE '🔍 Concurso 01 encontrado: %', concurso_01_id;
    
    -- Inserir Jogo 09: Liverpool vs Arsenal
    INSERT INTO "Jogo" ("id", "mandante", "visitante", "horario", "concursoId") 
    VALUES (
        gen_random_uuid()::text,
        'Liverpool',
        'Arsenal',
        '2025-02-15 18:00:00'::timestamp,
        concurso_01_id
    ) RETURNING id INTO jogo_09_id;
    
    RAISE NOTICE '✅ Jogo 09 criado: Liverpool vs Arsenal (ID: %)', jogo_09_id;
    
    -- Inserir Jogo 10: Barcelona vs Valencia
    INSERT INTO "Jogo" ("id", "mandante", "visitante", "horario", "concursoId") 
    VALUES (
        gen_random_uuid()::text,
        'Barcelona',
        'Valencia',
        '2025-02-15 20:00:00'::timestamp,
        concurso_01_id
    ) RETURNING id INTO jogo_10_id;
    
    RAISE NOTICE '✅ Jogo 10 criado: Barcelona vs Valencia (ID: %)', jogo_10_id;
    
    RAISE NOTICE '🎯 2 novos jogos adicionados ao concurso 01!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro: %', SQLERRM;
END $$;

-- Verificar total de jogos no concurso 01
SELECT 
    COUNT(*) as total_jogos,
    c.nome as concurso_nome
FROM "Jogo" j
JOIN "Concurso" c ON j."concursoId" = c.id
WHERE c.numero = 1
GROUP BY c.nome;
