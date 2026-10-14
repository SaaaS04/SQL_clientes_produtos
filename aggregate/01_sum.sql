SELECT sum(qtdepontos),

        sum(CASE
            WHEN qtdepontos > 0 THEN qtdepontos
            END) AS qtdepontosPositivos,

        sum(CASE
            WHEN qtdepontos < 0 THEN  qtdepontos
            END) AS qtdepontosNegativos,

        count(CASE
            WHEN qtdepontos < 0 THEN  qtdepontos
            END) AS qtransacoesNegativas

FROM transacoes

WHERE dtcriacao >= '2025-07-01'
AND Dtcriacao < '2025-08-01'