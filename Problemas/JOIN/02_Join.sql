SELECT 
       t3.DescCategoriaproduto,
       count(DISTINCT t1.Idtransacao)

FROM transacoes AS t1

LEFT JOIN transacao_produto AS t2
ON t1.Idtransacao = t2.Idtransacao

LEFT JOIN produtos AS t3
ON t2.IdProduto = t3.IdProduto

WHERE t1.DtCriacao >= '2024-01-01'
AND t1.DtCriacao < '2025-01-01'
-- AND t3.DescCategoriaproduto = 'lovers'

GROUP BY t3.DescCategoriaproduto
HAVING count(DISTINCT t1.Idtransacao) < 1000

ORDER BY count(DISTINCT t1.Idtransacao) DESC