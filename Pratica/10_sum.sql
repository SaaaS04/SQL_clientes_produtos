SELECT idtransacao,
       qtdepontos,

        CASE
            WHEN qtdepontos > 0 THEN qtdepontos
        END AS qtdepontosPositivos,

        CASE
            WHEN qtdepontos < 0 THEN  qtdepontos
        END AS qtdepontosNegativos

FROM transacoes


WHERE dtcriacao >= '2025-07-01'
AND Dtcriacao < '2025-08-01'


ORDER BY qtdepontos DESC