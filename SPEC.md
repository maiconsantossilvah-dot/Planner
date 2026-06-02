# Spec de Melhorias - Jurassic Planner

## Escopo implementado

Implementado nesta rodada:

- calendário de eventos
- sistema de dinossauros
- integração de dinos com a Jurassic World: The Game Wiki / Fandom e Paleo.gg
- aba News com últimos dinos lançados do Paleo.gg
- sincronização com Supabase usando login por e-mail/senha
- imagens no Cloudinary e metadados no Supabase
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
- cópias cadastradas e nível de cada cópia
- missão ligada
- notas
- tags

## Integração Com Fontes

Fontes:

- Jurassic World: The Game Wiki / Fandom
- Paleo.gg / Jurassic World: The Game / Creatures

Fluxo:

1. Usuário abre `Novo dino`.
2. Escolhe a fonte.
3. Digita o nome do dinossauro.
4. Clica em `Buscar fonte`.
5. O app consulta a fonte escolhida.
6. No Paleo.gg, a busca fica restrita ao caminho `jurassic-world-the-game/creatures`.
7. O app mostra uma prévia dos dados encontrados.
8. O usuário clica em `Aplicar dados`.

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
- descrição traduzida para português quando disponível

## News

A aba News:

- checa o Paleo.gg sempre que a aba é aberta
- usa a base `jurassic-world-the-game/creatures`
- lista os últimos dinos lançados por data de lançamento
- mostra imagem, classe, raridade, stats, preço e link da fonte
- usa cache local quando a versão da base do Paleo.gg não mudou

## Missões Ligadas A Dinos

Missões podem ter dinos ligados. Quando todos os dinos ligados chegam ao nível desejado, e as etapas manuais também estão concluídas quando existirem, a missão é concluída automaticamente e o app mostra um aviso.

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

## Supabase E Cloudinary

O app usa dois serviços em conjunto:

- Cloudinary guarda os arquivos de imagem dos prints.
- Supabase guarda os metadados: tarefas, missões, dinos, metas, eventos, timeline, URLs do Cloudinary e `publicId`.

Fluxo:

1. Usuário configura Cloudinary em `Config`.
2. Usuário roda `supabase-schema.sql` no projeto Supabase.
3. Usuário informa Project URL e chave pública do Supabase.
4. Usuário cria conta ou entra com e-mail/senha.
5. `Enviar local` sobe os metadados locais.
6. `Baixar nuvem` substitui os dados locais pelos metadados da nuvem.
7. Sincronização automática envia mudanças depois do login.

Prints locais em base64 não são enviados ao Supabase. Eles continuam funcionando localmente, mas só viajam entre máquinas quando forem enviados ao Cloudinary.

## Tags Personalizadas

Tags podem ser usadas em:

- tarefas
- missões
- registros da timeline
- eventos do calendário
- dinossauros
- metas

## Fora Do Escopo

- multiplayer com amigos
- compartilhamento seletivo de metas, dinos e prints
- PWA/instalação como aplicativo
