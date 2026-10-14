SELECT t1.Idcliente,
       sum(t1.qtdepontos) AS totalPontos

FROM transacoes AS t1

LEFT JOIN transacao_produto AS t2
ON t1.Idtransacao = t2.Idtransacao

LEFT JOIN produtos AS t3
ON t2.IdProduto = t3.IdProduto

WHERE t3.DescCategoriaProduto = 'lovers'

GROUP BY t1.Idcliente

ORDER BY sum(t1.qtdepontos) ASC

LIMIT 5