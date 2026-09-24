SELECT 
       strftime('%w', substr(dtcriacao,1,10)) AS diaSemana,
       count(DISTINCT idtransacao) AS qtdeTransacao
       
FROM transacoes

WHERE substr(dtcriacao,1,4) = '2025'

GROUP BY 1
ORDER BY 2 DESC