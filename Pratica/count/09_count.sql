SELECT  count(*),
        count(DISTINCT IDtransacao),
        count(DISTINCT idcliente)

FROM transacoes

WHERE dtcriacao >= '2025-07-01'
AND dtcriacao < '2025-08-01'

ORDER BY dtcriacao DESC

