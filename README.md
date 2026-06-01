# Jurassic Planner

App web para organizar tarefas, missões e prints do Jurassic World: The Game.

## Abrir

Abra `index.html` no navegador ou use o servidor local:

```txt
http://127.0.0.1:4173/
```

## Cloudinary

No Cloudinary, crie um upload preset sem assinatura para imagens. Depois, no app:

1. Entre em `Config`.
2. Preencha `Cloud name`.
3. Preencha `Upload preset`.
4. Deixe a pasta como `jurassic-planner` ou troque por outra.
5. Clique em `Salvar config`.

Sem essa configuração, os prints ficam salvos apenas no navegador.

## Arquivos

- `index.html`: estrutura do app
- `styles.css`: visual responsivo
- `app.js`: tarefas, missões, timeline, backup e upload Cloudinary
