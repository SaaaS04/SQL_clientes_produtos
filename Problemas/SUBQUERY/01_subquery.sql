SELECT count(DISTINCT Idcliente)

FROM transacoes AS t1

WHERE t1.Idcliente IN (

    SELECT DISTINCT Idcliente
    FROM transacoes
    WHERE substr(Dtcriacao,1,10) = '2025-08-25'

)
AND substr(t1.Dtcriacao,1,10) = '2025-08-29';

SELECT count(DISTINCT Idcliente)
FROM transacoes
WHERE substr(Dtcriacao,1,10) = '2025-08-25';