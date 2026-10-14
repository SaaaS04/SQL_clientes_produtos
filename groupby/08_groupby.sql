SELECT idproduto,
    --count(*),
       sum(qtdeproduto) AS qtdeprodutosum

FROM transacao_produto

GROUP BY idproduto
ORDER BY count(*) DESC

LIMIT 1
