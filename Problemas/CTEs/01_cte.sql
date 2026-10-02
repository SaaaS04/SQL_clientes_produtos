-- CTE: COMMON TABLE EXPRESSION

-- SELECT count(DISTINCT Idcliente)

-- FROM transacoes AS t1

-- WHERE t1.Idcliente IN (

--     SELECT DISTINCT Idcliente
--     FROM transacoes
--     WHERE substr(Dtcriacao,1,10) = '2025-08-25'

-- )
-- AND substr(t1.Dtcriacao,1,10) = '2025-08-29';

-- SELECT count(DISTINCT Idcliente)
-- FROM transacoes
-- WHERE substr(Dtcriacao,1,10) = '2025-08-25';


WITH tb_cliente_primeiro_dia AS(

    SELECT DISTINCT Idcliente
    FROM transacoes 
    WHERE substr(Dtcriacao,1,10) = '2025-08-25'

),

tb_cliente_ultimo_dia AS(

    SELECT DISTINCT Idcliente
    FROM transacoes 
    WHERE substr(Dtcriacao,1,10) = '2025-08-29'

),

tb_join AS (

    SELECT t1.Idcliente AS primCliente,
           t2.Idcliente AS ultimoCliente

    FROM tb_cliente_primeiro_dia AS t1

    LEFT JOIN tb_cliente_ultimo_dia AS t2
    ON t1.Idcliente = t2.Idcliente
)

SELECT count(primCliente),
       count(ultimoCliente),
       count(ultimoCliente) / count(primCliente)

FROM tb_join