SELECT count(*) 

FROM produtos

WHERE DescCAtegoriaProduto = 'rpg';

SELECT DescCAtegoriaProduto,
       count(*)

FROM produtos

GROUP BY DescCAtegoriaProduto;
