# Sistema Hospitalar & Triagem — Backend

Explicação do que faz cada arquivo do projeto.

## Raiz

| Arquivo | O que faz |
|---|---|
| `server.js` | Sobe o servidor Express, configura `cors` e `express.json()` e registra todas as rotas. |
| `db.js` | Conexão do Prisma com o MySQL/MariaDB (não alterar). |
| `package.json` | Dependências e scripts (`dev`, `start`, `test`, `test:coverage`). Usa `"type": "module"` para ES Modules. |
| `jest.config.js` | Configuração do Jest: lê a pasta `tests/`, mede cobertura em `src/services` e exige mínimo de 80%. |
| `env.example` | Modelo das variáveis de ambiente (banco de dados, porta e `JWT_SECRET`). |
| `prisma7.config.ts` | Configuração do Prisma 7 (caminho do schema, das migrations e `DATABASE_URL`). |
| `.gitignore` | Impede o envio de `node_modules`, `.env` e `coverage` para o Git. |

## prisma/

| Arquivo | O que faz |
|---|---|
| `schema.prisma` | Define as tabelas: `users`, `doctors`, `patients`, `shifts` (plantões) e `triages` (triagens/fila). |

## src/constants/

| Arquivo | O que faz |
|---|---|
| `hospital.js` | Valores fixos: lista de UFs válidas para o CRM, status da triagem, prioridades do Protocolo de Manchester (com ordem e SLA em minutos) e duração máxima do plantão. |

## src/models/ (acesso ao banco com Prisma)

| Arquivo | O que faz |
|---|---|
| `userModel.js` | Busca usuário por e-mail (login) e cria usuário. |
| `doctorModel.js` | Listar, buscar por ID, buscar por CRM, criar, editar e deletar médicos. |
| `patientModel.js` | Listar, buscar por ID, buscar por CPF, criar, editar e deletar pacientes. |
| `shiftModel.js` | CRUD de plantões, busca plantões de um médico e busca o plantão ativo no momento. |
| `triageModel.js` | Listar triagens, buscar por ID ou status, achar triagem aberta de um paciente, achar atendimento em andamento de um médico, criar e atualizar. |

## src/services/ (regras de negócio, alvo dos testes)

| Arquivo | O que faz |
|---|---|
| `doctorService.js` | Valida o CRM (4 a 7 dígitos, sem dígitos todos iguais, UF existente) e impede CRM duplicado no cadastro e na edição. |
| `shiftService.js` | Valida o período do plantão (fim depois do início, máximo de 24h) e bloqueia choque de plantões do mesmo médico. |
| `triageService.js` | Classifica a prioridade (Manchester) pelos sinais vitais, monta a fila ordenada com SLA, permite ao médico chamar o próximo paciente (precisa estar em plantão) e finalizar o atendimento. |

## src/controllers/

| Arquivo | O que faz |
|---|---|
| `authController.js` | Registro de usuário (senha com bcrypt) e login (gera token JWT). |
| `doctorController.js` | Recebe as requisições de médicos e chama o `doctorService`. |
| `patientController.js` | CRUD de pacientes direto nos models, com checagem de CPF duplicado. |
| `shiftController.js` | Recebe as requisições de plantões e chama o `shiftService`. |
| `triageController.js` | Recebe as requisições de triagem, fila, chamada e finalização e chama o `triageService`. |

## src/routes/

| Arquivo | O que faz |
|---|---|
| `authRoutes.js` | `POST /auth/register` e `POST /auth/login`. |
| `doctorRoutes.js` | Rotas `/doctors` (protegidas por token). |
| `patientRoutes.js` | Rotas `/patients` (protegidas por token). |
| `shiftRoutes.js` | Rotas `/shifts` (protegidas por token). |
| `triageRoutes.js` | Rotas `/triages`, incluindo `/queue`, `/call-next` e `/:id/finish` (protegidas por token). |

## src/schemas/ (validação de entrada com Zod)

| Arquivo | O que faz |
|---|---|
| `authSchema.js` | Valida o corpo de registro e login. |
| `doctorSchema.js` | Valida o corpo de médicos e o ID da URL. |
| `patientSchema.js` | Valida o corpo de pacientes (CPF com 11 dígitos) e o ID da URL. |
| `shiftSchema.js` | Valida o corpo de plantões e o ID da URL. |
| `triageSchema.js` | Valida os sinais vitais da triagem, o corpo de `call-next` e o ID da URL. |

## src/middleware/

| Arquivo | O que faz |
|---|---|
| `authMiddleware.js` | Lê o token `Authorization: Bearer`, valida o JWT e bloqueia requisições sem credencial (401). |
| `validateMiddleware.js` | `validate` valida o body e `validateParams` valida os parâmetros da URL usando os schemas do Zod (400 se inválido). |

## tests/

Pasta vazia, reservada para os testes e as factories.
