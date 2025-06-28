
-- Script para deletar todos os palpites do concurso 03
DO $$
DECLARE
    concurso_03_id TEXT;
    total_palpites_deletados INTEGER;
BEGIN
    -- Buscar o ID do concurso 03
    SELECT id INTO concurso_03_id FROM "Concurso" WHERE numero = 3;
    
    IF concurso_03_id IS NULL THEN
        RAISE NOTICE '❌ Concurso 03 não encontrado!';
        RETURN;
    END IF;
    
    RAISE NOTICE '🔍 Concurso 03 encontrado: %', concurso_03_id;
    
    -- Contar palpites antes da remoção
    SELECT COUNT(*) INTO total_palpites_deletados
    FROM "Palpite" p
    WHERE p."concursoId" = concurso_03_id;
    
    RAISE NOTICE '📊 Total de palpites a serem deletados: %', total_palpites_deletados;
    
    -- Deletar todos os palpites do concurso 03
    DELETE FROM "Palpite" 
    WHERE "concursoId" = concurso_03_id;
    
    RAISE NOTICE '✅ Todos os % palpites do concurso 03 foram deletados!', total_palpites_deletados;
    
    -- Verificar se foram removidos
    SELECT COUNT(*) INTO total_palpites_deletados
    FROM "Palpite" p
    WHERE p."concursoId" = concurso_03_id;
    
    RAISE NOTICE '🔍 Palpites restantes no concurso 03: %', total_palpites_deletados;
    RAISE NOTICE '✨ Operação de exclusão concluída!';
    
END $$;

-- Verificação final - mostrar estado atual do concurso 03
SELECT 
    c.numero as "Concurso",
    c.nome as "Nome",
    c.status as "Status",
    COUNT(DISTINCT j.id) as "Total_Jogos",
    COUNT(p.id) as "Total_Palpites_Restantes"
FROM "Concurso" c
LEFT JOIN "Jogo" j ON c.id = j."concursoId"
LEFT JOIN "Palpite" p ON p."concursoId" = c.id
WHERE c.numero = 3
GROUP BY c.id, c.numero, c.nome, c.status;
