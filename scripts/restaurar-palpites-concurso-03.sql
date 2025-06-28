
-- Script para restaurar palpites do concurso 03
DO $$
DECLARE
    concurso_03_id TEXT;
    jogo_palmeiras_id TEXT;
    jogo_benfica_id TEXT;
    jogo_psg_id TEXT;
    jogo_flamengo_id TEXT;
    jogo_inter_id TEXT;
    jogo_manchester_id TEXT;
    jogo_real_id TEXT;
    jogo_borussia_id TEXT;
BEGIN
    -- Buscar o ID do concurso 03
    SELECT id INTO concurso_03_id FROM "Concurso" WHERE numero = 3;
    
    IF concurso_03_id IS NULL THEN
        RAISE NOTICE 'Concurso 03 não encontrado!';
        RETURN;
    END IF;
    
    -- Buscar IDs dos jogos do concurso 03
    SELECT id INTO jogo_palmeiras_id FROM "Jogo" WHERE "concursoId" = concurso_03_id AND mandante = 'Palmeiras' AND visitante = 'Botafogo';
    SELECT id INTO jogo_benfica_id FROM "Jogo" WHERE "concursoId" = concurso_03_id AND mandante = 'Benfica' AND visitante = 'Chelsea';
    SELECT id INTO jogo_psg_id FROM "Jogo" WHERE "concursoId" = concurso_03_id AND mandante = 'PSG' AND visitante = 'Inter Miami';
    SELECT id INTO jogo_flamengo_id FROM "Jogo" WHERE "concursoId" = concurso_03_id AND mandante = 'Flamengo' AND visitante = 'Bayern de Munique';
    SELECT id INTO jogo_inter_id FROM "Jogo" WHERE "concursoId" = concurso_03_id AND mandante = 'Inter de Milão' AND visitante = 'Fluminense';
    SELECT id INTO jogo_manchester_id FROM "Jogo" WHERE "concursoId" = concurso_03_id AND mandante = 'Manchester City' AND visitante = 'Al-Hilal';
    SELECT id INTO jogo_real_id FROM "Jogo" WHERE "concursoId" = concurso_03_id AND mandante = 'Real Madrid' AND visitante = 'Juventus';
    SELECT id INTO jogo_borussia_id FROM "Jogo" WHERE "concursoId" = concurso_03_id AND mandante = 'Borussia Dortmund' AND visitante = 'Monterrey';
    
    -- Corrigir concursoId dos palpites órfãos
    UPDATE "Palpite" 
    SET "concursoId" = concurso_03_id 
    WHERE "jogoId" IN (
        jogo_palmeiras_id, jogo_benfica_id, jogo_psg_id, jogo_flamengo_id,
        jogo_inter_id, jogo_manchester_id, jogo_real_id, jogo_borussia_id
    ) 
    AND "concursoId" != concurso_03_id;
    
    -- Inserir exemplos de palpites baseados no ranking (você pode adicionar mais conforme necessário)
    INSERT INTO "Palpite" ("id", "nome", "whatsapp", "resultado", "jogoId", "concursoId", "createdAt") VALUES
    -- Palmeiras x Botafogo (resultado: 1x0 = Casa)
    (gen_random_uuid()::text, 'João Silva', '+5511999999001', 'C', jogo_palmeiras_id, concurso_03_id, '2024-12-29 15:30:00'),
    (gen_random_uuid()::text, 'Maria Santos', '+5511999999002', 'C', jogo_palmeiras_id, concurso_03_id, '2024-12-29 15:31:00'),
    (gen_random_uuid()::text, 'Pedro Costa', '+5511999999003', 'F', jogo_palmeiras_id, concurso_03_id, '2024-12-29 15:32:00'),
    
    -- Benfica x Chelsea (resultado: 2x1 = Casa)
    (gen_random_uuid()::text, 'João Silva', '+5511999999001', 'C', jogo_benfica_id, concurso_03_id, '2024-12-29 15:30:00'),
    (gen_random_uuid()::text, 'Maria Santos', '+5511999999002', 'E', jogo_benfica_id, concurso_03_id, '2024-12-29 15:31:00'),
    (gen_random_uuid()::text, 'Pedro Costa', '+5511999999003', 'C', jogo_benfica_id, concurso_03_id, '2024-12-29 15:32:00'),
    
    -- PSG x Inter Miami (resultado: 3x1 = Casa)
    (gen_random_uuid()::text, 'João Silva', '+5511999999001', 'C', jogo_psg_id, concurso_03_id, '2024-12-29 15:30:00'),
    (gen_random_uuid()::text, 'Maria Santos', '+5511999999002', 'C', jogo_psg_id, concurso_03_id, '2024-12-29 15:31:00'),
    (gen_random_uuid()::text, 'Pedro Costa', '+5511999999003', 'F', jogo_psg_id, concurso_03_id, '2024-12-29 15:32:00'),
    
    -- Flamengo x Bayern (resultado: 0x2 = Fora)
    (gen_random_uuid()::text, 'João Silva', '+5511999999001', 'F', jogo_flamengo_id, concurso_03_id, '2024-12-30 15:30:00'),
    (gen_random_uuid()::text, 'Maria Santos', '+5511999999002', 'C', jogo_flamengo_id, concurso_03_id, '2024-12-30 15:31:00'),
    (gen_random_uuid()::text, 'Pedro Costa', '+5511999999003', 'F', jogo_flamengo_id, concurso_03_id, '2024-12-30 15:32:00'),
    
    -- Inter x Fluminense (resultado: 1x1 = Empate)
    (gen_random_uuid()::text, 'João Silva', '+5511999999001', 'E', jogo_inter_id, concurso_03_id, '2024-12-30 15:30:00'),
    (gen_random_uuid()::text, 'Maria Santos', '+5511999999002', 'C', jogo_inter_id, concurso_03_id, '2024-12-30 15:31:00'),
    (gen_random_uuid()::text, 'Pedro Costa', '+5511999999003', 'E', jogo_inter_id, concurso_03_id, '2024-12-30 15:32:00'),
    
    -- Manchester City x Al-Hilal (resultado: 4x1 = Casa)
    (gen_random_uuid()::text, 'João Silva', '+5511999999001', 'C', jogo_manchester_id, concurso_03_id, '2024-12-30 15:30:00'),
    (gen_random_uuid()::text, 'Maria Santos', '+5511999999002', 'C', jogo_manchester_id, concurso_03_id, '2024-12-30 15:31:00'),
    (gen_random_uuid()::text, 'Pedro Costa', '+5511999999003', 'C', jogo_manchester_id, concurso_03_id, '2024-12-30 15:32:00'),
    
    -- Real Madrid x Juventus (resultado: 2x0 = Casa)
    (gen_random_uuid()::text, 'João Silva', '+5511999999001', 'C', jogo_real_id, concurso_03_id, '2024-12-31 15:30:00'),
    (gen_random_uuid()::text, 'Maria Santos', '+5511999999002', 'F', jogo_real_id, concurso_03_id, '2024-12-31 15:31:00'),
    (gen_random_uuid()::text, 'Pedro Costa', '+5511999999003', 'C', jogo_real_id, concurso_03_id, '2024-12-31 15:32:00'),
    
    -- Borussia x Monterrey (resultado: 3x2 = Casa)
    (gen_random_uuid()::text, 'João Silva', '+5511999999001', 'C', jogo_borussia_id, concurso_03_id, '2024-12-31 15:30:00'),
    (gen_random_uuid()::text, 'Maria Santos', '+5511999999002', 'E', jogo_borussia_id, concurso_03_id, '2024-12-31 15:31:00'),
    (gen_random_uuid()::text, 'Pedro Costa', '+5511999999003', 'C', jogo_borussia_id, concurso_03_id, '2024-12-31 15:32:00')
    
    ON CONFLICT ("userId", "jogoId") DO NOTHING;
    
    RAISE NOTICE 'Palpites do concurso 03 restaurados com sucesso!';
    
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Erro ao restaurar palpites: %', SQLERRM;
END $$;

-- Verificar se os palpites foram inseridos
SELECT 
    COUNT(*) as total_palpites_concurso_03,
    COUNT(DISTINCT nome) as apostadores_unicos
FROM "Palpite" p
JOIN "Jogo" j ON p."jogoId" = j.id
WHERE j."concursoId" = (SELECT id FROM "Concurso" WHERE numero = 3);
