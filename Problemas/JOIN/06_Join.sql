SELECT count(DISTINCT t1.Idcliente)

FROM transacoes AS t1 

LEFT JOIN transacao_produto AS t2
ON t1.Idtransacao = t2.Idtransacao  

LEFT JOIN produtos AS t3
ON t2.idproduto = t3.idproduto


WHERE t1.Dtcriacao >= '2025-08-25'
AND t1.Dtcriacao < '2025-08-30'
AND t3.DescNomeProduto = 'Lista de presença'
