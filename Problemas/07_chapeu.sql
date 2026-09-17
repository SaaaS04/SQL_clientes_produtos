-- LISTA de produtos que s~ao chapéu

SELECT DescNomeProduto,
       DescCategoriaProduto

FROM produtos

WHERE DescCategoriaProduto = 'chapeu'