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
- sincronização com Supabase usando login por e-mail/senha
- imagens no Cloudinary e metadados no Supabase
- aba Amigos com perfil, convites, feed e publicações em tempo real
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

## Supabase

O Supabase guarda os metadados do planner: tarefas, missões, dinos, metas, timeline, links do Cloudinary e `publicId` dos prints. As imagens em si continuam no Cloudinary.

Para ativar:

1. Crie um projeto no Supabase.
2. Abra o SQL Editor e rode o arquivo `supabase-schema.sql`. Se voce ja rodou uma versao antiga, pode rodar novamente.
3. Em `Config`, preencha `Project URL` e a chave pública anon/publishable.
4. Clique em `Salvar Supabase`.
5. Crie uma conta ou entre com e-mail/senha.
6. Use `Enviar local` para subir os metadados desta máquina ou `Baixar nuvem` para trazer os dados de outra máquina.
7. Ative a sincronização automática se quiser enviar mudanças novas depois do login.

Prints locais em base64 não são enviados ao Supabase. Para sincronizar imagens entre máquinas, deixe o Cloudinary configurado antes de salvar novos prints.

## Amigos E Multiplayer

A aba `Amigos` usa o Supabase para multiplayer de leitura:

- crie ou ajuste seu perfil com `Nome` e `Usuario`
- envie convite usando o usuario do amigo
- aceite ou recuse convites recebidos
- marque missoes, dinos, metas ou registros da timeline como `Amigos` ou `Compartilhado`
- clique em `Publicar agora`, ou use `Enviar local`, para atualizar o feed

O feed mostra metadados compartilhados. Prints aparecem no feed somente quando a imagem estiver no Cloudinary. Itens `Somente eu` nao sao publicados.

Esta versao nao permite edicao colaborativa da mesma missao. Amigos apenas visualizam o que foi publicado.

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
- `supabase-schema.sql`: tabelas, regras de segurança, amizades e feed em tempo real
- `SPEC.md`: melhorias implementadas e próximos caminhos
