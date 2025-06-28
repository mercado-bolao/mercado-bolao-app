
-- Script para limpar completamente todos os palpites e dados do concurso 03
DO $$
DECLARE
    concurso_03_id TEXT;
    total_palpites_removidos INTEGER;
    total_jogos INTEGER;
BEGIN
    -- Buscar o ID do concurso 03
    SELECT id INTO concurso_03_id FROM "Concurso" WHERE numero = 3;
    
    IF concurso_03_id IS NULL THEN
        RAISE NOTICE '❌ Concurso 03 não encontrado!';
        RETURN;
    END IF;
    
    RAISE NOTICE '🔍 Concurso 03 encontrado: %', concurso_03_id;
    
    -- Contar palpites antes da remoção
    SELECT COUNT(*) INTO total_palpites_removidos
    FROM "Palpite" p
    JOIN "Jogo" j ON p."jogoId" = j.id
    WHERE j."concursoId" = concurso_03_id;
    
    -- Contar jogos
    SELECT COUNT(*) INTO total_jogos
    FROM "Jogo" 
    WHERE "concursoId" = concurso_03_id;
    
    RAISE NOTICE '📊 Palpites a serem removidos: %', total_palpites_removidos;
    RAISE NOTICE '🎮 Total de jogos no concurso: %', total_jogos;
    
    -- 1. Deletar todos os palpites do concurso 03
    DELETE FROM "Palpite" 
    WHERE "jogoId" IN (
        SELECT id FROM "Jogo" WHERE "concursoId" = concurso_03_id
    );
    
    RAISE NOTICE '✅ Todos os % palpites do concurso 03 foram removidos!', total_palpites_removidos;
    
    -- 2. Verificar se foram removidos
    SELECT COUNT(*) INTO total_palpites_removidos
    FROM "Palpite" p
    JOIN "Jogo" j ON p."jogoId" = j.id
    WHERE j."concursoId" = concurso_03_id;
    
    RAISE NOTICE '🔍 Palpites restantes no concurso 03: %', total_palpites_removidos;
    
    -- 3. Mostrar estatísticas finais
    RAISE NOTICE '📈 ESTATÍSTICAS FINAIS:';
    RAISE NOTICE '   - Concurso: %', concurso_03_id;
    RAISE NOTICE '   - Jogos mantidos: %', total_jogos;
    RAISE NOTICE '   - Palpites restantes: %', total_palpites_removidos;
    RAISE NOTICE '✨ Limpeza completa do concurso 03 finalizada!';
    
END $$;

-- Verificação final - mostrar estado atual do concurso 03
SELECT 
    c.numero as "Concurso",
    c.nome as "Nome",
    c.status as "Status",
    COUNT(DISTINCT j.id) as "Total_Jogos",
    COUNT(p.id) as "Total_Palpites",
    COUNT(DISTINCT p.nome) as "Apostadores_Unicos"
FROM "Concurso" c
LEFT JOIN "Jogo" j ON c.id = j."concursoId"
LEFT JOIN "Palpite" p ON j.id = p."jogoId"
WHERE c.numero = 3
GROUP BY c.id, c.numero, c.nome, c.status;
