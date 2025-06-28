
-- Script para limpar palpites atuais e inserir dados reais do concurso 03
DO $$
DECLARE
    concurso_03_id TEXT;
BEGIN
    -- Buscar o ID do concurso 03
    SELECT id INTO concurso_03_id FROM "Concurso" WHERE numero = 3;
    
    IF concurso_03_id IS NULL THEN
        RAISE NOTICE 'Concurso 03 não encontrado!';
        RETURN;
    END IF;
    
    -- Deletar todos os palpites do concurso 03
    DELETE FROM "Palpite" 
    WHERE "concursoId" = concurso_03_id 
    OR "jogoId" IN (
        SELECT id FROM "Jogo" WHERE "concursoId" = concurso_03_id
    );
    
    RAISE NOTICE 'Todos os palpites do concurso 03 foram removidos!';
    RAISE NOTICE 'Agora você pode fornecer os dados reais dos apostadores.';
    
END $$;

-- Verificar se foram removidos
SELECT COUNT(*) as palpites_restantes_concurso_03
FROM "Palpite" p
JOIN "Jogo" j ON p."jogoId" = j.id
WHERE j."concursoId" = (SELECT id FROM "Concurso" WHERE numero = 3);
