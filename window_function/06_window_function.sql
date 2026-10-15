
WITH tb_dia_cliente AS (
    SELECT Idcliente,
        strftime('%w', substr(DtCriacao,1,10)) AS dtDiaSemana,
        count(DISTINCT IdTransacao) AS QtdeIdTransacoes

    FROM transacoes
    GROUP BY IdCliente, dtDiaSemana 
),

tb_linha AS (
SELECT *,
       row_number() OVER (PARTITION BY IdCliente ORDER BY QtdeIdTransacoes DESC) AS transacoesAcumaladas

FROM tb_dia_cliente 
)

SELECT IdCliente,
       dtDiaSemana,
       QtdeIdTransacoes,
       transacoesAcumaladas

FROM tb_linha

WHERE transacoesAcumaladas = 1