WITH tb_cliente_pontos AS (
    SELECT IdCliente,
        substr(DtCriacao,1,10) AS dtDia,
        sum(QtdePontos) AS sumPontos

    FROM transacoes

    GROUP BY IdCliente, dtDia
)

SELECT *,
       sum(sumPontos) OVER (PARTITION BY IdCliente ORDER BY dtDia) AS pontosAcumulados

FROM tb_cliente_pontos