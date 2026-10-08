# Sistema Hospitalar & Triagem — Backend

# 1. EXPLICAÇÃO GERAL DO SISTEMA

 O projeto consiste em uma suíte de testes unitários desenvolvida em JavaScript com Jest para validar as regras de negócio centrais de um sistema de saúde. O escopo abrange três módulos principais:

- **Pirâmide de Testes:** Os testes desenvolvidos nesta suíte situam-se na base da Pirâmide de Testes, correspondendo aos testes unitários. O foco está em validar de forma isolada a lógica de negócio das classes de serviço (DoctorService, ShiftService, TriageService) sem interagir com banco de dados real, redes ou interfaces de usuário, garantindo uma suíte leve, extremamente rápida e de fácil manutenção.

- **Mocks vs. Stubs:** Utilizamos a API de simulação do Jest (jest.fn()) para aplicar Mocks e Stubs na substituição dos repositórios/modelos (mockDoctorModel, mockShiftModel, mockTriageModel). Aplicamos Stubs ao definir comportamentos e retornos pré-determinados via mockResolvedValue para simular as respostas do banco de dados. Ao mesmo tempo, aplicamos Mocks para inspecionar e validar se os métodos foram efetivamente invocados com as entradas corretas, como em expect(mockDoctorModel.create).toHaveBeenCalledWith(doctorData).

- **Padrão Factory:** O Padrão Factory foi implementado através do módulo hospitalFactory.js (com funções como createDoctorData(), createShiftData() e createTriageData()) para centralizar a criação de objetos e massa de dados de teste. Isso elimina a duplicação de código (princípio DRY), simplifica a escrita dos cenários e permite que cada teste sobrescreva apenas as propriedades necessárias para validar a sua regra de negócio específica (como alterar apenas o CRM para '111111').

---

<br>

# 2. PRINCÍPIO F.I.R.S.T
>- **F** (Fast / Rápido): Executam em milissegundos, pois dependem apenas de processamento em memória e mocks, sem chamadas de I/O ou banco de dados.
>- **I** (Independent / Isolado): Cada teste é autocontido e reseta seu estado antes da execução no bloco beforeEach, sem dependências de ordem ou estados compartilhados.
>- **R** (Repeatable / Repetível): Produzem exatamente os mesmos resultados em qualquer ambiente de desenvolvimento ou esteira de CI/CD, por utilizarem dados determinísticos gerados pelas factories.
>- **S** (Self-validating / Auto-validável): Usam asserções declarativas do Jest (expect(...).toEqual(), rejects.toThrow()) que indicam claramente o resultado (aprovado ou reprovado) sem necessidade de inspeção manual.
>- **T** (Thorough/Timely / Abrangente): Cobrem tanto o **"caminho feliz"** (sucesso no cadastro) quanto os cenários de exceção e limites das regras (como duração do plantão acima de 24h ou choque de horários).
---

<br>

# 3. Como Executar

### Pré-requisitos
- Node.js (LTS) e Git
- MySQL ou MariaDB rodando localmente

### Instalação
```bash
npm install
npx prisma generate
npx prisma migrate dev --name criacao_das_tabelas   # ou: npx prisma db push
npm run dev
```

### Rodando os testes
```bash
npm test                 # roda a suíte
npm test -- --coverage    # roda a suíte com cobertura (mínimo exigido: 80%) 
```
<br>

# 4. Cobertura de Testes e Qualidade de Código

A suíte do projeto é composta por **53 testes unitários** isolados por mocks (hospitalFactory), sem dependência de banco de dados ativo ou chamadas HTTP reais. A meta de cobertura global estipulada em **≥ 80%** foi superada com sucesso.

### Tabela de Cobertura de Código


| Módulo / Serviço | % Instruções (% Stmts) | % Ramificações (% Branch) | % Funções (% Funcs) | % Linhas (% Lines) | Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| triageService.js | 98.36% | 98.00% | 91.66% | 98.33% | 🟢 Excelente |
| shiftService.js | 91.48% | 80.76% | 90.00% | 91.30% | 🟢 Excelente |
| doctorService.js | 80.00% | 53.57% | 100.00% | 79.48% | 🟢 Aprovado |
| **Geral** | **91.21%** | **81.73%** | **93.33%** | **91.03%** | **Meta Superada** |


---

### Análise Crítica dos Cenários Testados


A suíte de testes unitários foi projetada para cobrir tanto o fluxo principal (happy path) quanto os cenários de erro e casos de borda (edge cases):


#### 1. Gestão de Plantões (shiftService.js)
**Validação Temporal e Limites de Jornada:** Rejeição imediata de agendamentos com duração superior a 24 horas, bem como horários onde a data de início é igual ou posterior à data de término.
**Prevenção de Choque de Horários (Overlap):** Verificação de sobreposição de agenda para impedir que o mesmo médico seja alocado em múltiplos plantões no mesmo intervalo de tempo.
**Integridade do Profissional:** Bloqueio de agendamentos associados a médicos inexistentes ou com status inativo no sistema.
#### 2. Regras e Validações de CRM (doctorService.js)
**Formatação Rígida:** Validação via expressão regular para o formato do CRM (4 a 7 dígitos) e verificação de Unidades Federativas (UF) válidas.
**Prevenção de Dígitos Repetidos:** Bloqueio de cadastros com números inválidos ou repetidos (ex.: 111111).
**Unicidade de CRM:** Garantia de erro de conflito (HTTP 409) ao tentar cadastrar combinações duplicadas de CRM + UF.
#### 3. Classificação de Risco e Triagem (triageService.js)
**Sinais Vitais e Prioridade:** Validação dos critérios de pontuação baseados na variação de sinais vitais (pressão arterial, frequência cardíaca, oxigenação e temperatura).
**Tratamento e Propagação de Erros:** Mapeamento e retorno correto de códigos de exceção HTTP (400, 404, 409, 422) ao identificar falhas ou dados inválidos nas camadas de entrada.

<br>

# 5. Estrutura de Arquivos

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

## tests/factories

| Arquivo | O que faz |
|---|---|
| `hospitalFactory.js` | Suporte a overrides, para garantir mocks consistentes e reutilizáveis de Médicos, Plantões e Triagens em todos os testes unitários. |

## tests/

| Arquivo | O que faz |
|---|---|
| `doctorService.tes.js` | Teste de CRM e validações de negócio dos médicos |
| `shiftService.tes.js` | Teste de negócio dos Plantões |
| `triageService.tes.js` | Teste da fila de atendimento e de negócio da Triagem |
