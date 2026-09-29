SELECT t1.idcliente,
       count(*)

FROM transacoes AS t1 

LEFT JOIN transacao_produto AS t2
ON t1.Idtransacao = t2.Idtransacao  

LEFT JOIN produtos AS t3
ON t2.idproduto = t3.idproduto


WHERE substr(t1.Dtcriacao,1,10) = '2025-08-25'
AND t3.DescNomeProduto = 'Lista de presença'

GROUP BY t1.idcliente