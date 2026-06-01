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
- missões com etapas, notas, prioridade, categoria e progresso automático
- linha do tempo com múltiplos prints por registro
- edição de registros da timeline
- visualizador grande de prints
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

## Arquivos

- `index.html`: estrutura do app
- `styles.css`: visual responsivo
- `app.js`: tarefas, missões, timeline, backup e upload Cloudinary
- `SPEC.md`: melhorias implementadas e próximos caminhos
