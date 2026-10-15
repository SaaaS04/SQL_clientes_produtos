WITH tb_dia_cliente AS (
    SELECT substr(Dtcriacao,1,10) AS dtDia,
        count(DISTINCT IdCliente) AS qtdeClientesNovos

    FROM clientes

    GROUP BY dtDia
)

SELECT *,
       sum(qtdeClientesNovos) OVER (ORDER BY dtDia) AS qtdeClientesAcumulado

FROM tb_dia_cliente

