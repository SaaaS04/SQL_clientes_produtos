SELECT idCliente,
        --  qtdePontos,
        --  qtdePontos + 10 AS QtdePontosPlus10,
        --  qtdePontos * 2 AS qtdePontosDouble,
        DtCriacao,

        substr(DtCriacao,1, 19) AS dtsubstring,

        DATETIME(substr(DtCriacao,1, 19)) AS DtCriacaoNova,
         
        strftime('%w',(substr(DtCriacao,1, 19))) AS DiaSemana

FROM clientes