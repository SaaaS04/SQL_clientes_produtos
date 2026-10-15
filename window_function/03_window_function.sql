SELECT DISTINCT
       Idcliente,
       substr(Dtcriacao,1,10) AS dtDia

FROM transacoes

WHERE substr(Dtcriacao,1,4) = '2025'

ORDER BY Idcliente, dtDia