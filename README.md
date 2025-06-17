# Nitro Secure Service

A secure cryptocurrency wallet service built with Node.js and TypeScript, designed to run in **Evervault Cages** for enhanced security and privacy. This service provides encrypted wallet creation, management, and transaction signing capabilities with multi-identity support.

## Description

Nitro Secure Service is a RESTful API service that provides secure cryptocurrency wallet operations using Evervault's encrypted computing platform. The service operates within secure enclaves (Cages) to ensure that sensitive wallet data, including private keys and mnemonics, are never exposed in plaintext outside the secure environment.

### Key Features

- 🔐 **Secure Wallet Creation**: Generate HD wallets with encrypted storage
- 👤 **Multi-Identity Support**: Email, phone, and service account-based wallets  
- ✍️ **Transaction Signing**: Secure Ethereum transaction signing
- 🔒 **End-to-End Encryption**: Powered by Evervault Cages
- 📤 **Wallet Export**: Secure wallet export with public key encryption
- 🛡️ **JWT Authentication**: Scope-based API access control
- ☁️ **AWS Integration**: S3 storage and Secrets Manager integration
- 🔍 **Comprehensive Testing**: Full test suite with API and service tests

## Requirements

### System Requirements
- **Node.js**: `>=22.10.0`
- **npm**: Latest version
- **Docker**: For containerized deployment

### Dependencies
- **Runtime**: Express.js, Ethers.js, Evervault SDK
- **Security**: JWT authentication, AWS SDK
- **Development**: TypeScript, ESLint, Prettier, Mocha, Chai

### Environment Setup
- Evervault account and Cage configuration
- AWS account with S3 and Secrets Manager access
- Authentication service (for JWT validation)

## How to Setup and Run

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd nitro-secure-service
npm install
```

### 2. Environment Configuration

Create a `.env` file based on the template:

```bash
cp .env.example .env
```

Configure the following environment variables:

```env
ENVIRONMENT='dev'  # Options: dev, staging, prod, test
EVERVAULT_APP_ID=your_evervault_app_id
EVERVAULT_API_KEY=your_evervault_api_key
PORT=3000
AUTH_API_URL=your_auth_service_url
AUTH_ISSUER=your_jwt_issuer
```

### 3. Development Mode

```bash
# Start development server with hot reload
npm run dev
```

### 4. Production Build

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

### 5. Docker Deployment

```bash
# Build Docker image
docker build -t nitro-secure-service .

# Run container
docker run -p 3000:3000 --env-file .env nitro-secure-service
```

The service will be available at `http://localhost:3000`

## How to Run Tests

### Full Test Suite

```bash
# Run all tests
npm test
```

### Development Testing

```bash
# Run tests with file watching (development)
npm run test:watch  # Note: Add this script if needed

# Run specific test file
npx mocha tests/api/createWallet.router.spec.ts --timeout 2000
```

### Test Categories

- **API Tests**: `/tests/api/` - Endpoint integration tests
- **Service Tests**: `/tests/services/` - Business logic unit tests
- **Application Tests**: `/tests/app.spec.ts` - HTTP status and middleware tests

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run prettier

