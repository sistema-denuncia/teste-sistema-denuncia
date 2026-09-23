# 🚨 Sistema de Denúncia e Emergência

Sistema web desenvolvido para registrar **acionamentos de emergência** e encaminhá-los para um **sistema de gerenciamento policial**.

O projeto é dividido em duas aplicações Node.js:

* **Botão de Emergência Web** — interface utilizada pelo cidadão para realizar um acionamento.
* **Sistema Polícia Backend** — servidor responsável por receber, armazenar e gerenciar os alertas, além de disponibilizá-los em tempo real para o painel policial.

O sistema utiliza **SQLite** para persistência dos dados e **Socket.IO** para comunicação em tempo real.

---

## 📌 Funcionalidades

### 👤 Botão de Emergência

* Interface web para acionamento de emergência.
* Envio de identificador do cliente.
* Envio do tipo de emergência.
* Definição de prioridade.
* Envio de informações do dispositivo.
* Envio de localização por latitude e longitude.
* Comunicação com o backend da polícia.
* Limitação de requisições para evitar múltiplos acionamentos abusivos.
* Verificação da disponibilidade do serviço.

### 👮 Sistema da Polícia

* Recebimento dos acionamentos.
* Geração automática de protocolo.
* Armazenamento dos alertas em SQLite.
* Identificação de acionamentos duplicados.
* Contagem de múltiplos acionamentos do mesmo cliente.
* Consulta dos alertas registrados.
* Consulta individual de uma ocorrência.
* Alteração do status da ocorrência.
* Registro de observações.
* Registro da localização.
* Registro do IP de origem.
* Painel atualizado em tempo real através do Socket.IO.
* Contagem de usuários conectados.
* Endpoint de saúde do sistema.
* Autenticação do supervisor.
* Proteção da API através de chave de acesso.

---

## 🏗️ Estrutura do Projeto

```text
teste-sistema-denuncia/
│
├── botao-emergencia-web/
│   │
│   ├── public/
│   │   ├── client.js
│   │   ├── index.html
│   │   ├── login-usuario.html
│   │   ├── script.js
│   │   ├── style.css
│   │   └── styles.css
│   │
│   ├── routes/
│   │   ├── alertas.js
│   │   └── emergencia.js
│   │
│   ├── .env.example
│   ├── banco.sql
│   ├── db.js
│   ├── package.json
│   └── server.js
│
├── sistema-policia-backend/
│   │
│   ├── database/
│   │   ├── database.js
│   │   ├── emergencia.db
│   │   └── schema.sql
│   │
│   ├── public/
│   │   ├── adm-sistema.html
│   │   ├── cadastrar-agente.html
│   │   ├── client.js
│   │   ├── index.html
│   │   └── style.css
│   │
│   ├── routes/
│   │   └── emergencias.js
│   │
│   ├── .env.example
│   ├── banco.sql
│   ├── db.js
│   ├── package.json
│   └── server.js
│
└── README.md
```

---

# 🔄 Funcionamento do Sistema

O fluxo principal da aplicação funciona da seguinte maneira:

```text
┌─────────────────────┐
│       Usuário       │
│                     │
│ Botão de Emergência │
└──────────┬──────────┘
           │
           │ POST /api/emergencia
           ▼
┌─────────────────────┐
│ Botão de Emergência │
│      Web            │
│     :3000           │
└──────────┬──────────┘
           │
           │ X-API-Key
           │
           ▼
┌─────────────────────┐
│ Backend da Polícia  │
│       :3001         │
└──────────┬──────────┘
           │
           ├──────────────► SQLite
           │
           │
           └──────────────► Socket.IO
                                  │
                                  ▼
                         ┌─────────────────┐
                         │ Painel Policial │
                         └─────────────────┘
```

Quando o usuário realiza um acionamento:

1. O navegador envia os dados para o servidor do botão de emergência.
2. O servidor valida o acionamento.
3. O servidor encaminha a solicitação para o backend da polícia.
4. O backend autentica a requisição através da `X-API-Key`.
5. A ocorrência é registrada no SQLite.
6. Um protocolo é gerado automaticamente.
7. O alerta é enviado aos clientes conectados através do Socket.IO.
8. O painel policial recebe a ocorrência em tempo real.

---

# 🛠️ Tecnologias Utilizadas

## Backend

