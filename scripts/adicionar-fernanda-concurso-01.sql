
-- Script para adicionar os palpites da Fernanda no concurso 01
DO $$
DECLARE
    concurso_01_id TEXT;
    jogo_ids TEXT[];
    total_inseridos INTEGER := 0;
BEGIN
    -- 1. Buscar o ID do concurso 01
    SELECT id INTO concurso_01_id FROM "Concurso" WHERE numero = 1;
    
    IF concurso_01_id IS NULL THEN
        RAISE NOTICE '❌ Concurso 01 não encontrado!';
        RETURN;
    END IF;
    
    RAISE NOTICE '🔍 Concurso 01 encontrado: %', concurso_01_id;
    
    -- 2. Buscar IDs dos jogos em ordem
    SELECT ARRAY_AGG(id ORDER BY horario, id) INTO jogo_ids 
    FROM "Jogo" WHERE "concursoId" = concurso_01_id;
    
    IF array_length(jogo_ids, 1) != 8 THEN
        RAISE NOTICE '❌ Esperado 8 jogos, encontrados: %', array_length(jogo_ids, 1);
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Encontrados 8 jogos!';
    
    -- 3. Inserir palpites da Fernanda - F,C,F,C,F,C,C,C
    FOR jogo_num IN 1..8 LOOP
        INSERT INTO "Palpite" ("id", "nome", "whatsapp", "resultado", "jogoId", "concursoId", "createdAt") 
        VALUES (
            gen_random_uuid()::text,
            'Fernanda',
            '+5581981170000',
            CASE jogo_num 
                WHEN 1 THEN '2' WHEN 2 THEN '1' WHEN 3 THEN '2' WHEN 4 THEN '1'
                WHEN 5 THEN '2' WHEN 6 THEN '1' WHEN 7 THEN '1' WHEN 8 THEN '1'
            END,
            jogo_ids[jogo_num],
            concurso_01_id,
            '2025-01-28 13:40:00'::timestamp + (interval '1 minute' * jogo_num)
        );
    END LOOP;

    -- 4. Inserir palpites da Fernanda2 - F,F,C,F,C,F,F,F
    FOR jogo_num IN 1..8 LOOP
        INSERT INTO "Palpite" ("id", "nome", "whatsapp", "resultado", "jogoId", "concursoId", "createdAt") 
        VALUES (
            gen_random_uuid()::text,
            'Fernanda2',
            '+5581981170000',
            CASE jogo_num 
                WHEN 1 THEN '2' WHEN 2 THEN '2' WHEN 3 THEN '1' WHEN 4 THEN '2'
                WHEN 5 THEN '1' WHEN 6 THEN '2' WHEN 7 THEN '2' WHEN 8 THEN '2'
            END,
            jogo_ids[jogo_num],
            concurso_01_id,
            '2025-01-28 13:50:00'::timestamp + (interval '1 minute' * jogo_num)
        );
    END LOOP;

    -- Contar total inserido
    SELECT COUNT(*) INTO total_inseridos FROM "Palpite" WHERE "concursoId" = concurso_01_id;
    
    RAISE NOTICE '✅ Palpites da Fernanda adicionados com sucesso!';
    RAISE NOTICE '📊 Total de palpites no concurso 01: %', total_inseridos;
    RAISE NOTICE '👥 2 novos apostadores adicionados';
    RAISE NOTICE '🎯 16 novos palpites inseridos (2 x 8 jogos)';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro durante execução: %', SQLERRM;
END $$;

-- Verificar se os palpites foram inseridos
SELECT 
    COUNT(*) as total_palpites_concurso_01,
    COUNT(DISTINCT nome) as apostadores_unicos,
    COUNT(*) / COUNT(DISTINCT nome) as palpites_por_apostador
FROM "Palpite" p
JOIN "Jogo" j ON p."jogoId" = j.id
WHERE j."concursoId" = (SELECT id FROM "Concurso" WHERE numero = 1);

-- Verificar os palpites da Fernanda especificamente
SELECT 
    nome,
    whatsapp,
    COUNT(*) as total_palpites
FROM "Palpite" p
JOIN "Jogo" j ON p."jogoId" = j.id
WHERE j."concursoId" = (SELECT id FROM "Concurso" WHERE numero = 1)
AND nome LIKE 'Fernanda%'
GROUP BY nome, whatsapp
ORDER BY nome;
