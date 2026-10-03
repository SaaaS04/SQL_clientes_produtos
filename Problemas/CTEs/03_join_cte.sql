-- SELECT 
--        substr(Dtcriacao,1,10) AS dtDia,
--        count(DISTINCT Idcliente) AS qtdeCliente

-- FROM transacoes

-- WHERE Dtcriacao >= '2025-08-25'
-- AND Dtcriacao < '2025-08-30'

-- GROUP BY dtDia

WITH tb_cliente_d1 AS (
SELECT DISTINCT Idcliente

FROM transacoes

WHERE Dtcriacao >= '2025-08-25'
AND Dtcriacao < '2025-08-26'
)

SELECT 
       substr(t2.Dtcriacao,1,10) AS dtDia,
       COUNT(DISTINCT t1.Idcliente) AS qtdeclientes,
       1. * count(DISTINCT t1.Idcliente) / (SELECT count(*) FROM tb_cliente_d1) AS pctRetencao,
       1 - 1. * count(DISTINCT t1.Idcliente) / (SELECT count(*) FROM tb_cliente_d1) AS pctRetencaoChurn
 
FROM tb_cliente_d1 AS t1

LEFT JOIN transacoes AS t2
ON t1.Idcliente = t2.Idcliente

WHERE t2.Dtcriacao >= '2025-08-25'
AND t2.Dtcriacao < '2025-08-30'

GROUP BY dtDia 