
WITH cliente_dia AS (
    SELECT DISTINCT Idcliente,
        substr(Dtcriacao,1,10) AS dtDia

    FROM transacoes
    WHERE substr(Dtcriacao,1,4) = '2025'
    ORDER BY Idcliente, dtDia
)   

SELECT *,
       lag(dtDia) OVER (PARTITION BY Idcliente ORDER BY dtDia) AS lagDia

FROM cliente_dia