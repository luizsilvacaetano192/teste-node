# 🌾 Rural Producer API

API backend para gerenciamento de produtores rurais, utilizando Node.js, PostgreSQL e Redis com suporte a JWT e cache. Este projeto utiliza Docker e Docker Compose para facilitar o desenvolvimento e a implantação.

---

## 📦 Tecnologias Utilizadas

- [Node.js 18 (Alpine)](https://nodejs.org/)
- [NestJS](https://nestjs.com/)
- [PostgreSQL 13 (Alpine)](https://www.postgresql.org/)
- [Redis 7 (Alpine)](https://redis.io/)
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

---

## 🚀 Subindo o Projeto

### ⚙️ Pré-requisitos

- Docker instalado: [Instale o Docker](https://docs.docker.com/get-docker/)
- Docker Compose instalado: [Instale o Docker Compose](https://docs.docker.com/compose/install/)

### 📁 Clonar o repositório

```bash
git clone https://github.com/luizsilvacaetano192/teste-node.git
cd seu-repositorio

✅ Passo a passo para configurar o .env
1. Copiar o arquivo exemplo
No terminal, dentro do diretório do projeto:

cp .env.example .env
Isso criará o arquivo .env com todas as variáveis base já definidas.

📖 Explicação das Variáveis .env
Variável	Função
DB_HOST	Nome do serviço do banco definido no docker-compose.yml (não usar localhost)
DB_PORT	Porta padrão do PostgreSQL (5432)
DB_USERNAME	Usuário do banco de dados
DB_PASSWORD	Senha do banco de dados
DB_DATABASE	Nome do banco que será criado no container
PORT	Porta onde a API será executada no container
NODE_ENV	Ambiente de execução: development, production, etc.
REDIS_HOST	Nome do serviço Redis no Docker
REDIS_PORT	Porta padrão do Redis
REDIS_URL	URL completa para acesso local (para testes locais fora do Docker)
JWT_SECRET	Chave secreta usada para assinar tokens JWT

🐳 Subindo os containers com Docker Compose

docker-compose up --build
Isso irá:

Construir a imagem da aplicação (Dockerfile)

Subir os serviços:

app: aplicação Node.js (porta 3000)

db: banco PostgreSQL (porta 5432)

redis: servidor Redis (porta 6379)

Verificando se tudo está funcionando
Acesse: http://localhost:3000/health

Se estiver tudo certo, deve receber um status 200 OK.

🧪 Rodando os Testes
O projeto utiliza o Jest como framework de testes.

✅ Executar todos os testes

npm test

📚 Documentação da API (Swagger)
Este projeto possui documentação automática da API gerada com Swagger, disponível através do pacote @nestjs/swagger.

🔗 Acessando a documentação
Após iniciar o projeto, acesse no navegador:

http://localhost:3000/api
Você verá uma interface Swagger interativa com todos os endpoints da API, parâmetros, tipos de resposta, erros possíveis e exemplos.

🚀 Ambiente de Produção
A API está atualmente rodando em ambiente de produção no seguinte endereço:

🔗 http://3.87.219.25:3000/api

Essa URL oferece acesso à documentação interativa via Swagger, onde é possível visualizar e testar todos os endpoints disponíveis na API.