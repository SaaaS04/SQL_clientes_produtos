SELECT 
       t2.DescCategoriaProduto,
       count(DISTINCT t1.Idtransacao) AS qtdeTransacao

FROM transacao_produto AS t1

LEFT JOIN produtos AS t2
ON t1.Idproduto = t2.Idproduto

GROUP BY t2.DescCategoriaProduto
ORDER BY qtdeTransacao DESC