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

            sum(CASE WHEN qtdePontos > 0 AND diffDate <= 56 THEN qtdePontos ELSE 0 END) as qtdePontosPos56,
            sum(CASE WHEN qtdePontos > 0 AND diffDate <= 28 THEN qtdePontos ELSE 0 END) as qtdePontosPos28,
            sum(CASE WHEN qtdePontos > 0 AND diffDate <= 14 THEN qtdePontos ELSE 0 END) as qtdePontosPos14,
            sum(CASE WHEN qtdePontos > 0 AND diffDate <= 7 THEN qtdePontos ELSE 0 END) as qtdePontosPos7

FROm tb_transacoes
GROUP BY IdCliente
)


SELECT  t1.*,
        t2.idadeBase

FROM tb_sumario_transacoes AS t1

LEFT JOIN tb_cliente AS t2
ON t1.idCliente = t2.idCliente