# Security scan
npm run scan:secrets
```

## Infrastructure Tree

```
nitro-secure-service/
├── 📁 src/                          # Source code
│   ├── 📁 api/                      # API routes and controllers
│   │   ├── 📁 v1/                   # API version 1
│   │   │   └── router.ts            # Main API router
│   │   └── well-known.router.ts     # Well-known endpoints (.well-known)
│   ├── 📁 constants/                # Application constants
│   │   └── errors.ts                # Error codes and messages
│   ├── 📁 interfaces/               # TypeScript interfaces
│   │   ├── response.interface.ts    # API response types
│   │   └── wallet.interface.ts      # Wallet-related types
│   ├── 📁 services/                 # Business logic services
│   │   ├── 📁 jwk/                  # JSON Web Key management
│   │   │   ├── IJwkExternalStore.ts # JWK store interface
│   │   │   ├── jwkMemoryStore.ts    # In-memory JWK store
│   │   │   ├── jwkProvider.ts       # JWK provider service
│   │   │   ├── jwkS3Store.ts        # S3-based JWK store
│   │   │   ├── s3.config.ts         # S3 configuration
│   │   │   └── s3JobLock.service.ts # S3 job locking mechanism
│   │   ├── cage.service.ts          # Evervault Cage operations
│   │   ├── evervault.service.ts     # Evervault SDK wrapper
│   │   ├── exportWallet.service.ts  # Wallet export functionality
│   │   ├── logging.service.ts       # Logging service
│   │   ├── secrets.service.ts       # Environment secrets management
│   │   └── wallet.service.ts        # Core wallet operations
│   ├── 📁 utilities/                # Utility functions
│   │   └── requestId.ts             # Request ID middleware
│   ├── app.ts                       # Express application setup
│   ├── index.ts                     # Application entry point
│   └── scheduleJobs.ts              # Scheduled job management
├── 📁 tests/                        # Test suites
│   ├── 📁 api/                      # API integration tests
│   ├── 📁 services/                 # Service unit tests
│   ├── app.spec.ts                  # Application tests
│   ├── helper.ts                    # Test helpers
│   └── well-known.router.spec.ts    # Well-known endpoint tests
├── 📁 scripts/                      # Utility scripts
│   ├── upload-pcrs.js               # PCR upload to AWS Secrets Manager
│   ├── package.json                 # Script dependencies
│   └── yarn.lock                    # Script lock file
├── 🐳 Dockerfile                    # Container configuration
├── 📋 cage.*.toml                   # Evervault Cage configurations
├── 📋 enclave.*.toml                # Nitro Enclave configurations
├── 🔧 nodemon.json                  # Development server configuration
├── 🔧 tsconfig.json                 # TypeScript configuration
├── 📄 TEMPLATE.env                  # Environment template
└── 📦 package.json                  # Project dependencies and scripts
```

## API Endpoints

### Authentication
All endpoints require JWT authentication with appropriate scopes.

### Wallet Operations

| Method | Endpoint | Scope | Description |
|--------|----------|-------|-------------|
| `GET` | `/api/v1/version` | - | Service version |
| `POST` | `/api/v1/wallet` | `NSSWallet` | Create encrypted wallet (email/phone) |
| `POST` | `/api/v1/service/wallet` | `NSSWallet` | Create service account wallet |
| `POST` | `/api/v1/wallet/export` | `InvisibleWalletExport` | Export wallet securely |
| `POST` | `/api/v1/transaction/sign` | `NSSTransaction` | Sign Ethereum transaction |

### Well-Known Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/.well-known/jwks.json` | JSON Web Key Set |

## Security Considerations

### Evervault Cages
- All sensitive operations run within Evervault Cages
- Data is encrypted in transit and at rest
- No plaintext sensitive data leaves the secure environment

### Authentication & Authorization
- JWT-based authentication with scope verification
- Request ID tracking for audit trails
- Comprehensive logging for security monitoring

### Encryption
- Wallet data encrypted using Evervault's homomorphic encryption
- Private keys never exposed in plaintext
- Secure key derivation using HD wallet standards

## Deployment

### Environments
- **Development**: `cage.dev.toml` & `enclave.dev.toml`
- **Staging**: `cage.staging.toml` & `enclave.staging.toml`
- **Production**: `cage.prod.toml` & `enclave.prod.toml`

### PCR Management
Use the provided script to upload Platform Configuration Registers (PCRs):

```bash
cd scripts
node upload-pcrs.js ../enclave.dev.toml nitro-secure-service/dev/pcrs
```

### Health Check
```bash
curl http://localhost:3000/
# Response: {"status":"ok"}
```

## Development Guidelines

### Code Style
- TypeScript with strict type checking
- ESLint for code quality
- Prettier for consistent formatting
- Husky for pre-commit hooks

### Testing
- Write tests for all new features
- Maintain high test coverage
- Use descriptive test names
- Mock external dependencies

### Security
- Never log sensitive data
- Validate all inputs
- Use parameterized queries
- Regular security scans

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary. All rights reserved.

## Support

For issues and questions, please contact the development team or create an issue in the repository.

---

**⚠️ Security Notice**: This service handles sensitive cryptographic material. Always ensure proper security practices and never expose private keys or mnemonics outside the secure enclave environment. 