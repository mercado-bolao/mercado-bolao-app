
-- Script para limpar jogos duplicados e incorretos
DO $$
DECLARE
    concurso_01_id TEXT;
    total_jogos_antes INTEGER;
    total_jogos_depois INTEGER;
    jogos_removidos INTEGER;
    palpites_removidos INTEGER;
BEGIN
    -- Buscar o ID do concurso 01
    SELECT id INTO concurso_01_id FROM "Concurso" WHERE numero = 1;
    
    IF concurso_01_id IS NULL THEN
        RAISE NOTICE '❌ Concurso 01 não encontrado!';
        RETURN;
    END IF;
    
    RAISE NOTICE '🔍 Concurso 01 encontrado: %', concurso_01_id;
    
    -- Contar jogos antes da limpeza
    SELECT COUNT(*) INTO total_jogos_antes
    FROM "Jogo" 
    WHERE "concursoId" = concurso_01_id;
    
    RAISE NOTICE '📊 Total de jogos antes da limpeza: %', total_jogos_antes;
    
    -- Contar palpites que serão removidos
    SELECT COUNT(*) INTO palpites_removidos
    FROM "Palpite" p
    JOIN "Jogo" j ON p."jogoId" = j.id
    WHERE j."concursoId" = concurso_01_id 
    AND j.id NOT IN (
        SELECT DISTINCT ON (j.mandante, j.visitante) j.id
        FROM "Jogo" j
        WHERE j."concursoId" = concurso_01_id
        ORDER BY j.mandante, j.visitante, j.horario
    );
    
    RAISE NOTICE '🗑️ Palpites que serão removidos: %', palpites_removidos;
    
    -- Remover palpites dos jogos duplicados
    DELETE FROM "Palpite" 
    WHERE "jogoId" IN (
        SELECT j.id FROM "Jogo" j
        WHERE j."concursoId" = concurso_01_id 
        AND j.id NOT IN (
            SELECT DISTINCT ON (j.mandante, j.visitante) j.id
            FROM "Jogo" j
            WHERE j."concursoId" = concurso_01_id
            ORDER BY j.mandante, j.visitante, j.horario
        )
    );
    
    RAISE NOTICE '🧹 Palpites dos jogos duplicados removidos!';
    
    -- Remover jogos duplicados, mantendo apenas o primeiro de cada par mandante/visitante
    DELETE FROM "Jogo" 
    WHERE "concursoId" = concurso_01_id 
    AND id NOT IN (
        SELECT DISTINCT ON (mandante, visitante) id
        FROM "Jogo"
        WHERE "concursoId" = concurso_01_id
        ORDER BY mandante, visitante, horario
    );
    
    -- Contar jogos após a limpeza
    SELECT COUNT(*) INTO total_jogos_depois
    FROM "Jogo" 
    WHERE "concursoId" = concurso_01_id;
    
    jogos_removidos := total_jogos_antes - total_jogos_depois;
    
    RAISE NOTICE '✅ Jogos duplicados removidos: %', jogos_removidos;
    RAISE NOTICE '📊 Total de jogos após limpeza: %', total_jogos_depois;
    RAISE NOTICE '🎯 Limpeza de jogos duplicados concluída!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro: %', SQLERRM;
END $$;

-- Verificar jogos restantes no concurso 01
SELECT 
    COUNT(*) as total_jogos,
    c.nome as concurso_nome
FROM "Jogo" j
JOIN "Concurso" c ON j."concursoId" = c.id
WHERE c.numero = 1
GROUP BY c.nome;

-- Listar os jogos restantes
SELECT 
    j.mandante,
    j.visitante,
    j.horario
FROM "Jogo" j
JOIN "Concurso" c ON j."concursoId" = c.id
WHERE c.numero = 1
ORDER BY j.horario;
