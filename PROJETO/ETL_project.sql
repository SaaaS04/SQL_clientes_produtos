WITH tb_transacoes AS (
    SELECT  IdTransacao,
            IdCliente,
            qtdePontos,
            datetime(substr(DtCriacao,1,19)) AS dtCriacao,
            julianday('now') - julianday(substr(DtCriacao,1,10)) AS diffDate

    FROM transacoes 
)


SELECT  Idcliente,
        count(IdTransacao) AS qtdeTransacoesVida,
        count(CASE when diffDate <= 365 THEN IdTransacao END) AS qtdeTransacoes365,
        count(CASE when diffDate <= 180 THEN IdTransacao END) AS qtdeTransacoes180,
        count(CASE when diffDate <= 90 THEN IdTransacao END) AS qtdeTransacoes90,
        count(CASE when diffDate <= 30 THEN IdTransacao END) AS qtdeTransacoes30,
        min(diffDate) AS ultimaInteracao


FROm tb_transacoes

GROUP BY IdCliente
