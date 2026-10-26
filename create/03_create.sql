-- DROP TABLE IF EXISTS clientes_d28;

CREATE TABLE IF NOT EXISTS clientes_d28 (
    Idcliente VARCHAR(250) PRIMARY KEY,
    QtdeTransacoes INTEGER
);

DELETE FROM clientes_d28;

INSERT INTO clientes_d28 (Idcliente, QtdeTransacoes)

SELECT IdCliente,
       COUNT(DISTINCT IdTransacao)
FROM transacoes

WHERE julianday((SELECT max(substr(DtCriacao,1,10)) FROM transacoes)) - julianday(substr(DtCriacao,1,10)) <= 28

GROUP BY IdCliente;

SELECT * FROM clientes_d28;

