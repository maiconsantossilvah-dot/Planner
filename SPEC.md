# Spec de Melhorias - Jurassic Planner

## Escopo implementado

Implementado nesta rodada, sem login/sincronização:

- calendário de eventos
- sistema de dinossauros
- integração de dinos com a Jurassic World: The Game Wiki / Fandom
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

## Integração Com Wiki

Fonte única:

- Jurassic World: The Game Wiki / Fandom

Fluxo:

1. Usuário abre `Novo dino`.
2. Digita o nome do dinossauro.
3. Clica em `Buscar na wiki`.
4. O app consulta a API da Fandom.
5. O app mostra uma prévia dos dados encontrados.
6. O usuário clica em `Aplicar dados`.

Dados preenchidos quando disponíveis:

- nome
- classe
- raridade
- preço em DNA
- tempo de incubação
- pais do híbrido
- híbridos derivados
- vida no nível 40
- dano no nível 40
- moedas por minuto
- imagem
- link da fonte

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
