WITH tb_transacoes AS (
    SELECT  IdTransacao,
            IdCliente,
            qtdePontos,
            datetime(substr(DtCriacao,1,19)) AS dtCriacao,
            julianday((SELECT max(substr(DtCriacao,1,10)) FROM transacoes)) - julianday(substr(DtCriacao,1,10)) AS diffDate,
            CAST(strftime('%H', substr(DtCriacao,1,19)) AS INTEGER) AS dtHora
    FROM transacoes 
),

tb_cliente AS (
        SELECT IdCliente,
        datetime(substr(DtCriacao,1,19)) AS dtCriacao,
        julianday('now') - julianday(substr(DtCriacao,1,10)) AS idadeBase

    FROM clientes
),

tb_sumario_transacoes AS (
    SELECT  Idcliente,
            count(IdTransacao) AS qtdeTransacoesVida,
            count(CASE when diffDate <= 56 THEN IdTransacao END) AS qtdeTransacoes56,
            count(CASE when diffDate <= 28 THEN IdTransacao END) AS qtdeTransacoes28,
            count(CASE when diffDate <= 14 THEN IdTransacao END) AS qtdeTransacoes14,
            count(CASE when diffDate <= 7 THEN IdTransacao END) AS qtdeTransacoes7,
            min(diffDate) AS ultimaInteracao,
            sum(qtdePontos) AS saldoPontos,

            sum(CASE WHEN qtdePontos > 0 THEN qtdePontos else 0 END) AS qtdePontosPosVida,
            sum(CASE WHEN qtdePontos > 0 AND diffDate <= 56 THEN qtdePontos ELSE 0 END) AS  qtdePontosPos56,
            sum(CASE WHEN qtdePontos > 0 AND diffDate <= 28 THEN qtdePontos ELSE 0 END) AS  qtdePontosPos28,
            sum(CASE WHEN qtdePontos > 0 AND diffDate <= 14 THEN qtdePontos ELSE 0 END) AS  qtdePontosPos14,
            sum(CASE WHEN qtdePontos > 0 AND diffDate <= 7 THEN qtdePontos ELSE 0 END)  AS  qtdePontosPos7,

            sum(CASE WHEN qtdePontos < 0 THEN qtdePontos else 0 END) AS qtdePontosNegVi, 
            sum(CASE WHEN qtdePontos < 0 AND diffDate <= 56 THEN qtdePontos ELSE 0 END) AS  qtdePontosNeg56,
            sum(CASE WHEN qtdePontos < 0 AND diffDate <= 28 THEN qtdePontos ELSE 0 END) AS  qtdePontosNeg28,
            sum(CASE WHEN qtdePontos < 0 AND diffDate <= 14 THEN qtdePontos ELSE 0 END) AS  qtdePontosNeg14,
            sum(CASE WHEN qtdePontos < 0 AND diffDate <= 7 THEN qtdePontos ELSE 0 END)  AS  qtdePontosNeg7

FROm tb_transacoes
GROUP BY IdCliente
),

tb_transacao_produto AS (
    SELECT  t1.*,
            t3.DescNomeProduto,
            t3.DescCategoriaProduto

    FROM tb_transacoes AS t1

    LEFT JOIN transacao_produto AS t2
    ON t1.IdTransacao = t2.IdTransacao

    LEFT JOIN produtos AS t3
    ON t2.IdProduto = t3.IdProduto 
),

tb_cliente_produto AS (
    SELECT  IdCliente,
            DescNomeProduto,
            count(*) AS qtdeVida,
            count(CASE WHEN diffDate <= 56 THEN IdTransacao END) AS qtde56,
            count(CASE WHEN diffDate <= 28 THEN IdTransacao END) AS qtde28,
            count(CASE WHEN diffDate <= 14 THEN IdTransacao END) AS qtde14,
            count(CASE WHEN diffDate <= 7 THEN IdTransacao END) AS qtde7

    FROM tb_transacao_produto
    GROUP BY Idcliente, DescNomeProduto
),


tb_clienteProduto_rn AS (
SELECT  *,
        row_number() OVER (PARTITION BY Idcliente ORDER BY qtdeVida DESC) AS rnVida,
        row_number() OVER (PARTITION BY Idcliente ORDER BY qtde56 DESC) AS rn56,
        row_number() OVER (PARTITION BY Idcliente ORDER BY qtde28 DESC) AS rn28,
        row_number() OVER (PARTITION BY Idcliente ORDER BY qtde14 DESC) AS rn14,
        row_number() OVER (PARTITION BY Idcliente ORDER BY qtde7 DESC) AS rn7

FROM tb_cliente_produto

),


tb_cliente_dia AS (
SELECT  Idcliente,
        Strftime('%w', DtCriacao) AS dtDia,
        count(*) AS qtdTransacao

FROM tb_transacoes
WHERE diffDate <= 28
GROUP BY Idcliente, dtDia
),

tb_cliente_dia_rn AS (
    SELECT  *, 
            row_number() OVER (PARTITION BY Idcliente ORDER BY qtdTransacao DESC) AS rnDia

    FROM tb_cliente_dia
),


tb_cliente_periodo AS (
    SELECT  IdTransacao,
            Idcliente,
            dtCriacao,
            dtHora,
            CASE 
                WHEN dtHora BETWEEN 7 AND 12 THEN'Manhã'
                WHEN dtHora BETWEEN 13 AND 18 THEN 'Tarde'
                WHEN dtHora BETWEEN 19 AND 23 THEN 'Noite'
                ELSE 'Madrugada'
                END AS periodo,
                count(*) AS qtdeTransacao


    FROM tb_transacoes
    WHERE diffDate <= 28
    GROUP BY 1,2
),

tb_cliente_periodo_rn AS (
    SELECT *,
            row_number() OVER (PARTITION BY idCliente ORDER BY qtdeTransacao DESC) AS rnPeriodo

    FROM tb_cliente_periodo
),

tb_join AS (
    SELECT  t1.*,
            t2.idadeBase,
            t3.DescNomeProduto AS produtoVida,
            t4.DescNomeProduto AS produto56,
            t5.DescNomeProduto AS produto28,
            t6.DescNomeProduto AS produto14,
            t7.DescNomeProduto AS produto7,
            COALESCE(t8.dtDia, - 1) AS dtDia,
            COALESCE(t9.periodo, 'SEM INFO') AS periodo28

    FROM tb_sumario_transacoes AS t1

    LEFT JOIN tb_cliente AS t2
    ON t1.idCliente = t2.idCliente

    LEFT JOIN tb_clienteProduto_rn AS t3
    ON t1.IdCliente = t3.idCliente
    AND t3.rnVida = 1

    LEFT JOIN tb_clienteProduto_rn AS t4
    ON t1.IdCliente = t4.idCliente
    AND t4.rn56 = 1

    LEFT JOIN tb_clienteProduto_rn AS t5
    ON t1.IdCliente = t5.idCliente
    AND t5.rn28 = 1
    
    LEFT JOIN tb_clienteProduto_rn AS t6
    ON t1.IdCliente = t6.idCliente
    AND t6.rn14 = 1

    LEFT JOIN tb_clienteProduto_rn AS t7
    ON t1.IdCliente = t7.idCliente
    AND t7.rn7 = 1

    LEFT JOIN tb_cliente_dia_rn AS t8
    ON t1.IdCliente = t8.IdCliente
    AND t8.rnDia = 1

    LEFT JOIN tb_cliente_periodo_rn AS t9
    ON t1.IdCliente = t9.IdCliente
    AND t9.rnPeriodo = 1
)

SELECT * FROM tb_join