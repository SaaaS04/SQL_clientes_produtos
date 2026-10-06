
WITH tb_clientes_Janeiro AS (

SELECT DISTINCT IdCliente

FROM transacoes

WHERE dtcriacao >= '2025-01-01'
AND dtcriacao < '2025-02-01'
),

tb_clientes_curso AS (

SELECT DISTINCT IdCliente
FROM transacoes
WHERE dtcriacao >= '2025-08-25'
AND dtcriacao < '2025-08-30'
)

SELECT count(t1.IdCliente) AS clienteJaaneiro,
       count(t2.IdCliente) AS clienteCurso 
FROM tb_clientes_Janeiro AS t1

LEFT JOIN tb_clientes_curso AS t2
ON t1.IdCliente = t2.IdCliente