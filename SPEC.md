# Spec de Melhorias - Jurassic Planner

## Escopo implementado

Implementado nesta rodada, sem login/sincronização:

- calendário de eventos
- sistema de dinossauros
- metas semanais
- painel inteligente
- exportação da timeline
- tags personalizadas
- galeria de prints

Também permanecem implementados:

- configuração guiada do Cloudinary
- timeline com edição, filtros e múltiplos prints
- missões com prioridade, categoria, notas por etapa e reordenação
- tarefas recorrentes e filtros de rotina
- backup com prévia de importação
- ajustes de mobile

## Calendário

O calendário combina:

- eventos criados manualmente
- tarefas com prazo
- missões com prazo
- metas com prazo

Possui filtro por tipo e intervalo de datas.

## Dinossauros

Cada dino possui:

- nome
- classe
- raridade
- nível atual
- nível desejado
- DNA necessário
- comida necessária
- missão ligada
- notas
- tags

## Metas Semanais

Cada meta possui:

- valor atual
- valor alvo
- unidade
- prazo
- progresso automático
- botões para somar ou subtrair 1
- tags

## Painel Inteligente

O painel mostra alertas automáticos para:

- tarefas atrasadas
- missões quase concluídas
- metas quase concluídas
- dinos perto do nível alvo
- próximos itens do calendário

## Galeria E Exportação

A galeria mostra todos os prints da timeline com filtros por:

- tipo
- missão
- tag

A timeline pode ser exportada como arquivo HTML.

## Tags Personalizadas

Tags podem ser usadas em:

- tarefas
- missões
- registros da timeline
- eventos do calendário
- dinossauros
- metas

## Fora Do Escopo

- login
- sincronização entre aparelhos
- banco remoto
- PWA/instalação como aplicativo
