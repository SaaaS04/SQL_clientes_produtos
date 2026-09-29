SELECT t1.Idcliente,
       julianday('now') - julianday(substr(t1.Dtcriacao,1,19)) AS idadeBase,
       count(t2.Idtransacao) AS qtdeTransacao


FROM clientes AS t1

LEFT JOIN transacoes AS t2
ON t1.Idcliente = t2.Idcliente



GROUP BY t1.Idcliente, idadeBase