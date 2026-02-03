-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS DUSHOW (SQL SERVER)

-- 1. Tabelas de Identidade (Simplificadas para o exemplo, integráveis com ASP.NET Identity)
CREATE TABLE Roles (
    Id INT PRIMARY KEY IDENTITY,
    Name NVARCHAR(50) NOT NULL
);

CREATE TABLE Users (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Email NVARCHAR(256) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    FullName NVARCHAR(256) NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1,
    AsaasCustomerId NVARCHAR(100) -- ID do Cliente no ASAAS
);

CREATE TABLE UserRoles (
    UserId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Users(Id),
    RoleId INT FOREIGN KEY REFERENCES Roles(Id),
    PRIMARY KEY (UserId, RoleId)
);

-- 2. Perfis e Gamificação
CREATE TABLE Profiles (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Users(Id),
    Bio NVARCHAR(MAX),
    ProfileType NVARCHAR(20), -- 'Professional' ou 'Client'
    AvatarUrl NVARCHAR(MAX),
    Rating DECIMAL(3,2) DEFAULT 0,
    Points INT DEFAULT 0,
    IsVerified BIT DEFAULT 0,
    IsSuperstar BIT DEFAULT 0,
    HourlyRate DECIMAL(18,2),
    Specialties NVARCHAR(MAX) -- JSON ou String separada por vírgula
);

-- 3. Planos e Assinaturas (SaaS)
CREATE TABLE Plans (
    Id INT PRIMARY KEY IDENTITY,
    Name NVARCHAR(100) NOT NULL,
    Price DECIMAL(18,2) NOT NULL,
    Features NVARCHAR(MAX),
    AsaasPlanId NVARCHAR(100)
);

CREATE TABLE Subscriptions (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Users(Id),
    PlanId INT FOREIGN KEY REFERENCES Plans(Id),
    Status NVARCHAR(50), -- 'Active', 'Overdue', 'Canceled'
    StartDate DATETIME2,
    NextBillingDate DATETIME2,
    AsaasSubscriptionId NVARCHAR(100)
);

-- 4. Eventos e Contratos
CREATE TABLE Events (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ClientId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Users(Id),
    Title NVARCHAR(256) NOT NULL,
    Description NVARCHAR(MAX),
    EventDate DATETIME2 NOT NULL,
    Location NVARCHAR(MAX),
    Status NVARCHAR(50) -- 'Open', 'InNegotiation', 'Closed'
);

CREATE TABLE Contracts (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    EventId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Events(Id),
    ProfessionalId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Users(Id),
    ClientId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Users(Id),
    Amount DECIMAL(18,2) NOT NULL,
    PlatformFee DECIMAL(18,2) NOT NULL, -- Taxa da DUSHOW
    Status NVARCHAR(50), -- 'Pending', 'Accepted', 'Paid', 'Completed', 'Disputed'
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    AsaasPaymentId NVARCHAR(100)
);

-- 5. Financeiro e ASAAS
CREATE TABLE Payments (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ContractId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Contracts(Id),
    Amount DECIMAL(18,2) NOT NULL,
    Status NVARCHAR(50), -- 'Pending', 'Confirmed', 'Refunded'
    PaymentMethod NVARCHAR(50), -- 'Boleto', 'CreditCard', 'Pix'
    AsaasTransactionId NVARCHAR(100),
    WebhookPayload NVARCHAR(MAX) -- Log do retorno do ASAAS
);

-- 6. Social e Conteúdo
CREATE TABLE Posts (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Users(Id),
    Content NVARCHAR(MAX),
    MediaUrl NVARCHAR(MAX),
    LikesCount INT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE Reviews (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ContractId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Contracts(Id),
    FromUserId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Users(Id),
    ToUserId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Users(Id),
    Score INT CHECK (Score >= 1 AND Score <= 5),
    Comment NVARCHAR(MAX),
    CreatedAt DATETIME2 DEFAULT GETDATE()
);