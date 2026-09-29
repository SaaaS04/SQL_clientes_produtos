-- LISTA de produtos com nome quie começa com "Venda de"

SELECT DescNomeProduto


FROM produtos

WHERE DescNomeProduto LIKE 'Venda de%'