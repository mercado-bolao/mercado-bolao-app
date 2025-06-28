
-- Script para atualizar números de telefone dos clientes do concurso 03
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
    
    -- Atualizar números de telefone nos palpites do concurso 03
    UPDATE "Palpite" 
    SET whatsapp = CASE 
        WHEN nome = 'Alexandre Ferraz' THEN '71992522331'
        WHEN nome = 'An Beatriz Pereira Rufino' THEN '81995'
        WHEN nome = 'Bruno Henriques' THEN '71991419306'
        WHEN nome = 'Cabeça' THEN '77965322258'
        WHEN nome = 'Cabeça' THEN '77988563186'
        WHEN nome = 'Caio Luis' THEN '71988776471'
        WHEN nome = 'Fabio Santos Munhoz' THEN '71992924231'
        WHEN nome = 'Flavio Biano' THEN '71992905152'
        WHEN nome = 'Francisco Bizerra Rufino Neto' THEN '85999735881'
        WHEN nome = 'gabriel correa' THEN '71992297951'
        WHEN nome = 'Guilherme Guimaraes' THEN '81981179'
        WHEN nome = 'João' THEN '71993316-6660'
        WHEN nome = 'João Marcelo de Alencar Guimarães' THEN '81995711'
        WHEN nome = 'Moreira' THEN '71987177951'
        WHEN nome = 'Neto Ruiz' THEN '81996952322'
        WHEN nome = 'Pepeu' THEN '71993573770'
        WHEN nome = 'Rafael Arnost' THEN '71996371795'
        WHEN nome = 'Renato Prazeres' THEN '71994169524'
        WHEN nome = 'Ricardo Sanches' THEN '71993035786'
        WHEN nome = 'Robison Salgado' THEN '71991195527'
        WHEN nome = 'Sergio Sanches' THEN '71988046197'
        WHEN nome = 'Tawan correia' THEN '71999095268'
        ELSE whatsapp
    END
    WHERE "concursoId" = concurso_03_id;
    
    -- Atualizar também na tabela User para manter consistência
    UPDATE "User" 
    SET whatsapp = CASE 
        WHEN nome = 'Alexandre Ferraz' THEN '71992522331'
        WHEN nome = 'An Beatriz Pereira Rufino' THEN '81995'
        WHEN nome = 'Bruno Henriques' THEN '71991419306'
        WHEN nome = 'Cabeça' THEN '77965322258'
        WHEN nome = 'Caio Luis' THEN '71988776471'
        WHEN nome = 'Fabio Santos Munhoz' THEN '71992924231'
        WHEN nome = 'Flavio Biano' THEN '71992905152'
        WHEN nome = 'Francisco Bizerra Rufino Neto' THEN '85999735881'
        WHEN nome = 'gabriel correa' THEN '71992297951'
        WHEN nome = 'Guilherme Guimaraes' THEN '81981179'
        WHEN nome = 'João' THEN '71993316-6660'
        WHEN nome = 'João Marcelo de Alencar Guimarães' THEN '81995711'
        WHEN nome = 'Moreira' THEN '71987177951'
        WHEN nome = 'Neto Ruiz' THEN '81996952322'
        WHEN nome = 'Pepeu' THEN '71993573770'
        WHEN nome = 'Rafael Arnost' THEN '71996371795'
        WHEN nome = 'Renato Prazeres' THEN '71994169524'
        WHEN nome = 'Ricardo Sanches' THEN '71993035786'
        WHEN nome = 'Robison Salgado' THEN '71991195527'
        WHEN nome = 'Sergio Sanches' THEN '71988046197'
        WHEN nome = 'Tawan correia' THEN '71999095268'
        ELSE whatsapp
    END
    WHERE nome IN (
        'Alexandre Ferraz', 'An Beatriz Pereira Rufino', 'Bruno Henriques', 'Cabeça', 
        'Caio Luis', 'Fabio Santos Munhoz', 'Flavio Biano', 'Francisco Bizerra Rufino Neto', 
        'gabriel correa', 'Guilherme Guimaraes', 'João', 'João Marcelo de Alencar Guimarães', 
        'Moreira', 'Neto Ruiz', 'Pepeu', 'Rafael Arnost', 'Renato Prazeres', 
        'Ricardo Sanches', 'Robison Salgado', 'Sergio Sanches', 'Tawan correia'
    );
    
    RAISE NOTICE 'Números de telefone atualizados com sucesso no concurso 03!';
    
    -- Verificar quantos registros foram atualizados
    RAISE NOTICE 'Verificando atualizações...';
    
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Erro ao atualizar telefones: %', SQLERRM;
END $$;

-- Verificar os telefones atualizados
SELECT DISTINCT nome, whatsapp 
FROM "Palpite" 
WHERE "concursoId" = (SELECT id FROM "Concurso" WHERE numero = 3)
ORDER BY nome;
