-- LISTAR todas as transacoes adicionando uma
-- coluna nova sinalizando "Alto", "Médio " e "Baixo" para o valor
-- dos pontos [<10 ; <500 ; >= 500]

SELECT qtdePontos,

        CASE
            WHEN qtdePontos <= 10 THEN 'Baixo'
            WHEN qtdePontos < 500 THEN 'Medio'
            WHEN qtdePontos >= 500 THEN 'Alto'
        END AS flQtdePontos

FROM transacoes

-- WHERE class = 'Baixo'
-- WHERE class = 'Medio'
-- WHERE class = 'Alto'

ORDER BY qtdePontos DESC