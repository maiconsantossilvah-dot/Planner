# Jurassic Planner

App web para organizar tarefas, missões e prints do Jurassic World: The Game.

## Abrir

Use o servidor local iniciado para testes:

```txt
http://127.0.0.1:4200/
```

Também é possível abrir `index.html` direto no navegador.

## O que tem

- painel com resumo do parque
- tarefas com prioridade, categoria, prazo e recorrência
- filtro de tarefas de hoje, atrasadas e recorrentes
- missões com etapas, dinos ligados, notas, prioridade, categoria e progresso automático
- calendário com eventos do jogo, tarefas, missões e metas por data
- sistema de dinossauros com classe, raridade, nível alvo, cópias, DNA/comida e missão ligada
- busca na Jurassic World: The Game Wiki para preencher dados do dino
- aba News com últimos dinos lançados via Paleo.gg
- metas semanais com progresso
- painel inteligente com alertas de atraso, metas e objetivos quase prontos
- linha do tempo com múltiplos prints por registro
- edição de registros da timeline
- visualizador grande de prints
- galeria de todos os prints com filtros
- exportação da timeline em HTML
- tags personalizadas em tarefas, missões, timeline, dinos, metas e eventos
- configuração e teste do Cloudinary
- backup JSON com prévia de importação
- limpeza apenas de prints locais
- layout melhorado para celular

## Cloudinary

No Cloudinary, crie um upload preset sem assinatura para imagens. Depois, no app:

1. Entre em `Config`.
2. Preencha `Cloud name`.
3. Preencha `Upload preset`.
4. Escolha a pasta, ou deixe `jurassic-planner`.
5. Clique em `Salvar config`.
6. Clique em `Testar Cloudinary`.

Sem essa configuração, os prints ficam salvos apenas no navegador.

## Wiki Dos Dinos

Na aba `Dinos`, abra `Novo dino`, escolha a fonte, digite o nome e clique em `Buscar fonte`.

O app usa estas fontes:

- `Jurassic World: The Game Wiki / Fandom`
- `Paleo.gg / Jurassic World: The Game / Creatures`

No Paleo.gg, use o nome completo da criatura do jogo. A busca sempre consulta o caminho `jurassic-world-the-game/creatures`.

Quando encontrar uma página de criatura, ele mostra uma prévia e pode preencher:

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
- calculo automatico de DNA e comida para chegar ao nivel desejado
- descrição traduzida para português quando a API de tradução responder
- imagem e link da fonte

Ao clicar em um card de dino, o app abre os detalhes, incluindo preço base, stats, descrição e cópias cadastradas.

## News

A aba `News` checa o Paleo.gg sempre que é aberta. Se a versão da base mudou, ela atualiza os últimos dinos lançados com imagem, raridade, classe, stats, preço e data de lançamento.

## Arquivos

- `index.html`: estrutura do app
- `styles.css`: visual responsivo
- `app.js`: tarefas, missões, timeline, backup e upload Cloudinary
- `SPEC.md`: melhorias implementadas e próximos caminhos
