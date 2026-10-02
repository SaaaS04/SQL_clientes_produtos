WITH tb_primeiro_dia AS(

     SELECT *
     FROM transacoes
     WHERE substr(Dtcriacao,1,10) = '2025-08-25'
     
),

tb_dias_curso AS (

     SELECT DISTINCT
     Idcliente, 
     substr(Dtcriacao,1,10) AS presente_dia
     FROM transacoes
     WHERE Dtcriacao >= '2025-08-25'
     AND Dtcriacao < '2025-08-30'

     ORDER BY Idcliente, presente_dia
),

tb_cliente_dias AS (

SELECT t1.Idcliente,
       count(DISTINCT t2.presente_dia) AS qtdedias

FROM tb_primeiro_dia AS t1

LEFT JOIN tb_dias_curso AS t2
ON t1.Idcliente = t2.Idcliente

GROUP BY t1.Idcliente
)

SELECT avg(qtdedias) 

FROM tb_cliente_dias