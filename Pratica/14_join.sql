SELECT t1.*, 
       t2.DescNomeProduto

FROM transacao_produto AS t1

LEFT JOIN produtos AS t2
ON t1.idproduto = t2.idproduto

