WITH tb_transacoes_dia AS (
    SELECT 
        substr(DtCriacao,1,10) AS dtDia,
        count(DISTINCT IdTransacao) AS counttransacoes

    FROM transacoes

    GROUP BY dtDia
)

SELECT *,
       sum(counttransacoes) OVER (ORDER BY dtDia) AS transacoesAcumuladas

FROM tb_transacoes_dia