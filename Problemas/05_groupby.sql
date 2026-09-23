SELECT sum(qtdepontos) AS totalPontos,

       count(DISTINCT substr(dtcriacao, 1, 10)) AS qtdeDiasunidos,

       sum(qtdepontos) / count(DISTINCT substr(dtcriacao,1,10)) AS avgPontosDia
FROM transacoes

WHERE qtdepontos > 0