* [Node.js](https://nodejs.org/)
* [Express](https://expressjs.com/)
* [SQLite](https://www.sqlite.org/)
* [Socket.IO](https://socket.io/)
* UUID
* dotenv
* express-rate-limit

## Frontend

* HTML5
* CSS3
* JavaScript

## Banco de Dados

O sistema policial utiliza:

```text
SQLite
```

O banco é criado automaticamente em:

```text
sistema-policia-backend/database/emergencia.db
```

---

# 📋 Pré-requisitos

Antes de executar o projeto, é necessário possuir:

* Node.js instalado
* npm instalado
* Git, caso o projeto seja clonado através do Git

Para verificar:

```bash
node --version
npm --version
```

---

# 📥 Instalação

Clone o repositório:

```bash
git clone https://github.com/evertongodoy/aula-git-compras.git
```

Entre na pasta do projeto:

```bash
cd aula-git-compras
```

> Caso o projeto esteja hospedado em outro repositório, substitua a URL acima pela URL correspondente.

---

# ⚙️ Configuração do Backend da Polícia

Entre na pasta:

```bash
cd sistema-policia-backend
```

Instale as dependências:

```bash
npm install
```

Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

No Windows, o arquivo também pode ser criado manualmente copiando:

```text
.env.example
```

para:

```text
.env
```

Exemplo de configuração:

```env
PORT=3001

POLICIA_API_KEY=desenvolvimento-local

SUPERVISOR_LOGIN=supervisor
SUPERVISOR_SENHA=Supervisor@123

PAINEL_ORIGIN=*

TRUST_PROXY=false

EMERGENCIA_RATE_LIMIT=30
```

---

# ⚙️ Configuração do Botão de Emergência

Em outro terminal, entre na pasta:

```bash
cd botao-emergencia-web
```

Instale as dependências:

```bash
npm install
```

Crie o arquivo `.env`:

```bash
cp .env.example .env
```

Configure a comunicação com o backend:

```env
PORT=3000

POLICIA_SERVER_URL=http://localhost:3001

POLICIA_API_KEY=desenvolvimento-local

POLICIA_TIMEOUT_MS=5000

EMERGENCIA_RATE_LIMIT=10
```

A chave:

```env
POLICIA_API_KEY
```

deve ser a mesma utilizada no backend da polícia.

---

# ▶️ Executando o Projeto

O projeto possui dois servidores que precisam estar em execução.

## 1. Backend da Polícia

Na pasta:

```bash
cd sistema-policia-backend
```

Execute:

```bash
npm start
```

O servidor será iniciado em:

```text
http://localhost:3001
```

O banco SQLite será criado automaticamente na primeira execução.

---

## 2. Botão de Emergência

Abra outro terminal:

```bash
cd botao-emergencia-web
```

Execute:

```bash
npm start
```

O servidor será iniciado em:

```text
http://localhost:3000
```

---

# 🌐 Endereços

Após iniciar os dois servidores:

| Serviço             | Endereço                          |
| ------------------- | --------------------------------- |
| Botão de emergência | `http://localhost:3000`           |
| Sistema policial    | `http://localhost:3001`           |
| Saúde do botão      | `http://localhost:3000/api/saude` |
| Saúde da polícia    | `http://localhost:3001/api/saude` |

---

# 🗄️ Banco de Dados

O sistema policial utiliza SQLite.

O banco é criado automaticamente em:

```text
sistema-policia-backend/database/emergencia.db
```

A tabela principal é:

```text
alertas_policia
```

Entre os dados armazenados estão:

* ID da ocorrência
* Número do protocolo
* ID do cliente
* Tipo da emergência
* Status
* Prioridade
* Quantidade de acionamentos
* Latitude
* Longitude
* Dispositivo
* IP de origem
* Origem do alerta
* Observações
* Data de criação
* Data de atualização
* Data de encerramento

O SQLite também utiliza índices para facilitar consultas por status, tipo e data.

---

# 🚨 Status das Ocorrências

As ocorrências podem possuir os seguintes estados:

| Status           | Descrição                                  |
| ---------------- | ------------------------------------------ |
| `ATIVO`          | Ocorrência recebida e ainda não atendida   |
| `EM_ATENDIMENTO` | Ocorrência sendo atendida                  |
| `RESOLVIDO`      | Ocorrência finalizada                      |
| `FALSO_ALARME`   | Acionamento identificado como falso alarme |

---

# 🔴 Prioridades

Os alertas podem possuir quatro níveis de prioridade:

```text
BAIXA
MEDIA
ALTA
CRITICA
```

Caso nenhuma prioridade válida seja enviada, o sistema utiliza:

```text
ALTA
```

como padrão.

---

# 🔌 API

## Criar emergência

```http
POST /api/emergencia
```

O endpoint recebe dados como:

```json
{
  "clienteId": "cliente-001",
  "tipo": "EMERGENCIA",
  "prioridade": "ALTA",
  "dispositivo": "Windows - Chrome",
  "localizacao": {
    "latitude": -21.7946,
    "longitude": -48.1756
  }
}
```

A requisição precisa utilizar:

```http
X-API-Key: desenvolvimento-local
```

### Resposta

```json
{
  "sucesso": true,
  "mensagem": "Alerta recebido com sucesso.",
  "id": "uuid-da-ocorrencia",
  "protocolo": "EMERG-20260923190000-123"
}
```

---

## Listar ocorrências

```http
GET /api/emergencia
```

Também é possível filtrar por status:

```http
GET /api/emergencia?status=ATIVO
```

---

## Consultar uma ocorrência

```http
GET /api/emergencia/:id
```

---

## Alterar status

```http
PATCH /api/emergencia/:id/status
```

Exemplo:

```json
{
  "status": "EM_ATENDIMENTO",
  "observacoes": "Equipe encaminhada para o local."
}
```

---

# 🔐 Autenticação do Supervisor

O backend possui uma rota para autenticação do supervisor:

```http
POST /api/auth/supervisor
```

Exemplo:

```json
{
  "login": "supervisor",
  "senha": "Supervisor@123"
}
```

As credenciais podem ser alteradas através do arquivo `.env`.

> Para ambientes reais, recomenda-se utilizar credenciais fortes e não manter valores padrão.

---

# 📡 Comunicação em Tempo Real

O sistema utiliza **Socket.IO** para atualizar o painel policial sem a necessidade de atualizar a página manualmente.

Quando uma nova ocorrência é registrada, o backend emite:

```text
novo-alerta
```

Quando uma ocorrência é atualizada:

```text
alerta-atualizado
```

O sistema também informa a quantidade de usuários conectados através do evento:

```text
usuarios-conectados
```

Ao conectar, o cliente recebe os últimos alertas através do evento:

```text
carregar-alertas
```

---

# 🩺 Verificação de Saúde

O backend disponibiliza:

```http
GET /api/saude
```

Uma resposta bem-sucedida possui informações como:

```json
{
  "sucesso": true,
  "servidor": "online",
  "banco": "online",
  "bancoTipo": "SQLite"
}
```

Esse endpoint pode ser utilizado para verificar se o servidor e o banco estão funcionando.

---

# 🛡️ Segurança

O projeto possui alguns mecanismos básicos de proteção:

### API Key

A comunicação entre o botão de emergência e o backend utiliza:

```text
X-API-Key
```

### Rate Limit

Os endpoints de emergência possuem limite de requisições para reduzir abusos e múltiplos acionamentos excessivos.

### Validação de localização

Latitude e longitude são verificadas antes de serem armazenadas.

### Limitação de dados

Alguns campos possuem limites de tamanho para evitar o envio de dados excessivamente grandes.

### Variáveis de ambiente

Informações como chaves e credenciais devem ser configuradas através do `.env`.

Os arquivos `.env` não devem ser enviados para o GitHub.

---

# 🔁 Tratamento de Acionamentos Duplicados

O sistema identifica um acionamento já existente através do:

```text
clienteId
```

Quando o mesmo cliente realiza um novo acionamento, em vez de criar uma nova ocorrência, o sistema incrementa:

```text
quantidade_acionamentos
```

Dessa forma, vários acionamentos relacionados ao mesmo cliente podem ser contabilizados na mesma ocorrência.

---

# 🧪 Ambiente de Desenvolvimento

Para executar utilizando `nodemon`, utilize:

```bash
npm run dev
```

Isso permite que o servidor seja reiniciado automaticamente após alterações nos arquivos.

---

# 📁 Scripts Disponíveis

Nos dois projetos existem os seguintes comandos:

```bash
npm start
```

Inicia o servidor normalmente.

```bash
npm run dev
```

Inicia o servidor utilizando `nodemon`.

---

# 🧩 Organização da Aplicação

O projeto segue uma separação básica entre:

```text
Frontend
   │
   ▼
Express Server
   │
   ▼
Routes
   │
   ▼
Database / Serviços
```

O sistema policial possui uma arquitetura independente do botão de emergência, permitindo que os dois componentes sejam executados separadamente.

---

# 📊 Fluxo de uma Ocorrência

```text
1. Usuário acessa o sistema
          │
          ▼
2. Usuário realiza acionamento
          │
          ▼
3. Botão de emergência recebe a requisição
          │
          ▼
4. Rate limit e validações
          │
          ▼
5. Solicitação enviada ao backend policial
          │
          ▼
6. API Key é validada
          │
          ▼
7. Dados são validados
          │
          ▼
8. Ocorrência é registrada no SQLite
          │
          ▼
9. Protocolo é gerado
          │
          ▼
10. Socket.IO envia o alerta
          │
          ▼
11. Painel policial recebe a ocorrência
          │
          ▼
12. Agente atualiza o status
          │
          ▼
13. Ocorrência é encerrada
```

---

# ⚠️ Observações

Este projeto possui finalidade acadêmica e de desenvolvimento.

Para utilização em um ambiente real, seriam necessários mecanismos adicionais de segurança, autenticação, autorização, criptografia, auditoria, proteção de dados, gerenciamento de usuários e infraestrutura adequada.

As credenciais presentes nos arquivos de exemplo são destinadas ao desenvolvimento local e devem ser alteradas antes de qualquer implantação real.

---

# 👨‍💻 Projeto

Sistema desenvolvido como projeto de estudo envolvendo:

* Desenvolvimento Web
* Node.js
* APIs REST
* Banco de Dados
* SQLite
* Comunicação em tempo real
* Autenticação
* Segurança de APIs
* Gerenciamento de ocorrências

---

## 📄 Licença

Este projeto é destinado a fins educacionais.
