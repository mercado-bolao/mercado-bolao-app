
-- Script para corrigir os palpites do concurso 01 com os dados corretos fornecidos
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
    
    -- 3. Deletar palpites existentes
    DELETE FROM "Palpite" WHERE "concursoId" = concurso_01_id;
    RAISE NOTICE '🧹 Palpites antigos removidos!';
    
    -- 4. Inserir palpites corretos conforme lista (22 apostadores x 8 jogos = 176 palpites)
    
    -- 1. Alexandre Ferraz - C,F,C,C,C,C,C,C
    FOR jogo_num IN 1..8 LOOP
        INSERT INTO "Palpite" ("id", "nome", "whatsapp", "resultado", "jogoId", "concursoId", "createdAt") 
        VALUES (
            gen_random_uuid()::text,
            'Alexandre Ferraz',
            '+5571992952233',
            CASE jogo_num 
                WHEN 1 THEN '1' WHEN 2 THEN '2' WHEN 3 THEN '1' WHEN 4 THEN '1'
                WHEN 5 THEN '1' WHEN 6 THEN '1' WHEN 7 THEN '1' WHEN 8 THEN '1'
            END,
            jogo_ids[jogo_num],
            concurso_01_id,
            '2025-01-28 10:00:00'::timestamp + (interval '1 minute' * jogo_num)
        );
    END LOOP;

    -- 2. An Beatriz Pereira Rufino - F,C,F,C,F,C,C,F
    FOR jogo_num IN 1..8 LOOP
        INSERT INTO "Palpite" ("id", "nome", "whatsapp", "resultado", "jogoId", "concursoId", "createdAt") 
        VALUES (
            gen_random_uuid()::text,
            'An Beatriz Pereira Rufino',
            '+5581995898296',
            CASE jogo_num 
                WHEN 1 THEN '2' WHEN 2 THEN '1' WHEN 3 THEN '2' WHEN 4 THEN '1'
                WHEN 5 THEN '2' WHEN 6 THEN '1' WHEN 7 THEN '1' WHEN 8 THEN '2'
            END,
            jogo_ids[jogo_num],
            concurso_01_id,
            '2025-01-28 10:10:00'::timestamp + (interval '1 minute' * jogo_num)
        );
    END LOOP;

    -- 3. Beuno Henrique - F,F,C,C,F,C,C,C
    FOR jogo_num IN 1..8 LOOP
        INSERT INTO "Palpite" ("id", "nome", "whatsapp", "resultado", "jogoId", "concursoId", "createdAt") 
        VALUES (
            gen_random_uuid()::text,
            'Beuno Henrique',
            '+5581979140390',
            CASE jogo_num 
                WHEN 1 THEN '2' WHEN 2 THEN '2' WHEN 3 THEN '1' WHEN 4 THEN '1'
                WHEN 5 THEN '2' WHEN 6 THEN '1' WHEN 7 THEN '1' WHEN 8 THEN '1'
            END,
            jogo_ids[jogo_num],
            concurso_01_id,
            '2025-01-28 10:20:00'::timestamp + (interval '1 minute' * jogo_num)
        );
    END LOOP;

    -- 4. Cabeca (primeiro) - C,E,C,F,F,C,C,E
    FOR jogo_num IN 1..8 LOOP
        INSERT INTO "Palpite" ("id", "nome", "whatsapp", "resultado", "jogoId", "concursoId", "createdAt") 
        VALUES (
            gen_random_uuid()::text,
            'Cabeca',
            '+5577965322258',
            CASE jogo_num 
                WHEN 1 THEN '1' WHEN 2 THEN 'X' WHEN 3 THEN '1' WHEN 4 THEN '2'
                WHEN 5 THEN '2' WHEN 6 THEN '1' WHEN 7 THEN '1' WHEN 8 THEN 'X'
            END,
            jogo_ids[jogo_num],
            concurso_01_id,
            '2025-01-28 10:30:00'::timestamp + (interval '1 minute' * jogo_num)
        );
    END LOOP;

    -- 5. Cabeca (segundo) - F,E,E,F,E,F,F,C
    FOR jogo_num IN 1..8 LOOP
        INSERT INTO "Palpite" ("id", "nome", "whatsapp", "resultado", "jogoId", "concursoId", "createdAt") 
        VALUES (
            gen_random_uuid()::text,
            'Cabeca 2',
            '+5577988563186',
            CASE jogo_num 
                WHEN 1 THEN '2' WHEN 2 THEN 'X' WHEN 3 THEN 'X' WHEN 4 THEN '2'
                WHEN 5 THEN 'X' WHEN 6 THEN '2' WHEN 7 THEN '2' WHEN 8 THEN '1'
            END,
            jogo_ids[jogo_num],
            concurso_01_id,
            '2025-01-28 10:40:00'::timestamp + (interval '1 minute' * jogo_num)
        );
    END LOOP;

    -- 6. Caio Luís Cardoso de Oliveira - C,F,F,C,C,C,C,C
    FOR jogo_num IN 1..8 LOOP
        INSERT INTO "Palpite" ("id", "nome", "whatsapp", "resultado", "jogoId", "concursoId", "createdAt") 
        VALUES (
            gen_random_uuid()::text,
            'Caio Luís Cardoso de Oliveira',
            '+5571988270974',
            CASE jogo_num 
                WHEN 1 THEN '1' WHEN 2 THEN '2' WHEN 3 THEN '2' WHEN 4 THEN '1'
                WHEN 5 THEN '1' WHEN 6 THEN '1' WHEN 7 THEN '1' WHEN 8 THEN '1'
            END,
            jogo_ids[jogo_num],
            concurso_01_id,
            '2025-01-28 10:50:00'::timestamp + (interval '1 minute' * jogo_num)
        );
    END LOOP;

    -- 7. Fabio Santos Munhoz - E,F,F,C,C,C,C,C
    FOR jogo_num IN 1..8 LOOP
        INSERT INTO "Palpite" ("id", "nome", "whatsapp", "resultado", "jogoId", "concursoId", "createdAt") 
        VALUES (
            gen_random_uuid()::text,
            'Fabio Santos Munhoz',
            '+5571992823846',
            CASE jogo_num 
                WHEN 1 THEN 'X' WHEN 2 THEN '2' WHEN 3 THEN '2' WHEN 4 THEN '1'
                WHEN 5 THEN '1' WHEN 6 THEN '1' WHEN 7 THEN '1' WHEN 8 THEN '1'
            END,
            jogo_ids[jogo_num],
            concurso_01_id,
            '2025-01-28 11:00:00'::timestamp + (interval '1 minute' * jogo_num)
        );
    END LOOP;

    -- 8. Flavio Bianor - C,F,F,C,F,C,C,C
    FOR jogo_num IN 1..8 LOOP
        INSERT INTO "Palpite" ("id", "nome", "whatsapp", "resultado", "jogoId", "concursoId", "createdAt") 
        VALUES (
            gen_random_uuid()::text,
            'Flavio Bianor',
            '+5571992905152',
            CASE jogo_num 
                WHEN 1 THEN '1' WHEN 2 THEN '2' WHEN 3 THEN '2' WHEN 4 THEN '1'
                WHEN 5 THEN '2' WHEN 6 THEN '1' WHEN 7 THEN '1' WHEN 8 THEN '1'
            END,
            jogo_ids[jogo_num],
            concurso_01_id,
            '2025-01-28 11:10:00'::timestamp + (interval '1 minute' * jogo_num)
        );
    END LOOP;

    -- 9. Francisco Bizerra Rufino Neto - C,F,F,C,C,C,C,C
    FOR jogo_num IN 1..8 LOOP
        INSERT INTO "Palpite" ("id", "nome", "whatsapp", "resultado", "jogoId", "concursoId", "createdAt") 
        VALUES (
            gen_random_uuid()::text,
            'Francisco Bizerra Rufino Neto',
            '+5581981676658',
            CASE jogo_num 
                WHEN 1 THEN '1' WHEN 2 THEN '2' WHEN 3 THEN '2' WHEN 4 THEN '1'
                WHEN 5 THEN '1' WHEN 6 THEN '1' WHEN 7 THEN '1' WHEN 8 THEN '1'
            END,
            jogo_ids[jogo_num],
            concurso_01_id,
            '2025-01-28 11:20:00'::timestamp + (interval '1 minute' * jogo_num)
        );
    END LOOP;

    -- 10. gabriel cedraz - F,C,F,C,F,C,F,C
    FOR jogo_num IN 1..8 LOOP
        INSERT INTO "Palpite" ("id", "nome", "whatsapp", "resultado", "jogoId", "concursoId", "createdAt") 
        VALUES (
            gen_random_uuid()::text,
            'gabriel cedraz',
            '+5571991747951',
            CASE jogo_num 
                WHEN 1 THEN '2' WHEN 2 THEN '1' WHEN 3 THEN '2' WHEN 4 THEN '1'
                WHEN 5 THEN '2' WHEN 6 THEN '1' WHEN 7 THEN '2' WHEN 8 THEN '1'
            END,
            jogo_ids[jogo_num],
            concurso_01_id,
            '2025-01-28 11:30:00'::timestamp + (interval '1 minute' * jogo_num)
        );
    END LOOP;

    -- 11. Guilherme Guimaraes - C,C,F,C,C,C,C,C
    FOR jogo_num IN 1..8 LOOP
        INSERT INTO "Palpite" ("id", "nome", "whatsapp", "resultado", "jogoId", "concursoId", "createdAt") 
        VALUES (
            gen_random_uuid()::text,
            'Guilherme Guimaraes',
            '+5581981179564',
            CASE jogo_num 
                WHEN 1 THEN '1' WHEN 2 THEN '1' WHEN 3 THEN '2' WHEN 4 THEN '1'
                WHEN 5 THEN '1' WHEN 6 THEN '1' WHEN 7 THEN '1' WHEN 8 THEN '1'
            END,
            jogo_ids[jogo_num],
            concurso_01_id,
            '2025-01-28 11:40:00'::timestamp + (interval '1 minute' * jogo_num)
        );
    END LOOP;

    -- 12. João - C,E,F,C,C,C,C,F
    FOR jogo_num IN 1..8 LOOP
        INSERT INTO "Palpite" ("id", "nome", "whatsapp", "resultado", "jogoId", "concursoId", "createdAt") 
        VALUES (
            gen_random_uuid()::text,
            'João',
            '+5571993166660',
            CASE jogo_num 
                WHEN 1 THEN '1' WHEN 2 THEN 'X' WHEN 3 THEN '2' WHEN 4 THEN '1'
                WHEN 5 THEN '1' WHEN 6 THEN '1' WHEN 7 THEN '1' WHEN 8 THEN '2'
            END,
            jogo_ids[jogo_num],
            concurso_01_id,
            '2025-01-28 11:50:00'::timestamp + (interval '1 minute' * jogo_num)
        );
    END LOOP;

    -- 13. João Marcelo de Alencar Guimarães - C,F,F,C,C,C,C,C
    FOR jogo_num IN 1..8 LOOP
        INSERT INTO "Palpite" ("id", "nome", "whatsapp", "resultado", "jogoId", "concursoId", "createdAt") 
        VALUES (
            gen_random_uuid()::text,
            'João Marcelo de Alencar Guimarães',
            '+5571991878789',
            CASE jogo_num 
                WHEN 1 THEN '1' WHEN 2 THEN '2' WHEN 3 THEN '2' WHEN 4 THEN '1'
                WHEN 5 THEN '1' WHEN 6 THEN '1' WHEN 7 THEN '1' WHEN 8 THEN '1'
            END,
            jogo_ids[jogo_num],
            concurso_01_id,
            '2025-01-28 12:00:00'::timestamp + (interval '1 minute' * jogo_num)
        );
    END LOOP;

    -- 14. Moreno Sesti Paz Fiusa de Almeida - E,F,C,C,E,C,C,C
    FOR jogo_num IN 1..8 LOOP
        INSERT INTO "Palpite" ("id", "nome", "whatsapp", "resultado", "jogoId", "concursoId", "createdAt") 
        VALUES (
            gen_random_uuid()::text,
            'Moreno Sesti Paz Fiusa de Almeida',
            '+5571981676313',
            CASE jogo_num 
                WHEN 1 THEN 'X' WHEN 2 THEN '2' WHEN 3 THEN '1' WHEN 4 THEN '1'
                WHEN 5 THEN 'X' WHEN 6 THEN '1' WHEN 7 THEN '1' WHEN 8 THEN '1'
            END,
            jogo_ids[jogo_num],
            concurso_01_id,
            '2025-01-28 12:10:00'::timestamp + (interval '1 minute' * jogo_num)
        );
    END LOOP;

    -- 15. Neto Ruiz - E,F,F,C,C,C,C,C
    FOR jogo_num IN 1..8 LOOP
        INSERT INTO "Palpite" ("id", "nome", "whatsapp", "resultado", "jogoId", "concursoId", "createdAt") 
        VALUES (
            gen_random_uuid()::text,
            'Neto Ruiz',
            '+5581996952322',
            CASE jogo_num 
                WHEN 1 THEN 'X' WHEN 2 THEN '2' WHEN 3 THEN '2' WHEN 4 THEN '1'
                WHEN 5 THEN '1' WHEN 6 THEN '1' WHEN 7 THEN '1' WHEN 8 THEN '1'
            END,
            jogo_ids[jogo_num],
            concurso_01_id,
            '2025-01-28 12:20:00'::timestamp + (interval '1 minute' * jogo_num)
        );
    END LOOP;

    -- 16. Pepeu - C,E,C,C,F,C,C,E
    FOR jogo_num IN 1..8 LOOP
        INSERT INTO "Palpite" ("id", "nome", "whatsapp", "resultado", "jogoId", "concursoId", "createdAt") 
        VALUES (
            gen_random_uuid()::text,
            'Pepeu',
            '+5571993573770',
            CASE jogo_num 
                WHEN 1 THEN '1' WHEN 2 THEN 'X' WHEN 3 THEN '1' WHEN 4 THEN '1'
                WHEN 5 THEN '2' WHEN 6 THEN '1' WHEN 7 THEN '1' WHEN 8 THEN 'X'
            END,
            jogo_ids[jogo_num],
            concurso_01_id,
            '2025-01-28 12:30:00'::timestamp + (interval '1 minute' * jogo_num)
        );
    END LOOP;

    -- 17. Rafael Amoedo - C,F,E,C,C,C,C,C
    FOR jogo_num IN 1..8 LOOP
        INSERT INTO "Palpite" ("id", "nome", "whatsapp", "resultado", "jogoId", "concursoId", "createdAt") 
        VALUES (
            gen_random_uuid()::text,
            'Rafael Amoedo',
            '+5571992592112',
            CASE jogo_num 
                WHEN 1 THEN '1' WHEN 2 THEN '2' WHEN 3 THEN 'X' WHEN 4 THEN '1'
                WHEN 5 THEN '1' WHEN 6 THEN '1' WHEN 7 THEN '1' WHEN 8 THEN '1'
            END,
            jogo_ids[jogo_num],
            concurso_01_id,
            '2025-01-28 12:40:00'::timestamp + (interval '1 minute' * jogo_num)
        );
    END LOOP;

    -- 18. Renato Prazeres - F,F,E,C,E,C,C,F
    FOR jogo_num IN 1..8 LOOP
        INSERT INTO "Palpite" ("id", "nome", "whatsapp", "resultado", "jogoId", "concursoId", "createdAt") 
        VALUES (
            gen_random_uuid()::text,
            'Renato Prazeres',
            '+5571994169524',
            CASE jogo_num 
                WHEN 1 THEN '2' WHEN 2 THEN '2' WHEN 3 THEN 'X' WHEN 4 THEN '1'
                WHEN 5 THEN 'X' WHEN 6 THEN '1' WHEN 7 THEN '1' WHEN 8 THEN '2'
            END,
            jogo_ids[jogo_num],
            concurso_01_id,
            '2025-01-28 12:50:00'::timestamp + (interval '1 minute' * jogo_num)
        );
    END LOOP;

    -- 19. Ricardo Sanches - F,C,C,C,F,C,C,E
    FOR jogo_num IN 1..8 LOOP
        INSERT INTO "Palpite" ("id", "nome", "whatsapp", "resultado", "jogoId", "concursoId", "createdAt") 
        VALUES (
            gen_random_uuid()::text,
            'Ricardo Sanches',
            '+5571993035786',
            CASE jogo_num 
                WHEN 1 THEN '2' WHEN 2 THEN '1' WHEN 3 THEN '1' WHEN 4 THEN '1'
                WHEN 5 THEN '2' WHEN 6 THEN '1' WHEN 7 THEN '1' WHEN 8 THEN 'X'
            END,
            jogo_ids[jogo_num],
            concurso_01_id,
            '2025-01-28 13:00:00'::timestamp + (interval '1 minute' * jogo_num)
        );
    END LOOP;

    -- 20. Rodrigo Prado Nunes - F,F,F,C,E,C,C,C
    FOR jogo_num IN 1..8 LOOP
        INSERT INTO "Palpite" ("id", "nome", "whatsapp", "resultado", "jogoId", "concursoId", "createdAt") 
        VALUES (
            gen_random_uuid()::text,
            'Rodrigo Prado Nunes',
            '+5571981543433',
            CASE jogo_num 
                WHEN 1 THEN '2' WHEN 2 THEN '2' WHEN 3 THEN '2' WHEN 4 THEN '1'
                WHEN 5 THEN 'X' WHEN 6 THEN '1' WHEN 7 THEN '1' WHEN 8 THEN '1'
            END,
            jogo_ids[jogo_num],
            concurso_01_id,
            '2025-01-28 13:10:00'::timestamp + (interval '1 minute' * jogo_num)
        );
    END LOOP;

    -- 21. Sergio Sanches - C,C,F,C,C,C,C,C
    FOR jogo_num IN 1..8 LOOP
        INSERT INTO "Palpite" ("id", "nome", "whatsapp", "resultado", "jogoId", "concursoId", "createdAt") 
        VALUES (
            gen_random_uuid()::text,
            'Sergio Sanches',
            '+5571988046197',
            CASE jogo_num 
                WHEN 1 THEN '1' WHEN 2 THEN '1' WHEN 3 THEN '2' WHEN 4 THEN '1'
                WHEN 5 THEN '1' WHEN 6 THEN '1' WHEN 7 THEN '1' WHEN 8 THEN '1'
            END,
            jogo_ids[jogo_num],
            concurso_01_id,
            '2025-01-28 13:20:00'::timestamp + (interval '1 minute' * jogo_num)
        );
    END LOOP;

    -- 22. Tawan correia - F,F,C,C,C,C,C,C
    FOR jogo_num IN 1..8 LOOP
        INSERT INTO "Palpite" ("id", "nome", "whatsapp", "resultado", "jogoId", "concursoId", "createdAt") 
        VALUES (
            gen_random_uuid()::text,
            'Tawan correia',
            '+5571999095268',
            CASE jogo_num 
                WHEN 1 THEN '2' WHEN 2 THEN '2' WHEN 3 THEN '1' WHEN 4 THEN '1'
                WHEN 5 THEN '1' WHEN 6 THEN '1' WHEN 7 THEN '1' WHEN 8 THEN '1'
            END,
            jogo_ids[jogo_num],
            concurso_01_id,
            '2025-01-28 13:30:00'::timestamp + (interval '1 minute' * jogo_num)
        );
    END LOOP;

    -- Contar total inserido
    SELECT COUNT(*) INTO total_inseridos FROM "Palpite" WHERE "concursoId" = concurso_01_id;
    
    RAISE NOTICE '✅ Palpites corrigidos com sucesso!';
    RAISE NOTICE '📊 Total de palpites inseridos: %', total_inseridos;
    RAISE NOTICE '👥 Apostadores: 22';
    RAISE NOTICE '🎯 Jogos: 8';
    RAISE NOTICE '🎮 Esperado: 176 palpites (22 x 8)';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro durante execução: %', SQLERRM;
END $$;

-- Verificar se os palpites foram corrigidos
SELECT 
    COUNT(*) as total_palpites_concurso_01,
    COUNT(DISTINCT nome) as apostadores_unicos,
    COUNT(*) / COUNT(DISTINCT nome) as palpites_por_apostador
FROM "Palpite" p
JOIN "Jogo" j ON p."jogoId" = j.id
WHERE j."concursoId" = (SELECT id FROM "Concurso" WHERE numero = 1);
