
DROP TABLE if EXISTS relatório_diario;

CREATE TABLE if NOT EXISTS relatório_diario AS 

WITH tb_transacoes_dia AS (
    SELECT 
        substr(DtCriacao,1,10) AS dtDia,
        count(DISTINCT IdTransacao) AS qtdeTransacoes

    FROM transacoes

    GROUP BY dtDia
    ORDER BY dtDia
),

tb_acum AS (
SELECT *,
       sum(qtdeTransacoes) OVER (ORDER BY dtDia) AS transacoesAcumuladas

FROM tb_transacoes_dia
)

SELECT *

FROM tb_acum;

SELECT * FROM relatório_diario;