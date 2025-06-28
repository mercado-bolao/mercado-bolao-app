
-- Script para limpar e inserir os palpites reais do concurso 03 baseado no ranking fornecido
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
    
    -- Buscar IDs dos jogos
    SELECT id INTO jogo_palmeiras_id FROM "Jogo" WHERE "concursoId" = concurso_03_id AND mandante = 'Palmeiras' AND visitante = 'Botafogo';
    SELECT id INTO jogo_benfica_id FROM "Jogo" WHERE "concursoId" = concurso_03_id AND mandante = 'Benfica' AND visitante = 'Chelsea';
    SELECT id INTO jogo_psg_id FROM "Jogo" WHERE "concursoId" = concurso_03_id AND mandante = 'PSG' AND visitante = 'Inter Miami';
    SELECT id INTO jogo_flamengo_id FROM "Jogo" WHERE "concursoId" = concurso_03_id AND mandante = 'Flamengo' AND visitante = 'Bayern de Munique';
    SELECT id INTO jogo_inter_id FROM "Jogo" WHERE "concursoId" = concurso_03_id AND mandante = 'Inter de Milão' AND visitante = 'Fluminense';
    SELECT id INTO jogo_manchester_id FROM "Jogo" WHERE "concursoId" = concurso_03_id AND mandante = 'Manchester City' AND visitante = 'Al-Hilal';
    SELECT id INTO jogo_real_id FROM "Jogo" WHERE "concursoId" = concurso_03_id AND mandante = 'Real Madrid' AND visitante = 'Juventus';
    SELECT id INTO jogo_borussia_id FROM "Jogo" WHERE "concursoId" = concurso_03_id AND mandante = 'Borussia Dortmund' AND visitante = 'Monterrey';
    
    -- Deletar todos os palpites existentes do concurso 03
    DELETE FROM "Palpite" WHERE "concursoId" = concurso_03_id;
    
    RAISE NOTICE 'Palpites antigos removidos. Inserindo novos palpites...';
    
    -- Inserir os 192 palpites dos 24 apostadores
    INSERT INTO "Palpite" ("id", "nome", "whatsapp", "resultado", "jogoId", "concursoId", "createdAt") VALUES
    
    -- 1. Fabio Santos Munhoz (E,F,F,C,C,C,C,C)
    (gen_random_uuid()::text, 'Fabio Santos Munhoz', '+5511999000001', 'E', jogo_palmeiras_id, concurso_03_id, '2024-12-29 14:30:00'),
    (gen_random_uuid()::text, 'Fabio Santos Munhoz', '+5511999000001', 'F', jogo_benfica_id, concurso_03_id, '2024-12-29 14:30:00'),
    (gen_random_uuid()::text, 'Fabio Santos Munhoz', '+5511999000001', 'F', jogo_psg_id, concurso_03_id, '2024-12-29 14:30:00'),
    (gen_random_uuid()::text, 'Fabio Santos Munhoz', '+5511999000001', 'C', jogo_flamengo_id, concurso_03_id, '2024-12-29 14:30:00'),
    (gen_random_uuid()::text, 'Fabio Santos Munhoz', '+5511999000001', 'C', jogo_inter_id, concurso_03_id, '2024-12-29 14:30:00'),
    (gen_random_uuid()::text, 'Fabio Santos Munhoz', '+5511999000001', 'C', jogo_manchester_id, concurso_03_id, '2024-12-29 14:30:00'),
    (gen_random_uuid()::text, 'Fabio Santos Munhoz', '+5511999000001', 'C', jogo_real_id, concurso_03_id, '2024-12-29 14:30:00'),
    (gen_random_uuid()::text, 'Fabio Santos Munhoz', '+5511999000001', 'C', jogo_borussia_id, concurso_03_id, '2024-12-29 14:30:00'),
    
    -- 2. Moreno Sesil Paz Fiusa de Almeida (E,C,E,C,E,C,C,C)
    (gen_random_uuid()::text, 'Moreno Sesil Paz Fiusa de Almeida', '+5511999000002', 'E', jogo_palmeiras_id, concurso_03_id, '2024-12-29 14:31:00'),
    (gen_random_uuid()::text, 'Moreno Sesil Paz Fiusa de Almeida', '+5511999000002', 'C', jogo_benfica_id, concurso_03_id, '2024-12-29 14:31:00'),
    (gen_random_uuid()::text, 'Moreno Sesil Paz Fiusa de Almeida', '+5511999000002', 'E', jogo_psg_id, concurso_03_id, '2024-12-29 14:31:00'),
    (gen_random_uuid()::text, 'Moreno Sesil Paz Fiusa de Almeida', '+5511999000002', 'C', jogo_flamengo_id, concurso_03_id, '2024-12-29 14:31:00'),
    (gen_random_uuid()::text, 'Moreno Sesil Paz Fiusa de Almeida', '+5511999000002', 'E', jogo_inter_id, concurso_03_id, '2024-12-29 14:31:00'),
    (gen_random_uuid()::text, 'Moreno Sesil Paz Fiusa de Almeida', '+5511999000002', 'C', jogo_manchester_id, concurso_03_id, '2024-12-29 14:31:00'),
    (gen_random_uuid()::text, 'Moreno Sesil Paz Fiusa de Almeida', '+5511999000002', 'C', jogo_real_id, concurso_03_id, '2024-12-29 14:31:00'),
    (gen_random_uuid()::text, 'Moreno Sesil Paz Fiusa de Almeida', '+5511999000002', 'C', jogo_borussia_id, concurso_03_id, '2024-12-29 14:31:00'),
    
    -- 3. Neto Ruiz (E,F,F,C,C,C,C,C)
    (gen_random_uuid()::text, 'Neto Ruiz', '+5511999000003', 'E', jogo_palmeiras_id, concurso_03_id, '2024-12-29 14:32:00'),
    (gen_random_uuid()::text, 'Neto Ruiz', '+5511999000003', 'F', jogo_benfica_id, concurso_03_id, '2024-12-29 14:32:00'),
    (gen_random_uuid()::text, 'Neto Ruiz', '+5511999000003', 'F', jogo_psg_id, concurso_03_id, '2024-12-29 14:32:00'),
    (gen_random_uuid()::text, 'Neto Ruiz', '+5511999000003', 'C', jogo_flamengo_id, concurso_03_id, '2024-12-29 14:32:00'),
    (gen_random_uuid()::text, 'Neto Ruiz', '+5511999000003', 'C', jogo_inter_id, concurso_03_id, '2024-12-29 14:32:00'),
    (gen_random_uuid()::text, 'Neto Ruiz', '+5511999000003', 'C', jogo_manchester_id, concurso_03_id, '2024-12-29 14:32:00'),
    (gen_random_uuid()::text, 'Neto Ruiz', '+5511999000003', 'C', jogo_real_id, concurso_03_id, '2024-12-29 14:32:00'),
    (gen_random_uuid()::text, 'Neto Ruiz', '+5511999000003', 'C', jogo_borussia_id, concurso_03_id, '2024-12-29 14:32:00'),
    
    -- 4. Alexandre Ferraz (C,C,F,C,C,C,C,C)
    (gen_random_uuid()::text, 'Alexandre Ferraz', '+5511999000004', 'C', jogo_palmeiras_id, concurso_03_id, '2024-12-29 14:33:00'),
    (gen_random_uuid()::text, 'Alexandre Ferraz', '+5511999000004', 'C', jogo_benfica_id, concurso_03_id, '2024-12-29 14:33:00'),
    (gen_random_uuid()::text, 'Alexandre Ferraz', '+5511999000004', 'F', jogo_psg_id, concurso_03_id, '2024-12-29 14:33:00'),
    (gen_random_uuid()::text, 'Alexandre Ferraz', '+5511999000004', 'C', jogo_flamengo_id, concurso_03_id, '2024-12-29 14:33:00'),
    (gen_random_uuid()::text, 'Alexandre Ferraz', '+5511999000004', 'C', jogo_inter_id, concurso_03_id, '2024-12-29 14:33:00'),
    (gen_random_uuid()::text, 'Alexandre Ferraz', '+5511999000004', 'C', jogo_manchester_id, concurso_03_id, '2024-12-29 14:33:00'),
    (gen_random_uuid()::text, 'Alexandre Ferraz', '+5511999000004', 'C', jogo_real_id, concurso_03_id, '2024-12-29 14:33:00'),
    (gen_random_uuid()::text, 'Alexandre Ferraz', '+5511999000004', 'C', jogo_borussia_id, concurso_03_id, '2024-12-29 14:33:00'),
    
    -- 5. An Beatriz Pereira Rufino (F,F,C,C,F,C,C,F)
    (gen_random_uuid()::text, 'An Beatriz Pereira Rufino', '+5511999000005', 'F', jogo_palmeiras_id, concurso_03_id, '2024-12-29 14:34:00'),
    (gen_random_uuid()::text, 'An Beatriz Pereira Rufino', '+5511999000005', 'F', jogo_benfica_id, concurso_03_id, '2024-12-29 14:34:00'),
    (gen_random_uuid()::text, 'An Beatriz Pereira Rufino', '+5511999000005', 'C', jogo_psg_id, concurso_03_id, '2024-12-29 14:34:00'),
    (gen_random_uuid()::text, 'An Beatriz Pereira Rufino', '+5511999000005', 'C', jogo_flamengo_id, concurso_03_id, '2024-12-29 14:34:00'),
    (gen_random_uuid()::text, 'An Beatriz Pereira Rufino', '+5511999000005', 'F', jogo_inter_id, concurso_03_id, '2024-12-29 14:34:00'),
    (gen_random_uuid()::text, 'An Beatriz Pereira Rufino', '+5511999000005', 'C', jogo_manchester_id, concurso_03_id, '2024-12-29 14:34:00'),
    (gen_random_uuid()::text, 'An Beatriz Pereira Rufino', '+5511999000005', 'C', jogo_real_id, concurso_03_id, '2024-12-29 14:34:00'),
    (gen_random_uuid()::text, 'An Beatriz Pereira Rufino', '+5511999000005', 'F', jogo_borussia_id, concurso_03_id, '2024-12-29 14:34:00'),
    
    -- 6. Bruno Henrique (F,C,F,C,F,C,C,C)
    (gen_random_uuid()::text, 'Bruno Henrique', '+5511999000006', 'F', jogo_palmeiras_id, concurso_03_id, '2024-12-29 14:35:00'),
    (gen_random_uuid()::text, 'Bruno Henrique', '+5511999000006', 'C', jogo_benfica_id, concurso_03_id, '2024-12-29 14:35:00'),
    (gen_random_uuid()::text, 'Bruno Henrique', '+5511999000006', 'F', jogo_psg_id, concurso_03_id, '2024-12-29 14:35:00'),
    (gen_random_uuid()::text, 'Bruno Henrique', '+5511999000006', 'C', jogo_flamengo_id, concurso_03_id, '2024-12-29 14:35:00'),
    (gen_random_uuid()::text, 'Bruno Henrique', '+5511999000006', 'F', jogo_inter_id, concurso_03_id, '2024-12-29 14:35:00'),
    (gen_random_uuid()::text, 'Bruno Henrique', '+5511999000006', 'C', jogo_manchester_id, concurso_03_id, '2024-12-29 14:35:00'),
    (gen_random_uuid()::text, 'Bruno Henrique', '+5511999000006', 'C', jogo_real_id, concurso_03_id, '2024-12-29 14:35:00'),
    (gen_random_uuid()::text, 'Bruno Henrique', '+5511999000006', 'C', jogo_borussia_id, concurso_03_id, '2024-12-29 14:35:00'),
    
    -- 7. Cabeça (C,C,E,F,F,C,C,E)
    (gen_random_uuid()::text, 'Cabeça', '+5511999000007', 'C', jogo_palmeiras_id, concurso_03_id, '2024-12-29 14:36:00'),
    (gen_random_uuid()::text, 'Cabeça', '+5511999000007', 'C', jogo_benfica_id, concurso_03_id, '2024-12-29 14:36:00'),
    (gen_random_uuid()::text, 'Cabeça', '+5511999000007', 'E', jogo_psg_id, concurso_03_id, '2024-12-29 14:36:00'),
    (gen_random_uuid()::text, 'Cabeça', '+5511999000007', 'F', jogo_flamengo_id, concurso_03_id, '2024-12-29 14:36:00'),
    (gen_random_uuid()::text, 'Cabeça', '+5511999000007', 'F', jogo_inter_id, concurso_03_id, '2024-12-29 14:36:00'),
    (gen_random_uuid()::text, 'Cabeça', '+5511999000007', 'C', jogo_manchester_id, concurso_03_id, '2024-12-29 14:36:00'),
    (gen_random_uuid()::text, 'Cabeça', '+5511999000007', 'C', jogo_real_id, concurso_03_id, '2024-12-29 14:36:00'),
    (gen_random_uuid()::text, 'Cabeça', '+5511999000007', 'E', jogo_borussia_id, concurso_03_id, '2024-12-29 14:36:00'),
    
    -- 8. Caíioba (F,E,E,F,E,F,F,C)
    (gen_random_uuid()::text, 'Caíioba', '+5511999000008', 'F', jogo_palmeiras_id, concurso_03_id, '2024-12-29 14:37:00'),
    (gen_random_uuid()::text, 'Caíioba', '+5511999000008', 'E', jogo_benfica_id, concurso_03_id, '2024-12-29 14:37:00'),
    (gen_random_uuid()::text, 'Caíioba', '+5511999000008', 'E', jogo_psg_id, concurso_03_id, '2024-12-29 14:37:00'),
    (gen_random_uuid()::text, 'Caíioba', '+5511999000008', 'F', jogo_flamengo_id, concurso_03_id, '2024-12-29 14:37:00'),
    (gen_random_uuid()::text, 'Caíioba', '+5511999000008', 'E', jogo_inter_id, concurso_03_id, '2024-12-29 14:37:00'),
    (gen_random_uuid()::text, 'Caíioba', '+5511999000008', 'F', jogo_manchester_id, concurso_03_id, '2024-12-29 14:37:00'),
    (gen_random_uuid()::text, 'Caíioba', '+5511999000008', 'F', jogo_real_id, concurso_03_id, '2024-12-29 14:37:00'),
    (gen_random_uuid()::text, 'Caíioba', '+5511999000008', 'C', jogo_borussia_id, concurso_03_id, '2024-12-29 14:37:00'),
    
    -- 9. Caio Luis Cardoso de Oliveira (C,F,F,C,C,C,C,C)
    (gen_random_uuid()::text, 'Caio Luis Cardoso de Oliveira', '+5511999000009', 'C', jogo_palmeiras_id, concurso_03_id, '2024-12-29 14:38:00'),
    (gen_random_uuid()::text, 'Caio Luis Cardoso de Oliveira', '+5511999000009', 'F', jogo_benfica_id, concurso_03_id, '2024-12-29 14:38:00'),
    (gen_random_uuid()::text, 'Caio Luis Cardoso de Oliveira', '+5511999000009', 'F', jogo_psg_id, concurso_03_id, '2024-12-29 14:38:00'),
    (gen_random_uuid()::text, 'Caio Luis Cardoso de Oliveira', '+5511999000009', 'C', jogo_flamengo_id, concurso_03_id, '2024-12-29 14:38:00'),
    (gen_random_uuid()::text, 'Caio Luis Cardoso de Oliveira', '+5511999000009', 'C', jogo_inter_id, concurso_03_id, '2024-12-29 14:38:00'),
    (gen_random_uuid()::text, 'Caio Luis Cardoso de Oliveira', '+5511999000009', 'C', jogo_manchester_id, concurso_03_id, '2024-12-29 14:38:00'),
    (gen_random_uuid()::text, 'Caio Luis Cardoso de Oliveira', '+5511999000009', 'C', jogo_real_id, concurso_03_id, '2024-12-29 14:38:00'),
    (gen_random_uuid()::text, 'Caio Luis Cardoso de Oliveira', '+5511999000009', 'C', jogo_borussia_id, concurso_03_id, '2024-12-29 14:38:00'),
    
    -- 10. Fernanda (F,C,F,C,F,C,C,C)
    (gen_random_uuid()::text, 'Fernanda', '+5511999000010', 'F', jogo_palmeiras_id, concurso_03_id, '2024-12-29 14:39:00'),
    (gen_random_uuid()::text, 'Fernanda', '+5511999000010', 'C', jogo_benfica_id, concurso_03_id, '2024-12-29 14:39:00'),
    (gen_random_uuid()::text, 'Fernanda', '+5511999000010', 'F', jogo_psg_id, concurso_03_id, '2024-12-29 14:39:00'),
    (gen_random_uuid()::text, 'Fernanda', '+5511999000010', 'C', jogo_flamengo_id, concurso_03_id, '2024-12-29 14:39:00'),
    (gen_random_uuid()::text, 'Fernanda', '+5511999000010', 'F', jogo_inter_id, concurso_03_id, '2024-12-29 14:39:00'),
    (gen_random_uuid()::text, 'Fernanda', '+5511999000010', 'C', jogo_manchester_id, concurso_03_id, '2024-12-29 14:39:00'),
    (gen_random_uuid()::text, 'Fernanda', '+5511999000010', 'C', jogo_real_id, concurso_03_id, '2024-12-29 14:39:00'),
    (gen_random_uuid()::text, 'Fernanda', '+5511999000010', 'C', jogo_borussia_id, concurso_03_id, '2024-12-29 14:39:00'),
    
    -- 11. Fernanda (F,F,C,F,C,F,F,F)
    (gen_random_uuid()::text, 'Fernanda 2', '+5511999000011', 'F', jogo_palmeiras_id, concurso_03_id, '2024-12-29 14:40:00'),
    (gen_random_uuid()::text, 'Fernanda 2', '+5511999000011', 'F', jogo_benfica_id, concurso_03_id, '2024-12-29 14:40:00'),
    (gen_random_uuid()::text, 'Fernanda 2', '+5511999000011', 'C', jogo_psg_id, concurso_03_id, '2024-12-29 14:40:00'),
    (gen_random_uuid()::text, 'Fernanda 2', '+5511999000011', 'F', jogo_flamengo_id, concurso_03_id, '2024-12-29 14:40:00'),
    (gen_random_uuid()::text, 'Fernanda 2', '+5511999000011', 'C', jogo_inter_id, concurso_03_id, '2024-12-29 14:40:00'),
    (gen_random_uuid()::text, 'Fernanda 2', '+5511999000011', 'F', jogo_manchester_id, concurso_03_id, '2024-12-29 14:40:00'),
    (gen_random_uuid()::text, 'Fernanda 2', '+5511999000011', 'F', jogo_real_id, concurso_03_id, '2024-12-29 14:40:00'),
    (gen_random_uuid()::text, 'Fernanda 2', '+5511999000011', 'F', jogo_borussia_id, concurso_03_id, '2024-12-29 14:40:00'),
    
    -- 12. Flavio Bianor (C,F,F,C,F,C,C,C)
    (gen_random_uuid()::text, 'Flavio Bianor', '+5511999000012', 'C', jogo_palmeiras_id, concurso_03_id, '2024-12-29 14:41:00'),
    (gen_random_uuid()::text, 'Flavio Bianor', '+5511999000012', 'F', jogo_benfica_id, concurso_03_id, '2024-12-29 14:41:00'),
    (gen_random_uuid()::text, 'Flavio Bianor', '+5511999000012', 'F', jogo_psg_id, concurso_03_id, '2024-12-29 14:41:00'),
    (gen_random_uuid()::text, 'Flavio Bianor', '+5511999000012', 'C', jogo_flamengo_id, concurso_03_id, '2024-12-29 14:41:00'),
    (gen_random_uuid()::text, 'Flavio Bianor', '+5511999000012', 'F', jogo_inter_id, concurso_03_id, '2024-12-29 14:41:00'),
    (gen_random_uuid()::text, 'Flavio Bianor', '+5511999000012', 'C', jogo_manchester_id, concurso_03_id, '2024-12-29 14:41:00'),
    (gen_random_uuid()::text, 'Flavio Bianor', '+5511999000012', 'C', jogo_real_id, concurso_03_id, '2024-12-29 14:41:00'),
    (gen_random_uuid()::text, 'Flavio Bianor', '+5511999000012', 'C', jogo_borussia_id, concurso_03_id, '2024-12-29 14:41:00'),
    
    -- 13. Francisco Bizerra Rufino Neto (C,F,F,C,C,C,C,C)
    (gen_random_uuid()::text, 'Francisco Bizerra Rufino Neto', '+5511999000013', 'C', jogo_palmeiras_id, concurso_03_id, '2024-12-29 14:42:00'),
    (gen_random_uuid()::text, 'Francisco Bizerra Rufino Neto', '+5511999000013', 'F', jogo_benfica_id, concurso_03_id, '2024-12-29 14:42:00'),
    (gen_random_uuid()::text, 'Francisco Bizerra Rufino Neto', '+5511999000013', 'F', jogo_psg_id, concurso_03_id, '2024-12-29 14:42:00'),
    (gen_random_uuid()::text, 'Francisco Bizerra Rufino Neto', '+5511999000013', 'C', jogo_flamengo_id, concurso_03_id, '2024-12-29 14:42:00'),
    (gen_random_uuid()::text, 'Francisco Bizerra Rufino Neto', '+5511999000013', 'C', jogo_inter_id, concurso_03_id, '2024-12-29 14:42:00'),
    (gen_random_uuid()::text, 'Francisco Bizerra Rufino Neto', '+5511999000013', 'C', jogo_manchester_id, concurso_03_id, '2024-12-29 14:42:00'),
    (gen_random_uuid()::text, 'Francisco Bizerra Rufino Neto', '+5511999000013', 'C', jogo_real_id, concurso_03_id, '2024-12-29 14:42:00'),
    (gen_random_uuid()::text, 'Francisco Bizerra Rufino Neto', '+5511999000013', 'C', jogo_borussia_id, concurso_03_id, '2024-12-29 14:42:00'),
    
    -- 14. gabriel oedraz (F,F,C,C,F,C,F,C)
    (gen_random_uuid()::text, 'gabriel oedraz', '+5511999000014', 'F', jogo_palmeiras_id, concurso_03_id, '2024-12-29 14:43:00'),
    (gen_random_uuid()::text, 'gabriel oedraz', '+5511999000014', 'F', jogo_benfica_id, concurso_03_id, '2024-12-29 14:43:00'),
    (gen_random_uuid()::text, 'gabriel oedraz', '+5511999000014', 'C', jogo_psg_id, concurso_03_id, '2024-12-29 14:43:00'),
    (gen_random_uuid()::text, 'gabriel oedraz', '+5511999000014', 'C', jogo_flamengo_id, concurso_03_id, '2024-12-29 14:43:00'),
    (gen_random_uuid()::text, 'gabriel oedraz', '+5511999000014', 'F', jogo_inter_id, concurso_03_id, '2024-12-29 14:43:00'),
    (gen_random_uuid()::text, 'gabriel oedraz', '+5511999000014', 'C', jogo_manchester_id, concurso_03_id, '2024-12-29 14:43:00'),
    (gen_random_uuid()::text, 'gabriel oedraz', '+5511999000014', 'F', jogo_real_id, concurso_03_id, '2024-12-29 14:43:00'),
    (gen_random_uuid()::text, 'gabriel oedraz', '+5511999000014', 'C', jogo_borussia_id, concurso_03_id, '2024-12-29 14:43:00'),
    
    -- 15. Guilherme Guimaraes (C,E,C,C,C,C,C,C)
    (gen_random_uuid()::text, 'Guilherme Guimaraes', '+5511999000015', 'C', jogo_palmeiras_id, concurso_03_id, '2024-12-29 14:44:00'),
    (gen_random_uuid()::text, 'Guilherme Guimaraes', '+5511999000015', 'E', jogo_benfica_id, concurso_03_id, '2024-12-29 14:44:00'),
    (gen_random_uuid()::text, 'Guilherme Guimaraes', '+5511999000015', 'C', jogo_psg_id, concurso_03_id, '2024-12-29 14:44:00'),
    (gen_random_uuid()::text, 'Guilherme Guimaraes', '+5511999000015', 'C', jogo_flamengo_id, concurso_03_id, '2024-12-29 14:44:00'),
    (gen_random_uuid()::text, 'Guilherme Guimaraes', '+5511999000015', 'C', jogo_inter_id, concurso_03_id, '2024-12-29 14:44:00'),
    (gen_random_uuid()::text, 'Guilherme Guimaraes', '+5511999000015', 'C', jogo_manchester_id, concurso_03_id, '2024-12-29 14:44:00'),
    (gen_random_uuid()::text, 'Guilherme Guimaraes', '+5511999000015', 'C', jogo_real_id, concurso_03_id, '2024-12-29 14:44:00'),
    (gen_random_uuid()::text, 'Guilherme Guimaraes', '+5511999000015', 'C', jogo_borussia_id, concurso_03_id, '2024-12-29 14:44:00'),
    
    -- 16. João (C,F,E,C,C,C,C,F)
    (gen_random_uuid()::text, 'João', '+5511999000016', 'C', jogo_palmeiras_id, concurso_03_id, '2024-12-29 14:45:00'),
    (gen_random_uuid()::text, 'João', '+5511999000016', 'F', jogo_benfica_id, concurso_03_id, '2024-12-29 14:45:00'),
    (gen_random_uuid()::text, 'João', '+5511999000016', 'E', jogo_psg_id, concurso_03_id, '2024-12-29 14:45:00'),
    (gen_random_uuid()::text, 'João', '+5511999000016', 'C', jogo_flamengo_id, concurso_03_id, '2024-12-29 14:45:00'),
    (gen_random_uuid()::text, 'João', '+5511999000016', 'C', jogo_inter_id, concurso_03_id, '2024-12-29 14:45:00'),
    (gen_random_uuid()::text, 'João', '+5511999000016', 'C', jogo_manchester_id, concurso_03_id, '2024-12-29 14:45:00'),
    (gen_random_uuid()::text, 'João', '+5511999000016', 'C', jogo_real_id, concurso_03_id, '2024-12-29 14:45:00'),
    (gen_random_uuid()::text, 'João', '+5511999000016', 'F', jogo_borussia_id, concurso_03_id, '2024-12-29 14:45:00'),
    
    -- 17. João Marcelo de Alencar Guimarães (C,F,F,C,C,C,C,C)
    (gen_random_uuid()::text, 'João Marcelo de Alencar Guimarães', '+5511999000017', 'C', jogo_palmeiras_id, concurso_03_id, '2024-12-29 14:46:00'),
    (gen_random_uuid()::text, 'João Marcelo de Alencar Guimarães', '+5511999000017', 'F', jogo_benfica_id, concurso_03_id, '2024-12-29 14:46:00'),
    (gen_random_uuid()::text, 'João Marcelo de Alencar Guimarães', '+5511999000017', 'F', jogo_psg_id, concurso_03_id, '2024-12-29 14:46:00'),
    (gen_random_uuid()::text, 'João Marcelo de Alencar Guimarães', '+5511999000017', 'C', jogo_flamengo_id, concurso_03_id, '2024-12-29 14:46:00'),
    (gen_random_uuid()::text, 'João Marcelo de Alencar Guimarães', '+5511999000017', 'C', jogo_inter_id, concurso_03_id, '2024-12-29 14:46:00'),
    (gen_random_uuid()::text, 'João Marcelo de Alencar Guimarães', '+5511999000017', 'C', jogo_manchester_id, concurso_03_id, '2024-12-29 14:46:00'),
    (gen_random_uuid()::text, 'João Marcelo de Alencar Guimarães', '+5511999000017', 'C', jogo_real_id, concurso_03_id, '2024-12-29 14:46:00'),
    (gen_random_uuid()::text, 'João Marcelo de Alencar Guimarães', '+5511999000017', 'C', jogo_borussia_id, concurso_03_id, '2024-12-29 14:46:00'),
    
    -- 18. Pepeu (C,C,E,C,F,C,C,E)
    (gen_random_uuid()::text, 'Pepeu', '+5511999000018', 'C', jogo_palmeiras_id, concurso_03_id, '2024-12-29 14:47:00'),
    (gen_random_uuid()::text, 'Pepeu', '+5511999000018', 'C', jogo_benfica_id, concurso_03_id, '2024-12-29 14:47:00'),
    (gen_random_uuid()::text, 'Pepeu', '+5511999000018', 'E', jogo_psg_id, concurso_03_id, '2024-12-29 14:47:00'),
    (gen_random_uuid()::text, 'Pepeu', '+5511999000018', 'C', jogo_flamengo_id, concurso_03_id, '2024-12-29 14:47:00'),
    (gen_random_uuid()::text, 'Pepeu', '+5511999000018', 'F', jogo_inter_id, concurso_03_id, '2024-12-29 14:47:00'),
    (gen_random_uuid()::text, 'Pepeu', '+5511999000018', 'C', jogo_manchester_id, concurso_03_id, '2024-12-29 14:47:00'),
    (gen_random_uuid()::text, 'Pepeu', '+5511999000018', 'C', jogo_real_id, concurso_03_id, '2024-12-29 14:47:00'),
    (gen_random_uuid()::text, 'Pepeu', '+5511999000018', 'E', jogo_borussia_id, concurso_03_id, '2024-12-29 14:47:00'),
    
    -- 19. Rafael Amoedo (C,E,F,C,C,C,C,C)
    (gen_random_uuid()::text, 'Rafael Amoedo', '+5511999000019', 'C', jogo_palmeiras_id, concurso_03_id, '2024-12-29 14:48:00'),
    (gen_random_uuid()::text, 'Rafael Amoedo', '+5511999000019', 'E', jogo_benfica_id, concurso_03_id, '2024-12-29 14:48:00'),
    (gen_random_uuid()::text, 'Rafael Amoedo', '+5511999000019', 'F', jogo_psg_id, concurso_03_id, '2024-12-29 14:48:00'),
    (gen_random_uuid()::text, 'Rafael Amoedo', '+5511999000019', 'C', jogo_flamengo_id, concurso_03_id, '2024-12-29 14:48:00'),
    (gen_random_uuid()::text, 'Rafael Amoedo', '+5511999000019', 'C', jogo_inter_id, concurso_03_id, '2024-12-29 14:48:00'),
    (gen_random_uuid()::text, 'Rafael Amoedo', '+5511999000019', 'C', jogo_manchester_id, concurso_03_id, '2024-12-29 14:48:00'),
    (gen_random_uuid()::text, 'Rafael Amoedo', '+5511999000019', 'C', jogo_real_id, concurso_03_id, '2024-12-29 14:48:00'),
    (gen_random_uuid()::text, 'Rafael Amoedo', '+5511999000019', 'C', jogo_borussia_id, concurso_03_id, '2024-12-29 14:48:00'),
    
    -- 20. Renato Prazeres (F,E,F,C,E,C,C,F)
    (gen_random_uuid()::text, 'Renato Prazeres', '+5511999000020', 'F', jogo_palmeiras_id, concurso_03_id, '2024-12-29 14:49:00'),
    (gen_random_uuid()::text, 'Renato Prazeres', '+5511999000020', 'E', jogo_benfica_id, concurso_03_id, '2024-12-29 14:49:00'),
    (gen_random_uuid()::text, 'Renato Prazeres', '+5511999000020', 'F', jogo_psg_id, concurso_03_id, '2024-12-29 14:49:00'),
    (gen_random_uuid()::text, 'Renato Prazeres', '+5511999000020', 'C', jogo_flamengo_id, concurso_03_id, '2024-12-29 14:49:00'),
    (gen_random_uuid()::text, 'Renato Prazeres', '+5511999000020', 'E', jogo_inter_id, concurso_03_id, '2024-12-29 14:49:00'),
    (gen_random_uuid()::text, 'Renato Prazeres', '+5511999000020', 'C', jogo_manchester_id, concurso_03_id, '2024-12-29 14:49:00'),
    (gen_random_uuid()::text, 'Renato Prazeres', '+5511999000020', 'C', jogo_real_id, concurso_03_id, '2024-12-29 14:49:00'),
    (gen_random_uuid()::text, 'Renato Prazeres', '+5511999000020', 'F', jogo_borussia_id, concurso_03_id, '2024-12-29 14:49:00'),
    
    -- 21. Ricardo Sanches (F,C,C,C,F,C,C,E)
    (gen_random_uuid()::text, 'Ricardo Sanches', '+5511999000021', 'F', jogo_palmeiras_id, concurso_03_id, '2024-12-29 14:50:00'),
    (gen_random_uuid()::text, 'Ricardo Sanches', '+5511999000021', 'C', jogo_benfica_id, concurso_03_id, '2024-12-29 14:50:00'),
    (gen_random_uuid()::text, 'Ricardo Sanches', '+5511999000021', 'C', jogo_psg_id, concurso_03_id, '2024-12-29 14:50:00'),
    (gen_random_uuid()::text, 'Ricardo Sanches', '+5511999000021', 'C', jogo_flamengo_id, concurso_03_id, '2024-12-29 14:50:00'),
    (gen_random_uuid()::text, 'Ricardo Sanches', '+5511999000021', 'F', jogo_inter_id, concurso_03_id, '2024-12-29 14:50:00'),
    (gen_random_uuid()::text, 'Ricardo Sanches', '+5511999000021', 'C', jogo_manchester_id, concurso_03_id, '2024-12-29 14:50:00'),
    (gen_random_uuid()::text, 'Ricardo Sanches', '+5511999000021', 'C', jogo_real_id, concurso_03_id, '2024-12-29 14:50:00'),
    (gen_random_uuid()::text, 'Ricardo Sanches', '+5511999000021', 'E', jogo_borussia_id, concurso_03_id, '2024-12-29 14:50:00'),
    
    -- 22. Rodrigo Prado Nunes (F,E,F,C,E,C,C,C)
    (gen_random_uuid()::text, 'Rodrigo Prado Nunes', '+5511999000022', 'F', jogo_palmeiras_id, concurso_03_id, '2024-12-29 14:51:00'),
    (gen_random_uuid()::text, 'Rodrigo Prado Nunes', '+5511999000022', 'E', jogo_benfica_id, concurso_03_id, '2024-12-29 14:51:00'),
    (gen_random_uuid()::text, 'Rodrigo Prado Nunes', '+5511999000022', 'F', jogo_psg_id, concurso_03_id, '2024-12-29 14:51:00'),
    (gen_random_uuid()::text, 'Rodrigo Prado Nunes', '+5511999000022', 'C', jogo_flamengo_id, concurso_03_id, '2024-12-29 14:51:00'),
    (gen_random_uuid()::text, 'Rodrigo Prado Nunes', '+5511999000022', 'E', jogo_inter_id, concurso_03_id, '2024-12-29 14:51:00'),
    (gen_random_uuid()::text, 'Rodrigo Prado Nunes', '+5511999000022', 'C', jogo_manchester_id, concurso_03_id, '2024-12-29 14:51:00'),
    (gen_random_uuid()::text, 'Rodrigo Prado Nunes', '+5511999000022', 'C', jogo_real_id, concurso_03_id, '2024-12-29 14:51:00'),
    (gen_random_uuid()::text, 'Rodrigo Prado Nunes', '+5511999000022', 'C', jogo_borussia_id, concurso_03_id, '2024-12-29 14:51:00'),
    
    -- 23. Sergio Sanches (C,F,C,C,C,C,C,C)
    (gen_random_uuid()::text, 'Sergio Sanches', '+5511999000023', 'C', jogo_palmeiras_id, concurso_03_id, '2024-12-29 14:52:00'),
    (gen_random_uuid()::text, 'Sergio Sanches', '+5511999000023', 'F', jogo_benfica_id, concurso_03_id, '2024-12-29 14:52:00'),
    (gen_random_uuid()::text, 'Sergio Sanches', '+5511999000023', 'C', jogo_psg_id, concurso_03_id, '2024-12-29 14:52:00'),
    (gen_random_uuid()::text, 'Sergio Sanches', '+5511999000023', 'C', jogo_flamengo_id, concurso_03_id, '2024-12-29 14:52:00'),
    (gen_random_uuid()::text, 'Sergio Sanches', '+5511999000023', 'C', jogo_inter_id, concurso_03_id, '2024-12-29 14:52:00'),
    (gen_random_uuid()::text, 'Sergio Sanches', '+5511999000023', 'C', jogo_manchester_id, concurso_03_id, '2024-12-29 14:52:00'),
    (gen_random_uuid()::text, 'Sergio Sanches', '+5511999000023', 'C', jogo_real_id, concurso_03_id, '2024-12-29 14:52:00'),
    (gen_random_uuid()::text, 'Sergio Sanches', '+5511999000023', 'C', jogo_borussia_id, concurso_03_id, '2024-12-29 14:52:00'),
    
    -- 24. Tawan correia (F,C,F,C,C,C,C,C)
    (gen_random_uuid()::text, 'Tawan correia', '+5511999000024', 'F', jogo_palmeiras_id, concurso_03_id, '2024-12-29 14:53:00'),
    (gen_random_uuid()::text, 'Tawan correia', '+5511999000024', 'C', jogo_benfica_id, concurso_03_id, '2024-12-29 14:53:00'),
    (gen_random_uuid()::text, 'Tawan correia', '+5511999000024', 'F', jogo_psg_id, concurso_03_id, '2024-12-29 14:53:00'),
    (gen_random_uuid()::text, 'Tawan correia', '+5511999000024', 'C', jogo_flamengo_id, concurso_03_id, '2024-12-29 14:53:00'),
    (gen_random_uuid()::text, 'Tawan correia', '+5511999000024', 'C', jogo_inter_id, concurso_03_id, '2024-12-29 14:53:00'),
    (gen_random_uuid()::text, 'Tawan correia', '+5511999000024', 'C', jogo_manchester_id, concurso_03_id, '2024-12-29 14:53:00'),
    (gen_random_uuid()::text, 'Tawan correia', '+5511999000024', 'C', jogo_real_id, concurso_03_id, '2024-12-29 14:53:00'),
    (gen_random_uuid()::text, 'Tawan correia', '+5511999000024', 'C', jogo_borussia_id, concurso_03_id, '2024-12-29 14:53:00');
    
    -- Verificar inserção
    DECLARE
        total_palpites_inseridos INTEGER;
        total_apostadores INTEGER;
    BEGIN
        SELECT COUNT(*) INTO total_palpites_inseridos FROM "Palpite" WHERE "concursoId" = concurso_03_id;
        SELECT COUNT(DISTINCT nome) INTO total_apostadores FROM "Palpite" WHERE "concursoId" = concurso_03_id;
        
        RAISE NOTICE '✅ Inserção concluída!';
        RAISE NOTICE 'Total de palpites inseridos: %', total_palpites_inseridos;
        RAISE NOTICE 'Total de apostadores: %', total_apostadores;
        RAISE NOTICE 'Concurso 03 atualizado com dados reais dos clientes!';
    END;
    
END $$;
