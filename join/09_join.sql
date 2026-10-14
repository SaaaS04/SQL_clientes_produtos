
WITH alunos_dia01 AS (
SELECT DISTINCT Idcliente

FROM transacoes

WHERE substr(Dtcriacao,1,10) = '2025-08-25'

),

tb_dia_cliente AS (

    SELECT t1.Idcliente,
        substr(t2.Dtcriacao,1, 10) AS DtDia,
        count(*) AS qtdeInteracoes

    FROM alunos_dia01 AS t1

    LEFT JOIN transacoes AS t2
    ON t1.Idcliente = t2.Idcliente
    AND t2.Dtcriacao >= '2025-08-25' 
    AND t2.Dtcriacao < '2025-08-30' 

    GROUP BY t1.Idcliente, substr(t2.Dtcriacao,1,10)

    ORDER BY t1.Idcliente, DtDia 

),

tb_rn AS (
    SELECT *,
        row_number() OVER (PARTITION BY Idcliente ORDER BY qtdeInteracoes DESC, DtDia) AS rn
    FROM tb_dia_cliente
)

SELECT *

FROM tb_rn 
WHERE rn = 1