# 🔴⚫ Flamengo-dle

Um jogo diário no estilo "Wordle" feito sob medida para a Nação Rubro-Negra! Adivinhe o jogador misterioso do Clube de Regatas do Flamengo usando seu conhecimento sobre a história e os elencos do Mengão.

🔗 **[mengodle.com.br]**

## 🎮 Como Jogar

O objetivo é adivinhar o jogador do dia. A cada tentativa, o jogo fornece dicas visuais baseadas nos atributos do jogador escolhido (como Posição, Ano de Nascimento, Ano de Estreia e Quantidade de Jogos).

*   🟩 **Verde:** O atributo está exato.
*   🟨 **Amarelo:** O atributo é próximo ou há correspondência parcial (ex: mesma posição geral, mas lado diferente).
*   🟥 **Vermelho:** O atributo está incorreto.
*   ⬆️ / ⬇️ **Setas:** Indicam se o valor numérico do jogador misterioso (idade, jogos, ano) é maior ou menor do que o palpite atual.

> **Regra da Base de Dados:** O jogo foca na história recente e consolidada do clube. Apenas jogadores que estrearam a partir do **ano 2000** e que possuem **20 ou mais partidas oficiais** pelo Flamengo participam do sorteio diário.

## 🛠️ Tecnologias Utilizadas

Este projeto é dividido em duas frentes: a aplicação Web (Frontend) e a pipeline de coleta e limpeza de dados (ETL).

**Frontend (O Jogo):**
*   React
*   TypeScript
*   Vite
*   Tailwind CSS (ou a biblioteca de estilos que estiver usando)
*   Armazenamento em Local Storage para progresso diário.

**Engenharia de Dados (Os Bastidores):**
*   Python
*   Pandas & Regex
*   Scripts locais para web scraping, filtragem e geração automatizada de arquivos JSON estáticos e unificados.

## ⚙️ Arquitetura de Dados

O banco de dados do Flamengo-dle não é um simples arquivo baixado da internet. A pasta `codigos/` contém a pipeline completa de tratamento dos dados:
1.  **Coleta:** Raspagem dos dados históricos brutos.
2.  **Limpeza e Tipagem:** Padronização de datas, caminhos de imagens e criação de IDs únicos.
3.  **Filtragem Absoluta:** Script Python que garante que apenas jogadores dentro do escopo (Pós-2000, +20 partidas) entrem na base final.
4.  **Exportação Sincronizada:** Geração automática do banco de dados principal e do arquivo de _autocomplete_ para garantir consistência no frontend.

## 🚀 Como rodar o projeto localmente

**Pré-requisitos:**
*   Node.js instalado
*   Python 3.x (caso queira rodar os scripts de dados)

**Passo a passo:**
1. Clone o repositório:
```bash
git clone [https://github.com/Lcapp29/flamengo-dle.git](https://github.com/Lcapp29/flamengo-dle.git)
```
2. Entre na pasta do projeto:
```bash
cd flamengo-dle
```
3. Instale as dependências do Frontend:
```bash
npm install
```
4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```
5. Abra `http://localhost:5173` (ou a porta indicada pelo Vite) no seu navegador.

## 👨‍💻 Autor

Desenvolvido por **Lucas Cappola** - Engenheiro de Produção.
Se você encontrou algum bug ou tem sugestões de jogadores, sinta-se à vontade para abrir uma _Issue_ ou mandar um PR!

Saudações Rubro-Negras! 🔴⚫