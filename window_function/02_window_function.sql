
WITH tb_cliente_dia AS (
    SELECT Idcliente,
           substr(Dtcriacao,1,10) AS dtDia,
           count(DISTINCT Idtransacao) AS qtdeTransacoes

    FROM transacoes

    WHERE Dtcriacao >= '2025-08-25'
    AND Dtcriacao < '2025-08-30'

    GROUP BY Idcliente, dtDia
),

tb_lag AS (
    SELECT *,
        sum(qtdeTransacoes) OVER (PARTITION BY Idcliente ORDER BY dtDia) AS qtAcumulada,
        lag(qtdeTransacoes) OVER (PARTITION BY Idcliente ORDER BY dtDia) AS lagTransacoes
        

    FROM tb_cliente_dia

    ORDER BY Idcliente, dtDia 
)

SELECT *,
       1. * qtdeTransacoes / lagTransacoes AS qtdePorLAg

FROM tb_lag