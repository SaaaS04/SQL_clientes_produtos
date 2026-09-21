SELECT idcliente,
       qtdepontos,
       CASE 
            WHEN qtdePontos <= 500 THEN 'Ponei'
            WHEN qtdePontos <= 1000 THEN 'Ponei Premium'
            WHEN qtdePontos <= 5000 THEN 'Mago APRENDIZ'
            WHEN qtdePontos <= 10000 THEN 'Mago SUPREMO'
            ELSE 'Mago SUPREMO'
        END AS classe,

        CASE 
            WHEN qtdePontos <= 1000 THEN 1
            ELSE 0
        END AS flPonei,

        CASE
            WHEN qtdePontos >= 1000 THEN 1
            ELSE 0
        END AS flMago

FROM clientes

ORDER BY qtdePontos DESC

 