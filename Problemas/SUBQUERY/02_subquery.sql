SELECT * FROM(

    SELECT *
    FROM transacoes AS t1
    WHERE Dtcriacao >= '2025-01-01'
    
)

WHERE Dtcriacao < '2025-07-01'