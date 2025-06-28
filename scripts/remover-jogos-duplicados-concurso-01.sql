
-- Script para remover jogos duplicados do concurso 01
DO $$
DECLARE
    concurso_01_id TEXT;
    total_jogos_antes INTEGER;
    total_jogos_depois INTEGER;
    jogos_removidos INTEGER;
BEGIN
    -- Buscar o ID do concurso 01
    SELECT id INTO concurso_01_id FROM "Concurso" WHERE numero = 1;
    
    IF concurso_01_id IS NULL THEN
        RAISE NOTICE '❌ Concurso 01 não encontrado!';
        RETURN;
    END IF;
    
    RAISE NOTICE '🔍 Concurso 01 encontrado: %', concurso_01_id;
    
    -- Contar jogos antes da remoção
    SELECT COUNT(*) INTO total_jogos_antes
    FROM "Jogo" 
    WHERE "concursoId" = concurso_01_id;
    
    RAISE NOTICE '📊 Total de jogos antes da limpeza: %', total_jogos_antes;
    
    -- Primeiro, remover palpites dos jogos que serão deletados
    DELETE FROM "Palpite" 
    WHERE "jogoId" IN (
        SELECT id FROM "Jogo" 
        WHERE "concursoId" = concurso_01_id 
        AND (
            (mandante = 'Liverpool' AND visitante = 'Arsenal') OR
            (mandante = 'Barcelona' AND visitante IN ('Atletico Madrid', 'Valencia'))
        )
    );
    
    RAISE NOTICE '🧹 Palpites dos jogos duplicados removidos!';
    
    -- Remover os jogos duplicados
    DELETE FROM "Jogo" 
    WHERE "concursoId" = concurso_01_id 
    AND (
        (mandante = 'Liverpool' AND visitante = 'Arsenal') OR
        (mandante = 'Barcelona' AND visitante IN ('Atletico Madrid', 'Valencia'))
    );
    
    -- Contar jogos após a remoção
    SELECT COUNT(*) INTO total_jogos_depois
    FROM "Jogo" 
    WHERE "concursoId" = concurso_01_id;
    
    jogos_removidos := total_jogos_antes - total_jogos_depois;
    
    RAISE NOTICE '✅ Jogos removidos: %', jogos_removidos;
    RAISE NOTICE '📊 Total de jogos após limpeza: %', total_jogos_depois;
    RAISE NOTICE '🎯 Limpeza concluída com sucesso!';
    
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
