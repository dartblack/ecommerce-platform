# E-commerce Platform

A modern, microservices-based e-commerce platform built with Laravel (Admin Service) and NestJS (API Gateway), featuring
a comprehensive admin panel, RESTful APIs, GraphQL support, and real-time order management.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Design Decisions](#design-decisions)
- [Services](#services)

## Architecture Overview

This platform follows a **microservices architecture** pattern with the following key components:

- **Admin Service** (Laravel): Admin panel and internal APIs for product, inventory, and order management
- **API Gateway** (NestJS): Public-facing API gateway providing REST and GraphQL endpoints
- **Nginx**: Reverse proxy routing requests to appropriate services
- **PostgreSQL**: Primary database for both services
- **Redis**: Caching, sessions, and message queues
- **Elasticsearch**: Product search and indexing
- **MailHog**: Development email testing

## Tech Stack

### Admin Service

- **Framework**: Laravel 12 (PHP 8.4)
- **Frontend**: Inertia.js + Vue.js 3
- **Authentication**: Laravel Sanctum + JWT
- **UI**: Laravel Jetstream, Tailwind CSS

### API Gateway

- **Framework**: NestJS 11 (TypeScript/Node.js)
- **API Styles**: REST + GraphQL (Apollo)
- **Pattern**: CQRS (Command Query Responsibility Segregation)
- **Authentication**: Passport.js (JWT)
- **Database ORM**: TypeORM

### Infrastructure

- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx
- **Database**: PostgreSQL 15
- **Cache/Queue**: Redis 7
- **Search**: Elasticsearch 8.11.3

## Setup Instructions

### Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose)
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/dartblack/ecommerce-platform.git
   cd ecommerce-platform
   ```

2. **Start all services**
   ```bash
   docker-compose up -d --build
   ```

3. **Install dependencies and run migrations (Admin Service)**
   ```bash
   docker-compose exec admin-service composer install
   docker-compose exec admin-service php artisan migrate
   docker-compose exec admin-service php artisan db:seed
   ```

4. **Install dependencies and run migrations (API Gateway)**
   ```bash
   docker-compose exec api-gateway npm install
   docker-compose exec api-gateway npm run migration:run
   ```

5. **Build frontend assets (Admin Service)**
   ```bash
   docker-compose exec admin-service npm install
   docker-compose exec admin-service npm run build
   ```

### Service URLs

Once all services are running, access the following:

- **Admin Panel**: http://localhost (routed via Nginx)
- **Admin Service API**: http://localhost:8000/admin-api/v1
- **API Gateway REST API**: http://localhost:3000/api
- **API Gateway GraphQL Playground**: http://localhost:3000/api/graphql
- **API Gateway Swagger Docs**: http://localhost:3000/api/docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Elasticsearch**: localhost:9200
- **Kibana**: http://localhost:5601
- **MailHog Web UI**: http://localhost:8025

### Admin Credentials

- Email: admin@example.com
- Password: pass123456

### Environment Variables

Key environment variables are configured in `docker-compose.yml`. For production, consider:

1. Creating `.env` files for each service
2. Using secure API keys (change `SERVICE_API_KEY` and `API_KEY_SECRET`)
3. Configuring proper database credentials
4. Setting up proper mail configuration

### Common Commands

**View logs**

```bash
docker-compose logs -f [service-name]
```

**Stop all services**

```bash
docker-compose down
```

**Stop and remove volumes**

```bash
docker-compose down -v
```

**Restart a specific service**

```bash
docker-compose restart [service-name]
```

**Execute commands in containers**

```bash
# Admin Service
docker-compose exec admin-service php artisan [command]
docker-compose exec admin-service composer [command]

# API Gateway
docker-compose exec api-gateway npm run [command]
```

## API Documentation

### API Gateway Endpoints

The API Gateway provides both REST and GraphQL APIs. All endpoints are prefixed with `/api`.

#### Authentication

**POST** `/api/auth/login`

- **Description**: User login
- **Body**: `{ "email": "string", "password": "string" }`
- **Response**: JWT token and user information

#### Products (REST)

**GET** `/api/products`

- **Description**: Get products list with pagination and filters
- **Query Parameters**: `page`, `limit`, `category`, `search`, `sort`, `stockStatus`
- **Auth**: Public
- **Response**: Paginated list of products

**GET** `/api/products/:id`

- **Description**: Get single product by ID
- **Auth**: Public
- **Response**: Product details

**POST** `/api/products`

- **Description**: Create a new product (Admin only)
- **Auth**: Bearer Token (Admin role required)
- **Body**: Multipart form data with product fields and optional image
- **Response**: Job ID for async processing

**PUT** `/api/products/:id`

- **Description**: Update a product (Admin only)
- **Auth**: Bearer Token (Admin role required)
- **Body**: Multipart form data with product fields and optional image
- **Response**: Job ID for async processing

#### Orders (REST)

**POST** `/api/orders`

- **Description**: Create a new order
- **Auth**: Bearer Token (JWT required)
- **Body**: Order items, shipping address, payment details
- **Response**: Created order

**GET** `/api/orders`

- **Description**: Get orders list (filtered by authenticated user)
- **Auth**: Bearer Token (JWT required)
- **Query Parameters**: `status`, `page`, `limit`
- **Response**: Paginated list of orders

**GET** `/api/orders/:id`

- **Description**: Get order by ID
- **Auth**: Bearer Token (JWT required)
- **Response**: Order details

**PUT** `/api/orders/:id/cancel`

- **Description**: Cancel an order
- **Auth**: Bearer Token (JWT required)
- **Body**: `{ "reason": "string" }` (optional)
- **Response**: Cancelled order

**POST** `/api/orders/:id/confirm-payment`

- **Description**: Confirm payment for order (mock payment)
- **Auth**: Bearer Token (JWT required)
- **Response**: Payment confirmation

#### GraphQL API

The API Gateway also exposes a GraphQL endpoint at `/api/graphql` with a playground available for interactive querying.
GraphQL schema includes:

- Product queries and mutations
- Order queries and mutations
- Full type definitions with relationships

**GraphQL Playground**: http://localhost:3000/api/graphql

**Swagger Documentation**: http://localhost:3000/api/docs

### Admin Service API Endpoints

The Admin Service exposes internal APIs for service-to-service communication.

#### Public Authentication

**POST** `/admin-api/v1/auth/register`

- **Description**: Register a new user
- **Auth**: None
- **Body**: User registration data

**POST** `/admin-api/v1/auth/login`

- **Description**: Login and get JWT token
- **Auth**: None
- **Body**: `{ "email": "string", "password": "string" }`
- **Response**: JWT token

#### Protected Endpoints (JWT or API Key)

**GET** `/admin-api/v1/auth/me`

- **Description**: Get current user information
- **Auth**: Bearer Token (JWT)

**POST** `/admin-api/v1/auth/refresh`

- **Description**: Refresh JWT token
- **Auth**: Bearer Token (JWT)

**POST** `/admin-api/v1/auth/logout`

- **Description**: Logout (invalidate token)
- **Auth**: Bearer Token (JWT)

#### Products

**GET** `/admin-api/v1/products/:id`

- **Description**: Get product by ID
- **Auth**: Bearer Token (JWT) or API Key (`X-API-Key` header)

**POST** `/admin-api/v1/products/batch`

- **Description**: Get multiple products by IDs
- **Auth**: Bearer Token (JWT) or API Key
- **Body**: `{ "ids": [1, 2, 3] }`

**POST** `/admin-api/v1/admin/products`

- **Description**: Create product (Admin only)
- **Auth**: Bearer Token (JWT Admin) or API Key

**PUT** `/admin-api/v1/admin/products/:id`

- **Description**: Update product (Admin only)
- **Auth**: Bearer Token (JWT Admin) or API Key

#### Internal Service APIs (API Key Only)

These endpoints are for service-to-service communication and require the `X-API-Key` header.

**POST** `/admin-api/internal/inventory/deduct-for-order`

- **Description**: Deduct inventory for an order
- **Body**: Order items and quantities

**POST** `/admin-api/internal/orders/sync`

- **Description**: Sync order from API Gateway to Admin Service
- **Body**: Order data

**PUT** `/admin-api/internal/orders/:orderNumber/status`

- **Description**: Update order status
- **Body**: Status and optional tracking information

**PUT** `/admin-api/internal/orders/:orderNumber/cancel`

- **Description**: Cancel order
- **Body**: Cancellation reason

### Authentication

#### JWT Authentication

- JWT tokens are issued by both services
- Tokens include user ID, email, and role
- Token expiration: 24 hours (configurable)
- Include token in `Authorization: Bearer <token>` header

#### API Key Authentication (Service-to-Service)

- Used for internal service communication
- Include an API key in `X-API-Key` header
- Configured via `SERVICE_API_KEY` / `API_KEY_SECRET` environment variables

## Design Decisions

### 1. Microservices Architecture

**Decision**: Separate Admin Service (Laravel) and API Gateway (NestJS) as independent microservices.

**Rationale**:

- **Separation of Concerns**: Admin operations (internal) vs. public-facing APIs
- **Technology Fit**: Laravel excels at admin panels with Jetstream/Inertia, NestJS provides robust API gateway
  capabilities
- **Scalability**: Services can scale independently based on a load
- **Team Autonomy**: Different teams can work on different services

**Trade-offs**:

- Increased complexity in deployment and communication
- Need for service coordination (solved via an API Gateway pattern)

### 2. API Gateway Pattern

**Decision**: Implement a dedicated API Gateway service (NestJS) as the single entry point for external clients.

**Rationale**:

- **Single Point of Entry**: Clients interact with one API endpoint
- **Request Routing**: Gateway routes requests to appropriate backend services
- **Cross-Cutting Concerns**: Centralized authentication, rate limiting, logging
- **API Versioning**: Easier to manage API versions
- **Protocol Translation**: Supports both REST and GraphQL from one gateway

### 3. CQRS (Command Query Responsibility Segregation)

**Decision**: Implement CQRS pattern in the API Gateway for orders and products.

**Rationale**:

- **Separation of Read/Write Models**: Optimize queries independently of commands
- **Scalability**: Read and write operations can scale separately
- **Complex Business Logic**: Orders involve multiple steps (create → payment → inventory → sync)
- **Event Sourcing Ready**: Easy to extend with event sourcing if needed

**Implementation**:

- Commands: `CreateOrderCommand`, `UpdateOrderStatusCommand`, `CancelOrderCommand`
- Queries: `GetOrderQuery`, `GetOrdersQuery`
- Handlers process commands/queries independently

### 4. Event-Driven Architecture

**Decision**: Use events and event handlers for cross-service communication and async processing.

**Rationale**:

- **Loose Coupling**: Services communicate via events, not direct calls
- **Async Processing**: Non-critical operations (emails, search indexing) happen asynchronously
- **Resilience**: If one service is down, events can be queued and processed later
- **Extensibility**: Easy to add new event listeners without modifying existing code

**Examples**:

- Order created → triggers inventory deduction, email notifications, Elasticsearch sync
- Product updated → triggers Elasticsearch re-indexing

### 5. Dual Authentication Strategy

**Decision**: Support both JWT tokens (user-facing) and API keys (service-to-service).

**Rationale**:

- **JWT for Users**: Standard authentication for end-users and admin panel
- **API Keys for Services**: Secure, simple authentication for internal service calls
- **Flexibility**: Different authentication methods for different use cases
- **Security**: API keys are rotated less frequently, stored securely in environment variables

### 6. Elasticsearch for Product Search

**Decision**: Use Elasticsearch for product search and indexing instead of database queries.

**Rationale**:

- **Performance**: Full-text search is much faster than SQL `LIKE` queries
- **Advanced Features**: Faceted search, fuzzy matching, relevance scoring
- **Scalability**: Elasticsearch handles large product catalogs efficiently
- **Real-time Sync**: Products are indexed asynchronously after creation/updates

### 7. Redis for Multiple Purposes

**Decision**: Use Redis for caching, sessions, and message queues.

**Rationale**:

- **Unified Infrastructure**: One service for multiple needs reduces complexity
- **Performance**: In-memory storage provides fast access
- **Persistence**: Redis persistence ensures data durability
- **Message Queues**: BullMQ (built on Redis) handles async job processing

### 8. Queue-Based Job Processing

**Decision**: Process heavy operations (product creation, email sending, Elasticsearch sync) asynchronously via queues.

**Rationale**:

- **Response Time**: API responds immediately, heavy work happens in the background
- **Reliability**: Failed jobs can be retried automatically
- **Scalability**: Multiple queue workers can process jobs in parallel
- **User Experience**: Admin panel doesn't freeze during bulk operations

### 9. Nginx as Reverse Proxy

**Decision**: Use Nginx to route traffic between the admin panel and API gateway.

**Rationale**:

- **Single Port**: Clients access everything via port 80/443
- **Routing Logic**: `/api/*` → API Gateway, `/` → Admin Service
- **Load Balancing**: Can be extended to load balance across multiple instances
- **SSL Termination**: Single point for SSL/TLS configuration

### 10. Database Separation

**Decision**: Use separate databases for Admin Service and API Gateway, but share PostgreSQL instance.

**Rationale**:

- **Data Isolation**: Each service owns its data model
- **Independent Evolution**: Schema changes don't affect other services
- **Service Boundaries**: Clear boundaries prevent tight coupling
- **Cost Efficiency**: Single PostgreSQL instance with multiple databases

### 11. GraphQL + REST Hybrid

**Decision**: Expose both REST and GraphQL APIs from the API Gateway.

**Rationale**:

- **Flexibility**: Clients can choose the API style that fits their needs
- **GraphQL Benefits**: Efficient data fetching, strong typing, schema introspection
- **REST Benefits**: Simple, cacheable, widely understood
- **Migration Path**: Can gradually move from REST to GraphQL

### 12. TypeORM for API Gateway

**Decision**: Use TypeORM as the ORM for the NestJS API Gateway.

**Rationale**:

- **TypeScript Native**: Excellent TypeScript support aligns with NestJS
- **Migration Support**: Built-in migrations for schema management
- **Relationship Handling**: Easy to define and query relationships
- **Query Builder**: Powerful query builder for complex queries

### 13. Inertia.js for Admin Panel

**Decision**: Use Inertia.js instead of a separate SPA frontend for the admin panel.

**Rationale**:

- **Simpler Architecture**: No need for a separate API layer between Laravel and frontend
- **Server-Side Routing**: Leverage Laravel's routing, middleware, and validation
- **SPA Feel**: Client-side navigation without page reloads
- **Vue.js Integration**: Modern component-based UI with Vue 3

## Services

### Admin Service

- **Port**: 8000
- **Purpose**: Admin panel for managing products, inventory, orders, and users
- **Framework**: Laravel 12
- **Database**: PostgreSQL (`ecommerce` database)

### API Gateway

- **Port**: 3000
- **Purpose**: Public-facing API gateway with REST and GraphQL endpoints
- **Framework**: NestJS 11
- **Database**: PostgreSQL (`api-gateway` database)

### PostgreSQL

- **Port**: 5432
- **Purpose**: Primary database for both services
- **Default Credentials**: `postgres/postgres`

### Redis

- **Port**: 6379
- **Purpose**: Caching, sessions, and message queues

### Elasticsearch

- **Port**: 9200
- **Purpose**: Product search and indexing

### Kibana

- **Port**: 5601
- **Purpose**: Elasticsearch data visualization (development)

### MailHog

- **SMTP Port**: 1025
- **Web UI Port**: 8025
- **Purpose**: Email testing and development

### Nginx

- **Port**: 80
- **Purpose**: Reverse proxy routing requests to services

## Development Notes

### Running Tests

**Admin Service**

```bash
docker-compose exec admin-service php artisan test
```

**API Gateway**

```bash
docker-compose exec api-gateway npm run test
```

### Database Migrations

**Admin Service**

```bash
docker-compose exec admin-service php artisan migrate
docker-compose exec admin-service php artisan migrate:rollback
```

**API Gateway**

```bash
docker-compose exec api-gateway npm run migration:run
docker-compose exec api-gateway npm run migration:revert
```

### Queue Workers

Queue workers are automatically started via Docker Compose (`admin-queue-worker` service). They process jobs from Redis
queues.


