SELECT idcliente,
       sum(qtdepontos) AS totalPontos

FROM transacoes

WHERE dtcriacao >= '2025-05-01'
AND dtcriacao < '2025-06-01'
AND qtdepontos > 0


GROUP BY idcliente
ORDER BY totalPontos DESC

LIMIT 1