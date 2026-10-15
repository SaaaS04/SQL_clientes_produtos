
WITH cliente_dia AS (
       SELECT 
              DISTINCT
              Idcliente,
              substr(Dtcriacao,1,10) AS dtDia

       FROM transacoes
       WHERE substr(Dtcriacao,1,4) = '2025'
       ORDER BY Idcliente, dtDia

),

tb_lag AS (
       SELECT *,
              lag(dtDia) OVER (PARTITION BY IdCliente ORDER BY dtDia) AS lagDIA

       FROM cliente_dia
),

tb_diff_dt AS (

       SELECT *,
              julianday(dtDia) - julianday(lagDia) AS dtDIFF
       FROM tb_lag

),

avg_cliente AS (
       SELECT IdCliente, avg(dtDIFF) AS avgDia
       FROM tb_diff_dt
       GROUP BY IdCliente
)

SELECT avg(avgDia)

FROM avg_cliente