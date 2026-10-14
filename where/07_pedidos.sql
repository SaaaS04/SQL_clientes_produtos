-- Lista de pedidos realizados fim de semana;

SELECT DtCriacao,
       strftime('%w', substr(DtCriacao, 1, 19)) AS DiaSemana

FROM transacoes

WHERE strftime('%w', DATETIME(substr(DtCriacao, 1, 19))) IN ('0', '6')
