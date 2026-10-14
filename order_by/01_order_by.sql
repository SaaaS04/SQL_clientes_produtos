-- SELECT IdCliente,
--        qtdePontos

-- FROM clientes

-- ORDER BY qtdePontos DESC

-- LIMIT 10

SELECT DtCriacao,
       qtdePontos,
       flTwitch,
       flEmail

FROM clientes

WHERE flTwitch = 1
AND flEmail = 1


ORDER BY DtCriacao, QtdePontos DESC
