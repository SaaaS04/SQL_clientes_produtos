WITH tb_transacoes AS (
    SELECT  IdTransacao,
            IdCliente,
            qtdePontos,
            datetime(substr(DtCriacao,1,19)) AS dtCriacao,
            julianday('now') - julianday(substr(DtCriacao,1,10)) AS diffDate

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



tb_join AS (
    SELECT  t1.*,
            t2.idadeBase

    FROM tb_sumario_transacoes AS t1

    LEFT JOIN tb_cliente AS t2
    ON t1.idCliente = t2.idCliente
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
)

SELECT *
FROM tb_transacao_produto