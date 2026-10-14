SELECT round(avg(qtdepontos),2) AS mediaCarteira,
       
       1. * sum(qtdepontos) / count(idcliente) AS mediaCarteiraRoots,
      
       min(qtdepontos) AS minCArteira,

       max(qtdepontos) AS maxCarteira,
       
       sum(flTwitch),
       
       sum(flEmail)

FROM clientes