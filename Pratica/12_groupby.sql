-- SELECT idproduto,
--        count(*)

-- FROM transacao_produto 

-- GROUP BY idproduto

SELECT idcliente,
       sum(qtdepontos) AS maioresPontos,
       count(IDtransacao)

FROM transacoes

WHERE dtcriacao >= '2025-07-01'
AND dtcriacao < '2025-08-01'

GROUP BY idcliente

ORDER BY sum(qtdepontos) DESC

LIMIT 10