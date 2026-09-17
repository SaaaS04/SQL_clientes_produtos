-- Lista de pedidos realizados fim de semana;

SELECT DtCriacao,
       strftime('%w',  DATETIME(substr(DtCriacao, 1, 19))) AS DiaSemana

FROM transacoes
