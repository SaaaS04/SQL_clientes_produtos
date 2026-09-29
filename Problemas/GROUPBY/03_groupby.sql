SELECT idcliente,
       count(*),
       count(DISTINCT idtransacao)
       
FROM transacoes

WHERE dtcriacao >= '2024-01-01'
AND dtcriacao < '2025-01-01'

GROUP BY idcliente 

ORDER BY count(*) DESC

LIMIT 1