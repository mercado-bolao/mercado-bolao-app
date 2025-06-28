
-- Script para adicionar palpites da Fernanda para todos os 10 jogos do concurso 01
DO $$
DECLARE
    concurso_01_id TEXT;
    jogo_ids TEXT[];
    user_fernanda_id TEXT;
BEGIN
    -- Buscar o ID do concurso 01
    SELECT id INTO concurso_01_id FROM "Concurso" WHERE numero = 1;
    
    IF concurso_01_id IS NULL THEN
        RAISE NOTICE '❌ Concurso 01 não encontrado!';
        RETURN;
    END IF;
    
    RAISE NOTICE '🔍 Concurso 01 encontrado: %', concurso_01_id;
    
    -- Buscar todos os IDs dos jogos do concurso 01 (devem ser 10 agora)
    SELECT array_agg(id ORDER BY "horario") INTO jogo_ids 
    FROM "Jogo" 
    WHERE "concursoId" = concurso_01_id;
    
    IF array_length(jogo_ids, 1) != 10 THEN
        RAISE NOTICE '❌ Esperado 10 jogos, encontrados: %', array_length(jogo_ids, 1);
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Encontrados 10 jogos!';
    
    -- Criar/encontrar usuário Fernanda
    INSERT INTO "User" ("id", "nome", "whatsapp") 
    VALUES (gen_random_uuid()::text, 'Fernanda', '81981170000')
    ON CONFLICT ("whatsapp") DO UPDATE SET "nome" = EXCLUDED."nome"
    RETURNING id INTO user_fernanda_id;
    
    RAISE NOTICE '👤 Usuário Fernanda: %', user_fernanda_id;
    
    -- Remover palpites antigos da Fernanda neste concurso
    DELETE FROM "Palpite" 
    WHERE "whatsapp" = '81981170000' 
    AND "concursoId" = concurso_01_id;
    
    RAISE NOTICE '🧹 Palpites antigos da Fernanda removidos!';
    
    -- Inserir primeira linha de palpites da Fernanda: F,C,F,C,F,C,C,C,F,F
    INSERT INTO "Palpite" ("id", "nome", "whatsapp", "resultado", "jogoId", "concursoId", "userId", "createdAt") 
    SELECT 
        gen_random_uuid()::text,
        'Fernanda',
        '81981170000',
        CASE jogo_num 
            WHEN 1 THEN 'F' WHEN 2 THEN 'C' WHEN 3 THEN 'F' WHEN 4 THEN 'C' WHEN 5 THEN 'F'
            WHEN 6 THEN 'C' WHEN 7 THEN 'C' WHEN 8 THEN 'C' WHEN 9 THEN 'F' WHEN 10 THEN 'F'
        END,
        jogo_ids[jogo_num],
        concurso_01_id,
        user_fernanda_id,
        NOW() + (jogo_num * interval '1 minute')
    FROM generate_series(1, 10) AS jogo_num;
    
    RAISE NOTICE '✅ Primeira linha de palpites da Fernanda inserida!';
    
    -- Como são 2 apostas diferentes, vamos criar um segundo usuário "Fernanda 2"
    INSERT INTO "User" ("id", "nome", "whatsapp") 
    VALUES (gen_random_uuid()::text, 'Fernanda 2', '81981170001')
    ON CONFLICT ("whatsapp") DO NOTHING;
    
    -- Inserir segunda linha de palpites: F,F,C,F,C,F,F,F,C,C
    INSERT INTO "Palpite" ("id", "nome", "whatsapp", "resultado", "jogoId", "concursoId", "userId", "createdAt") 
    SELECT 
        gen_random_uuid()::text,
        'Fernanda 2',
        '81981170001',
        CASE jogo_num 
            WHEN 1 THEN 'F' WHEN 2 THEN 'F' WHEN 3 THEN 'C' WHEN 4 THEN 'F' WHEN 5 THEN 'C'
            WHEN 6 THEN 'F' WHEN 7 THEN 'F' WHEN 8 THEN 'F' WHEN 9 THEN 'C' WHEN 10 THEN 'C'
        END,
        jogo_ids[jogo_num],
        concurso_01_id,
        (SELECT id FROM "User" WHERE whatsapp = '81981170001'),
        NOW() + (jogo_num * interval '1 minute') + interval '30 minutes'
    FROM generate_series(1, 10) AS jogo_num;
    
    RAISE NOTICE '✅ Segunda linha de palpites da Fernanda inserida!';
    RAISE NOTICE '🎯 Total: 20 palpites adicionados (2 apostas x 10 jogos)';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro: %', SQLERRM;
END $$;

-- Verificação final
SELECT 
    COUNT(*) as total_palpites_fernanda,
    COUNT(DISTINCT nome) as linhas_diferentes
FROM "Palpite" p
JOIN "Jogo" j ON p."jogoId" = j.id
WHERE j."concursoId" = (SELECT id FROM "Concurso" WHERE numero = 1)
AND p.nome LIKE 'Fernanda%';
