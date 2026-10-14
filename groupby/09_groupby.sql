SELECT idproduto,
       sum(vlProduto * qtdeProduto) AS totalPontos,
       sum(qtdeProduto) AS qtdeVendas

FROM transacao_produto

GROUP BY idproduto
ORDER BY sum(vlProduto) DESC