SELECT 
       substr(t1.Dtcriacao,1,7) AS anoMes,
       count(DISTINCT t1.Idtransacao) AS qtdeTransacao

FROM transacoes AS t1

LEFT JOIN transacao_produto AS t2
ON t1.Idtransacao = t2.Idtransacao

LEFT JOIN produtos AS t3
ON t2.Idproduto = t3.Idproduto

WHERE DescNomeProduto = 'Lista de presença'

GROUP BY substr(t1.Dtcriacao,1,7)
ORDER BY qtdeTransacao DESC
