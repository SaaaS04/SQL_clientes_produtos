-- MAneira correta
SELECT sum(qtdepontos) AS totalPontos,

       count(DISTINCT substr(dtcriacao, 1, 10)) AS qtdeDiasUnidos,

       sum(qtdepontos) / count(DISTINCT substr(dtcriacao,1,10)) AS avgPontosDia

FROM transacoes

WHERE qtdepontos > 0;

--MAneira errada
SELECT substr(dtcriacao,1,10) AS dtDia,
       avg(qtdepontos) AS avgpontos

FROM transacoes

WHERE qtdepontos > 0

GROUP BY 1
ORDER BY 1;