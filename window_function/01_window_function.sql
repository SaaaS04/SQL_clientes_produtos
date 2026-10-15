
WITH tb_sumario_dias AS (
    SELECT substr(Dtcriacao,1,10) AS dtDia,
        count(DISTINCT Idtransacao) AS qtdeTransacao

    FROM transacoes

    WHERE Dtcriacao >= '2025-08-25'
    AND Dtcriacao < '2025-08-30'

    GROUP BY dtDia
)

SELECT *,
       sum(qtdeTransacao) OVER (ORDER BY dtDia) AS qtdeTransacaoAcumulada

FROM tb_sumario_dias