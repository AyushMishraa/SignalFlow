# Smart Notification Orchestrator — Master Project Specification

## 1. Project Overview

**Smart Notification Orchestrator** is a production-grade, enterprise-level backend platform for centralized notification orchestration.

It is intended for systems such as:

- E-commerce
- Banking / FinTech
- SaaS
- Healthcare platforms
- Logistics
- Enterprise applications
- Internal enterprise systems

The platform will centralize notification handling instead of requiring every business service to implement its own notification delivery logic.

The system will eventually support:

- Email
- SMS
- Push notifications
- OTP
- Transactional notifications
- Marketing notifications
- System alerts
- Scheduled notifications
- Retry mechanisms
- Provider failover
- Rate limiting
- Idempotency
- Audit logging
- Notification lifecycle management
- Asynchronous processing
- Dead-letter queues
- Multi-tenancy
- Authentication and authorization
- Provider abstraction
- Observability
- Metrics
- Distributed tracing
- Horizontal scalability
- Fault tolerance

The goal is to build a system that resembles a real enterprise notification platform rather than a CRUD application.

---

# 2. Development Philosophy

The application must be built incrementally in clearly defined phases and stages.

Do **not** build the entire system at once.

For every stage:

1. Explain what is being built.
2. Explain why it is needed.
3. Explain when it should be implemented.
4. Explain the architectural reasoning.
5. Explain design decisions and trade-offs.
6. Define exactly what needs to be implemented.
7. Define the exact folder/file where every implementation belongs.
8. Provide actual code snippets for every implementation point.
9. Explain important parts of the code.
10. Explain configuration/environment changes.
11. Explain database changes.
12. Explain API contracts.
13. Explain event/message contracts where applicable.
14. Explain how components communicate.
15. Provide a testing strategy.
16. Provide exact test file locations.
17. Provide test cases.
18. Explain common mistakes.
19. Provide a completion checklist.
20. Explain what the next stage depends on.

Do not simply dump code.

The architecture must be explained first, followed by implementation.

---

# 3. Implementation Rule

From **Phase 1 — Stage 5** onward, every implementation point must explicitly contain:

### What

What feature or component are we implementing?

### Why

Why does this component exist?

### Where

Give the exact file/folder location.

Example:

```text
apps/api-gateway/src/common/middleware/correlation-id.middleware.ts
```

### Code

Provide the actual implementation.

### Integration

Explain where the code is registered, imported, consumed, or called.

### Testing

Give the exact test file location.

Example:

```text
apps/api-gateway/src/common/middleware/correlation-id.middleware.spec.ts
```

Explain what the test must verify.

Never provide code without identifying where that code belongs.

---

# 4. Technology Stack

## Backend

- NestJS
- TypeScript
- Node.js

## Database

- PostgreSQL
- Supabase PostgreSQL

## ORM

- Prisma ORM

## Messaging

- RabbitMQ as the primary message broker
- Kafka may be evaluated as an alternative, but RabbitMQ is the primary implementation

## Caching and distributed infrastructure

- Redis

## API

- REST
- OpenAPI / Swagger

## Authentication

The architecture should support:

- JWT
- Access tokens
- Refresh tokens
- API keys
- RBAC
- Tenant-level authorization

## Deployment

Design for:

- Docker
- Docker Compose for local development
- CI/CD
- Cloud deployment
- Horizontal scaling

## Observability

Eventually introduce:

- Structured logging
- Correlation IDs
- Metrics
- Prometheus
- Grafana
- OpenTelemetry
- Distributed tracing

---

# 5. High-Level Architecture

The final architecture should evolve toward:

```text
                         CLIENTS
                            |
                            | HTTPS
                            v
                  +----------------------+
                  |      API GATEWAY     |
                  |        NestJS        |
                  +----------+-----------+
                             |
              +--------------+--------------+
              |              |              |
              v              v              v
       Notification     Authentication   Management
          APIs             APIs            APIs
              |
              v
       +----------------------+
       | Notification Service |
       +----------+-----------+
                  |
                  | Domain Event
                  v
             +---------+
             | RabbitMQ|
             +----+----+
                  |
          +-------+-------+
          |       |       |
          v       v       v
       Email     SMS    Push
       Worker   Worker  Worker
          |       |       |
          v       v       v
      Provider Provider Provider
          |       |       |
          +-------+-------+
                  |
                  v
             Delivery Result
                  |
                  v
       +----------------------+
       | Notification Service |
       +----------------------+

Additional infrastructure:

              +----------+
              |  Redis   |
              +----------+
              | Rate     |
              | Limit    |
              | Cache    |
              | Locks    |
              | Idempot. |
              +----------+

              +-------------------+
              | PostgreSQL/Supabase|
              +-------------------+

              +------------------+
              | Prometheus/Grafana|
              +------------------+
```

---

# 6. Microservice Architecture

The project must use a microservice-oriented architecture, but services should be introduced progressively.

Do not create dozens of independent services prematurely.

## Initial services

```text
apps/
├── api-gateway/
└── notification-service/
```

## Next services

```text
apps/
├── api-gateway/
├── notification-service/
├── delivery-worker/
└── scheduler/
```

## Potential future services

```text
apps/
├── api-gateway/
├── notification-service/
├── delivery-worker/
├── scheduler/
├── authentication-service/
├── template-service/
└── analytics-service/
```

A service should only be introduced when it has a clear responsibility and independent scaling/deployment value.

---

# 7. API Gateway

The API Gateway is the public edge service.

## Responsibilities

- HTTP / HTTPS
- API versioning
- Authentication
- Authorization
- Request validation
- Rate limiting
- CORS
- Security headers
- Request IDs
- Correlation IDs
- Structured logging
- Error normalization
- API documentation
- Routing
- Timeouts
- Public API contracts
- Health checks

## Must NOT own

- Notification business logic
- Email delivery
- SMS delivery
- Push delivery
- Provider selection
- Retry policy
- Notification state transitions
- Direct notification database access

Architecture:

```text
Client
  |
  v
API Gateway
  |
  v
Internal Service
```

The Gateway must not directly use Prisma for notification operations.

---

# 8. Notification Service

The Notification Service owns the notification domain.

## Responsibilities

- Notification creation
- Notification retrieval
- Notification lifecycle
- Tenant validation
- Business rules
- Notification persistence
- Audit events
- Idempotency coordination
- Publishing notification events
- Notification status management

Architecture:

```text
Controller
    |
    v
Application Service
    |
    v
Domain Logic
    |
    v
Repository
    |
    v
Prisma
    |
    v
PostgreSQL
```

---

# 9. Delivery Worker

The Delivery Worker handles asynchronous delivery.

## Responsibilities

- Consume RabbitMQ messages
- Select provider
- Create delivery attempts
- Call provider
- Process provider responses
- Update delivery state
- Retry failed delivery
- Trigger fallback provider
- Publish delivery results
- Handle dead-letter queues

Architecture:

```text
RabbitMQ
   |
   v
Delivery Worker
   |
   v
Provider Strategy
   |
   +---- Email Provider
   |
   +---- SMS Provider
   |
   +---- Push Provider
```

---

# 10. Scheduler

The Scheduler handles future notifications.

Example:

```text
scheduledAt = 2026-09-01T10:00:00
```

The Scheduler must detect when a notification is due and enqueue it.

Architecture:

```text
Scheduler
    |
    v
RabbitMQ
    |
    v
Delivery Worker
```

Redis/distributed locks should be used where necessary to prevent duplicate scheduling across multiple scheduler instances.

---

# 11. Initial Database Domain

The initial PostgreSQL schema contains:

```text
Tenant
User
Notification
DeliveryAttempt
AuditLog
```

Relationships:

```text
Tenant
 |
 +---- User
 |
 +---- Notification
          |
          +---- DeliveryAttempt
          |
          +---- AuditLog
```

---

# 12. Tenant

Tenant represents an organization/customer.

Initial fields:

```text
id
name
slug
status
createdAt
updatedAt
```

Statuses:

```text
ACTIVE
SUSPENDED
DELETED
```

Use UUID identifiers.

Every tenant-owned entity should contain `tenantId` where appropriate.

---

# 13. User

A User belongs to a Tenant.

Fields:

```text
id
tenantId
email
name
status
createdAt
updatedAt
```

Statuses:

```text
ACTIVE
INACTIVE
SUSPENDED
```

Use a composite unique constraint:

```text
tenantId + email
```

This allows the same email to exist in different tenants.

---

# 14. Notification

Notification is the central business entity.

Initial fields:

```text
id
tenantId
type
channel
recipient
subject
content
priority
status
scheduledAt
createdAt
updatedAt
```

## Types

```text
OTP
ORDER_CONFIRMATION
PAYMENT_SUCCESS
PAYMENT_FAILED
PASSWORD_RESET
MARKETING
SYSTEM_ALERT
```

## Channels

```text
EMAIL
SMS
PUSH
```

## Priorities

```text
LOW
NORMAL
HIGH
CRITICAL
```

## Statuses

```text
PENDING
QUEUED
PROCESSING
SENT
FAILED
RETRYING
DEAD_LETTERED
CANCELLED
```

---

# 15. DeliveryAttempt

Retry history must not be stored only on Notification.

Use a separate DeliveryAttempt entity.

Relationship:

```text
Notification
    |
    +---- Attempt 1
    +---- Attempt 2
    +---- Attempt 3
    +---- Attempt 4
```

Fields:

```text
id
notificationId
attemptNumber
provider
status
errorCode
errorMessage
providerMessageId
startedAt
completedAt
createdAt
```

Statuses:

```text
PROCESSING
SUCCESS
FAILED
```

Use:

```text
notificationId + attemptNumber
```

as a composite unique constraint.

---

# 16. AuditLog

AuditLog records important system events.

Fields:

```text
id
tenantId
notificationId
event
actor
metadata
createdAt
```

Events:

```text
NOTIFICATION_CREATED
NOTIFICATION_QUEUED
NOTIFICATION_PROCESSING
NOTIFICATION_SENT
NOTIFICATION_FAILED
NOTIFICATION_RETRYING
NOTIFICATION_DEAD_LETTERED
NOTIFICATION_CANCELLED
```

Use JSON/JSONB metadata for flexible event-specific information.

---

# 17. Notification State Machine

Notification lifecycle must eventually be implemented as an explicit state machine.

Valid flow:

```text
PENDING
   |
   v
QUEUED
   |
   v
PROCESSING
   |
   +----------+
   |          |
   v          v
 SENT       FAILED
              |
              v
           RETRYING
              |
              v
          PROCESSING
```

When retry attempts are exhausted:

```text
FAILED
  |
  v
DEAD_LETTERED
```

Cancellation:

```text
PENDING -> CANCELLED
QUEUED  -> CANCELLED
```

Prevent invalid transitions such as:

```text
SENT -> PROCESSING
SENT -> RETRYING
CANCELLED -> SENT
DEAD_LETTERED -> PROCESSING
```

State transition rules must be enforced in domain/application logic.

---

# 18. Asynchronous Processing

Final notification processing should resemble:

```text
Client
   |
   v
API Gateway
   |
   v
Notification Service
   |
   | persist
   v
PostgreSQL
   |
   | publish event
   v
RabbitMQ
   |
   v
Delivery Worker
   |
   v
Provider
   |
   v
Delivery Result
   |
   v
Notification Service
```

The API request must not wait for actual email/SMS/push delivery.

---

# 19. RabbitMQ Architecture

Use:

- Exchanges
- Queues
- Routing keys
- Retry queues/mechanisms
- Dead-letter exchanges
- Dead-letter queues

Conceptual architecture:

```text
notification.exchange
        |
        +---- notification.created
        |
        +---- notification.queued
        |
        +---- notification.delivery
                         |
                         v
                  delivery.queue
                         |
                         v
                  Delivery Worker
```

Failure flow:

```text
delivery.queue
      |
      v
 Retry mechanism
      |
      v
 Dead Letter Exchange
      |
      v
 dead-letter.queue
```

---

# 20. Event Envelope

Events should have a consistent envelope.

Example:

```json
{
  "eventId": "uuid",
  "eventType": "notification.queued",
  "occurredAt": "timestamp",
  "correlationId": "uuid",
  "tenantId": "uuid",
  "aggregateId": "notification-id",
  "version": 1,
  "payload": {}
}
```

Event contracts should be versioned and treated as public contracts between internal services.

---

# 21. Idempotency

The public API must eventually support an `Idempotency-Key`.

Example:

```text
POST /api/v1/notifications
Idempotency-Key: 8a8f...
```

If the same key is submitted again, the system must not create a duplicate notification.

Use a combination of:

- PostgreSQL
- Redis
- Unique constraints
- Request state

Do not rely exclusively on Redis for correctness.

Database constraints must provide the final integrity guarantee.

---

# 22. Redis

Redis will eventually support:

## Rate limiting

```text
Tenant
  |
  v
Redis counter/window
```

## Idempotency

```text
Idempotency-Key
      |
      v
Redis
```

## Distributed locks

Useful for:

- Scheduler
- Preventing duplicate jobs
- Coordinating distributed processing

## Caching

Potential candidates:

- Provider configuration
- Templates
- Tenant configuration
- Notification preferences

Do not cache everything.

Every cache must have a clear TTL and invalidation strategy.

---

# 23. Rate Limiting

Rate limiting must support tenant-aware limits.

Example:

```text
Tenant A
100 requests/minute

Tenant B
1000 requests/minute
```

Potential levels:

```text
Global
Tenant
API key
Endpoint
IP
```

Use Redis for distributed rate limiting when multiple Gateway replicas exist.

Return:

```text
429 Too Many Requests
```

where appropriate.

---

# 24. Provider Abstraction

Never hardcode provider calls directly into business logic.

Use a provider abstraction:

```text
NotificationProvider
```

Architecture:

```text
Provider Interface
       |
       +---- Email Provider
       |
       +---- SMS Provider
       |
       +---- Push Provider
```

The system must not be tightly coupled to one vendor.

---

# 25. Provider Selection

Provider selection should consider:

- Channel
- Tenant
- Region
- Priority
- Provider health
- Availability
- Cost
- Configuration

Example:

```text
EMAIL
  |
  +---- Provider A
  |
  +---- Provider B
```

If Provider A fails:

```text
Provider A
    |
    X
    |
    v
Provider B
```

Provider failover must be deterministic and observable.

---

# 26. Retry Architecture

Do not retry every failure.

Classify errors.

## Retryable

Examples:

```text
Timeout
Temporary network failure
Provider 5xx
Temporary rate limit
```

## Non-retryable

Examples:

```text
Invalid recipient
Invalid request
Permanent provider rejection
```

Use exponential backoff with jitter.

Conceptually:

```text
Attempt 1
   |
   v
wait
   |
Attempt 2
   |
   v
wait longer
   |
Attempt 3
   |
   v
wait longer
   |
Attempt N
   |
   v
DLQ
```

---

# 27. Scheduling

Support:

```text
scheduledAt
```

Example:

```text
POST notification
scheduledAt = future timestamp
```

The notification must not be delivered before the scheduled time.

The Scheduler should:

1. Find due notifications.
2. Acquire a distributed lock when necessary.
3. Safely mark/enqueue the notification.
4. Publish the message.
5. Prevent duplicate scheduling.

---

# 28. Notification Templates

Eventually introduce:

```text
NotificationTemplate
```

Support:

- Template name
- Channel
- Version
- Subject
- Body
- Variables
- Tenant ownership
- Active version

Example:

```text
ORDER_CONFIRMATION_EMAIL_V3
```

Variables:

```text
{{customerName}}
{{orderId}}
{{amount}}
```

Template rendering must remain separate from delivery.

---

# 29. Notification Preferences

Eventually support:

```text
Email enabled
SMS enabled
Push enabled
Marketing enabled
Transactional enabled
Quiet hours
```

Preference enforcement must happen before delivery.

Marketing notifications must not bypass user preferences.

---

# 30. Authentication

Implement authentication after the core architecture is stable.

Support an enterprise model such as:

```text
User
   |
   v
Authentication
   |
   v
Access Token
   |
   v
API Gateway
```

For machine-to-machine clients:

```text
Client Application
       |
       v
API Key
       |
       v
API Gateway
```

Authentication must establish tenant identity.

The public API should eventually derive tenant context from the authenticated principal rather than trusting `tenantId` from the request body.

---

# 31. Authorization

Implement:

- Tenant isolation
- RBAC
- Resource-level authorization
- API key scopes

Example roles:

```text
OWNER
ADMIN
OPERATOR
VIEWER
```

Example permissions:

```text
notifications:create
notifications:read
notifications:cancel
templates:create
providers:manage
audit:read
```

---

# 32. Observability

Every distributed operation should be traceable.

Use:

```text
requestId
correlationId
eventId
notificationId
tenantId
```

Example:

```text
Gateway
correlationId = ABC

Notification Service
correlationId = ABC

RabbitMQ
correlationId = ABC

Delivery Worker
correlationId = ABC

Provider
correlationId = ABC
```

---

# 33. Structured Logging

Use structured logs.

Example:

```json
{
  "timestamp": "...",
  "level": "info",
  "service": "delivery-worker",
  "event": "notification_delivery_success",
  "notificationId": "...",
  "tenantId": "...",
  "provider": "...",
  "correlationId": "...",
  "durationMs": 421
}
```

Never log:

- Passwords
- API secrets
- JWT tokens
- Provider credentials
- OTP values
- Sensitive notification contents

unless explicitly required and safely redacted.

---

# 34. Metrics

Eventually expose metrics such as:

```text
notifications_created_total
notifications_sent_total
notifications_failed_total
notification_delivery_duration
notification_queue_depth
notification_retry_total
provider_failure_total
provider_latency
api_request_duration
api_request_total
rate_limit_exceeded_total
```

Use:

- Prometheus for collection
- Grafana for visualization

---

# 35. Database Design Principles

Use:

- UUID primary keys
- Foreign keys
- Composite indexes
- Unique constraints
- Proper timestamps
- Explicit relationships
- Appropriate deletion behavior
- Query-driven indexes

Do not add indexes blindly.

Every index should have a query-driven reason.

---

# 36. Prisma Migration Strategy

Every meaningful database change should follow:

```text
Schema change
    |
    v
Prisma migration
    |
    v
Review
    |
    v
Test
    |
    v
Deploy
```

Do not manually change production schema outside the migration strategy.

---

# 37. Transactional Consistency / Outbox

When database state and event publishing must remain consistent, introduce the transactional outbox pattern.

Conceptually:

```text
Database Transaction
       |
       +---- Notification
       |
       +---- Outbox Event
```

Then:

```text
Outbox Publisher
       |
       v
RabbitMQ
```

This prevents situations such as:

```text
DB commit succeeds
RabbitMQ publish fails
```

from leaving the system inconsistent.

---

# 38. Security

Security is a first-class concern.

Eventually implement:

- Authentication
- Authorization
- Tenant isolation
- Input validation
- Rate limiting
- Secure headers
- CORS
- Secret management
- Encryption where appropriate
- Sensitive-data redaction
- API key rotation
- Audit logging
- Secure provider credentials

Never commit secrets to Git.

---

# 39. API Design

Use:

```text
/api/v1/...
```

Examples:

```text
POST   /api/v1/notifications
GET    /api/v1/notifications/:id
GET    /api/v1/notifications
POST   /api/v1/notifications/:id/cancel
GET    /api/v1/notifications/:id/attempts
GET    /api/v1/notifications/:id/audit
```

Use pagination for collection endpoints.

Eventually support cursor pagination for high-volume data.

---

# 40. API Response Format

Successful response:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "...",
    "correlationId": "..."
  }
}
```

Error response:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": []
  },
  "meta": {
    "requestId": "...",
    "correlationId": "..."
  }
}
```

Internal implementation details must not leak to clients.

---

# 41. Application Error Codes

Use stable application-level error codes.

Examples:

```text
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
TENANT_NOT_FOUND
NOTIFICATION_NOT_FOUND
RESOURCE_CONFLICT
RATE_LIMIT_EXCEEDED
IDEMPOTENCY_CONFLICT
SERVICE_UNAVAILABLE
PROVIDER_UNAVAILABLE
INTERNAL_ERROR
```

HTTP status and application error code are separate concepts.

---

# 42. Testing Strategy

Every important feature must have appropriate tests.

## Unit tests

Test:

- Services
- Domain logic
- State machine
- Retry policy
- Provider selection
- Validation

## Integration tests

Test:

- Repository
- Prisma
- PostgreSQL
- Redis
- RabbitMQ

where appropriate.

## E2E tests

Test:

```text
Client
 ↓
Gateway
 ↓
Notification Service
 ↓
Database
```

Eventually:

```text
Client
 ↓
Gateway
 ↓
Notification Service
 ↓
RabbitMQ
 ↓
Delivery Worker
 ↓
Provider
```

---

# 43. Failure Testing

The system must explicitly test failures.

## Database unavailable

```text
Notification Service
       X
    PostgreSQL
```

## RabbitMQ unavailable

```text
Notification Service
       X
    RabbitMQ
```

## Provider timeout

```text
Worker
  |
  X
Provider
```

## Provider 500

```text
Provider
   |
   500
   |
   v
Retry / Failover
```

## Redis unavailable

Determine which capabilities degrade and which must fail safely.

## Worker crash

Messages must remain recoverable.

## Duplicate message

System must remain idempotent.

## Duplicate API request

Only one notification should be created.

---

# 44. Docker

Eventually containerize:

```text
api-gateway
notification-service
delivery-worker
scheduler
postgres
redis
rabbitmq
```

Use Docker Compose for local development.

Production should use suitable managed infrastructure where appropriate.

---

# 45. CI/CD

Eventually create CI/CD pipelines for:

```text
Lint
Type checking
Unit tests
Integration tests
E2E tests
Build
Docker image
Security scanning
Deployment
```

Do not deploy code that has not passed automated checks.

---

# 46. Target Project Structure

The repository should eventually evolve toward:

```text
smart-notification-orchestrator/
│
├── apps/
│   │
│   ├── api-gateway/
│   │   └── src/
│   │       ├── common/
│   │       │   ├── filters/
│   │       │   ├── guards/
│   │       │   ├── interceptors/
│   │       │   └── middleware/
│   │       │
│   │       ├── config/
│   │       ├── modules/
│   │       │   ├── health/
│   │       │   ├── auth/
│   │       │   ├── notifications/
│   │       │   └── proxy/
│   │       │
│   │       ├── app.module.ts
│   │       └── main.ts
│   │
│   ├── notification-service/
│   │   └── src/
│   │       ├── notification/
│   │       │   ├── controllers/
│   │       │   ├── dto/
│   │       │   ├── domain/
│   │       │   ├── repositories/
│   │       │   └── services/
│   │       │
│   │       ├── audit/
│   │       ├── outbox/
│   │       ├── common/
│   │       ├── config/
│   │       ├── app.module.ts
│   │       └── main.ts
│   │
│   ├── delivery-worker/
│   │   └── src/
│   │       ├── consumers/
│   │       ├── providers/
│   │       ├── retry/
│   │       ├── dead-letter/
│   │       ├── delivery/
│   │       └── main.ts
│   │
│   └── scheduler/
│       └── src/
│           ├── jobs/
│           ├── locks/
│           └── main.ts
│
├── libs/
│   ├── common/
│   ├── contracts/
│   ├── config/
│   ├── database/
│   ├── logging/
│   ├── messaging/
│   └── redis/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── test/
│
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── database/
│   ├── events/
│   ├── decisions/
│   └── operations/
│
├── docker/
│
├── .env
├── .env.example
├── docker-compose.yml
├── nest-cli.json
├── package.json
├── tsconfig.json
└── README.md
```

Do not create all directories immediately. Introduce them when their corresponding feature is implemented.

---

# 47. File Placement Rule

Whenever introducing code, always show:

```text
FILE:
apps/example/src/example/example.service.ts
```

followed by the code.

If modifying an existing file:

```text
MODIFY:
apps/example/src/app.module.ts
```

For multiple files:

```text
CREATE:
file A

CREATE:
file B

MODIFY:
file C
```

Never leave file placement ambiguous.

---

# 48. Code Quality Rules

Follow:

- SOLID
- Clean Architecture principles where useful
- Dependency inversion
- Separation of concerns
- Strong typing
- DTO validation
- Explicit interfaces
- Dependency injection
- Testability
- Small cohesive modules

Avoid:

- God services
- Fat controllers
- Direct Prisma calls from controllers
- Business logic inside DTOs
- Business logic inside the Gateway
- Hardcoded URLs
- Hardcoded credentials
- Global mutable state
- Unnecessary abstractions
- Premature microservices

---

# 49. Prisma Access Rule

Prisma should normally be accessed through repositories/data-access abstractions.

Preferred:

```text
Controller
   |
   v
Service
   |
   v
Repository
   |
   v
Prisma
```

Avoid:

```text
Controller
   |
   v
Prisma
```

---

# 50. Test File Rule

Every important implementation should have an appropriately colocated test.

Example:

```text
notification.service.ts
notification.service.spec.ts
```

Integration:

```text
notification.repository.ts
notification.repository.integration.spec.ts
```

E2E:

```text
test/notifications.e2e-spec.ts
```

Explain why each test belongs at that level.

---

# 51. Architecture Before Code

For every significant feature, explain:

```text
Problem
   ↓
Requirements
   ↓
Architecture
   ↓
Responsibilities
   ↓
Data flow
   ↓
Failure cases
```

Then implement:

```text
Files
   ↓
Code
   ↓
Integration
   ↓
Tests
```

---

# 52. Do Not Skip Stages

Never jump from one stage to another without completing the current stage.

If the project is currently at Stage 5, do not start Stage 6 until Stage 5's completion checklist is satisfied.

If the user says "Done", interpret it as completion of the specific implementation currently being discussed unless the user explicitly confirms that the entire stage is complete.

If uncertain, explicitly identify what is complete and what remains.

---

# 53. Debugging Rule

When an error is provided:

1. Analyze the actual error.
2. Identify the likely root cause.
3. Inspect relevant project configuration if necessary.
4. Do not immediately suggest random dependency downgrades.
5. Do not change architecture unnecessarily.
6. Tell exactly which file/configuration should change.
7. Explain why.
8. Provide the exact command/code needed.
9. Explain how to verify the fix.
10. Ensure the fix does not create future architectural problems.

For dependency/module errors, inspect when relevant:

```text
package.json
package-lock.json
tsconfig.json
tsconfig.build.json
nest-cli.json
Node version
Nest versions
dependency versions
```

---

# 54. Development Roadmap

## PHASE 1 — FOUNDATION

### Stage 1 — System Architecture and Requirements

Define:

- Business problem
- Functional requirements
- Non-functional requirements
- High-level architecture
- Microservice boundaries
- Technology choices

### Stage 2 — NestJS Workspace and Application Boundaries

Set up:

- NestJS workspace
- API Gateway application
- Notification Service application
- Shared workspace conventions

### Stage 3 — Configuration + Supabase + Prisma

Implement:

- Environment configuration
- Supabase PostgreSQL
- Prisma
- Database connection
- Migration workflow

### Stage 4 — Domain and Database Design

Implement initial:

- Tenant
- User
- Notification
- DeliveryAttempt
- AuditLog

### Stage 5 — API Gateway Foundation

Implement:

- Gateway bootstrap
- API versioning
- Global validation
- Error handling
- Response formatting
- Correlation IDs
- Request IDs
- Logging
- CORS
- Security headers
- Swagger
- Health checks
- Internal service proxy

### Stage 6 — Notification Service Core

Implement:

- Notification module
- DTOs
- Controllers
- Application service
- Domain validation
- Tenant verification
- Repository
- Prisma persistence
- First complete API vertical slice

### Stage 7 — Notification Lifecycle

Implement:

- State machine
- Valid transitions
- Invalid transition protection
- Lifecycle audit events
- Domain-level state management

---

# PHASE 2 — API AND DOMAIN MATURITY

### Stage 8 — Notification Querying and Pagination

Implement:

- List notifications
- Filtering
- Sorting
- Cursor pagination
- Tenant isolation

### Stage 9 — Audit Logging

Implement:

- Audit service
- Audit events
- Querying audit history
- Retention considerations

### Stage 10 — Idempotency

Implement:

- Idempotency-Key
- Persistence
- Redis coordination
- Duplicate request handling
- Conflict handling

### Stage 11 — Authentication

Implement:

- Authentication model
- Access tokens
- Refresh tokens
- JWT validation
- Authentication guards

### Stage 12 — Authorization and Tenant Isolation

Implement:

- RBAC
- Permissions
- Tenant context
- Resource-level authorization
- API key scopes

---

# PHASE 3 — ASYNCHRONOUS ARCHITECTURE

### Stage 13 — RabbitMQ Fundamentals

Implement:

- Connection
- Exchanges
- Queues
- Routing keys
- Consumer/producer abstractions

### Stage 14 — Notification Event Contracts

Implement:

- Event envelopes
- Versioning
- Event schemas
- Correlation IDs
- Contract validation

### Stage 15 — Outbox Pattern

Implement:

- Outbox table
- Transactional event creation
- Publisher
- Retry handling
- Event publication tracking

### Stage 16 — Notification Queueing

Implement:

- Notification queued event
- RabbitMQ routing
- Delivery queue
- Queue monitoring

### Stage 17 — Delivery Worker

Implement:

- Worker application
- Consumers
- Message acknowledgment
- Processing flow
- Delivery result handling

---

# PHASE 4 — DELIVERY ENGINE

### Stage 18 — Provider Abstraction

Implement:

- Provider interface
- Provider registry
- Provider configuration model
- Provider selection abstraction

### Stage 19 — Email Provider

Implement:

- Email provider interface
- Provider adapter
- Email delivery
- Provider response handling

### Stage 20 — SMS Provider

Implement:

- SMS provider interface
- Provider adapter
- SMS delivery
- Provider response handling

### Stage 21 — Push Provider

Implement:

- Push provider interface
- Provider adapter
- Push delivery
- Provider response handling

### Stage 22 — Provider Selection Strategy

Implement:

- Channel strategy
- Tenant configuration
- Priority
- Provider health
- Provider routing

### Stage 23 — Provider Failover

Implement:

- Primary provider
- Secondary provider
- Failover conditions
- Failover logging
- Failover metrics

### Stage 24 — Delivery Attempts

Implement:

- Attempt creation
- Attempt lifecycle
- Provider message IDs
- Error tracking
- Delivery latency

---

# PHASE 5 — RELIABILITY

### Stage 25 — Retry Architecture

Implement:

- Retry classification
- Retry policies
- Retry scheduling
- Maximum attempts

### Stage 26 — Exponential Backoff and Jitter

Implement:

- Backoff calculation
- Jitter
- Delay limits
- Retry scheduling

### Stage 27 — Dead-Letter Queues

Implement:

- DLX
- DLQ
- Dead-letter consumer
- Dead-letter inspection

### Stage 28 — Poison Message Handling

Implement:

- Invalid message detection
- Repeated failure detection
- Safe rejection
- DLQ routing

### Stage 29 — Idempotent Consumers

Implement:

- Event deduplication
- Message IDs
- Consumer-side idempotency
- Safe reprocessing

### Stage 30 — Failure Recovery

Test and implement recovery for:

- Worker crashes
- Broker outages
- Database outages
- Provider outages
- Redis outages
- Duplicate events

---

# PHASE 6 — REDIS AND TRAFFIC CONTROL

### Stage 31 — Redis Infrastructure

Implement:

- Redis module
- Connection management
- Configuration
- Health checks

### Stage 32 — Distributed Rate Limiting

Implement:

- Tenant limits
- API key limits
- Endpoint limits
- Distributed counters
- 429 responses

### Stage 33 — Caching

Implement:

- Cache abstraction
- TTL
- Cache invalidation
- Provider configuration cache
- Template cache

### Stage 34 — Distributed Locks

Implement:

- Lock abstraction
- Scheduler locks
- Job locks
- Lock expiration
- Failure recovery

### Stage 35 — Advanced Idempotency

Implement:

- Redis-assisted idempotency
- Request state
- Replay behavior
- Expiration
- Conflict handling

---

# PHASE 7 — SCHEDULING AND TEMPLATES

### Stage 36 — Notification Scheduling

Implement:

- scheduledAt
- Scheduling validation
- Scheduled state

### Stage 37 — Scheduler Service

Implement:

- Scheduler process
- Due notification discovery
- Queue publishing

### Stage 38 — Distributed Scheduling

Implement:

- Redis locks
- Multiple scheduler replicas
- Duplicate prevention
- Recovery

### Stage 39 — Notification Templates

Implement:

- Template entity
- Template CRUD
- Tenant ownership
- Channel association

### Stage 40 — Template Versioning

Implement:

- Template versions
- Active versions
- Version history
- Safe rollout

### Stage 41 — Template Variables and Rendering

Implement:

- Variable validation
- Rendering
- Missing-variable errors
- Safe rendering

### Stage 42 — Notification Preferences

Implement:

- User preferences
- Tenant policies
- Marketing opt-in/out
- Quiet hours
- Preference enforcement

---

# PHASE 8 — OBSERVABILITY

### Stage 43 — Structured Logging

Implement:

- JSON logs
- Log levels
- Context
- Redaction

### Stage 44 — Metrics

Implement:

- Request metrics
- Notification metrics
- Delivery metrics
- Provider metrics
- Queue metrics

### Stage 45 — Prometheus

Implement:

- Metrics endpoint
- Prometheus configuration
- Scraping

### Stage 46 — Grafana

Implement dashboards for:

- Notification throughput
- Success/failure rates
- Provider health
- Queue depth
- Latency
- Retry volume

### Stage 47 — OpenTelemetry

Implement:

- Instrumentation
- Trace context
- Service instrumentation

### Stage 48 — Distributed Tracing

Trace:

```text
Gateway
   ↓
Notification Service
   ↓
RabbitMQ
   ↓
Delivery Worker
   ↓
Provider
```

### Stage 49 — Operational Dashboards

Build production-oriented dashboards and alerts.

---

# PHASE 9 — SECURITY

### Stage 50 — API Key Management

Implement:

- API key creation
- Hashing
- Rotation
- Revocation
- Scopes
- Expiration

### Stage 51 — JWT / Access / Refresh Tokens

Implement:

- Access tokens
- Refresh tokens
- Token rotation
- Revocation strategy

### Stage 52 — RBAC

Implement:

- Roles
- Permissions
- Guards
- Authorization policies

### Stage 53 — Tenant Isolation

Implement:

- Tenant context
- Tenant-aware repositories
- Authorization checks
- Cross-tenant access prevention

### Stage 54 — Secret Management

Implement:

- Environment secrets
- Cloud secret manager integration
- Provider credential protection
- Rotation

### Stage 55 — Security Hardening

Review:

- Input validation
- Rate limiting
- CORS
- Security headers
- Authentication
- Authorization
- Secret handling
- Logging
- Dependency vulnerabilities

---

# PHASE 10 — PRODUCTIONIZATION

### Stage 56 — Dockerization

Containerize:

- API Gateway
- Notification Service
- Delivery Worker
- Scheduler

### Stage 57 — Docker Compose

Provide local infrastructure for:

- PostgreSQL
- Redis
- RabbitMQ
- Application services

### Stage 58 — CI/CD

Implement:

- Build
- Test
- Lint
- Type checking
- Security checks
- Docker image creation
- Deployment

### Stage 59 — Automated Testing Pipeline

Run:

- Unit tests
- Integration tests
- E2E tests
- Contract tests
- Migration checks

### Stage 60 — Production Deployment

Design production deployment architecture.

### Stage 61 — Horizontal Scaling

Test multiple replicas of:

- API Gateway
- Notification Service
- Delivery Worker
- Scheduler

### Stage 62 — Load Testing

Test:

- API throughput
- Queue throughput
- Provider throughput
- Database performance
- Redis performance

### Stage 63 — Chaos / Failure Testing

Test:

- Service crashes
- Database outages
- Broker outages
- Provider outages
- Redis outages
- Network failures

### Stage 64 — Production Readiness Review

Perform a final review of:

- Security
- Reliability
- Scalability
- Observability
- Performance
- Disaster recovery
- Testing
- Deployment
- Documentation

---

# 55. Stage Completion Format

At the end of every stage, provide:

## Architecture Achieved

Show the updated architecture diagram.

## Files Created

List every created file.

## Files Modified

List every modified file.

## Database Changes

List schema/migration changes.

## API Changes

List new/modified endpoints.

## Events/Messages

List new/modified event contracts.

## Tests

List tests added.

## Completion Checklist

```text
[ ] Requirement
[ ] Requirement
[ ] Requirement
```

## Next Stage

Explain exactly why the next stage follows and what it depends on.

---

# 56. Current Project State

The current project state is:

```text
Stage 1 — Completed
Stage 2 — Completed
Stage 3 — Completed
Stage 4 — Completed

Stage 5 — API Gateway Foundation
CURRENT STAGE
```

Stage 5 must establish:

```text
API Gateway
├── Bootstrap
├── API versioning
├── Global validation
├── Error handling
├── Response formatting
├── Correlation ID
├── Request ID
├── Logging
├── CORS
├── Security headers
├── Swagger
├── Health checks
└── Internal service proxy
```

After Stage 5:

```text
Stage 6
Notification Service Core
```

---

# 57. Final System Goal

The completed Smart Notification Orchestrator should support this flow:

```text
                         CLIENT
                           |
                           v
                    API GATEWAY
                           |
              Authentication/Authorization
                           |
                           v
                 NOTIFICATION SERVICE
                           |
                 +---------+---------+
                 |                   |
                 v                   v
             PostgreSQL          Outbox
                                     |
                                     v
                                  RabbitMQ
                                     |
                         +-----------+-----------+
                         |           |           |
                         v           v           v
                      EMAIL         SMS         PUSH
                      WORKER       WORKER      WORKER
                         |           |           |
                         v           v           v
                     Provider     Provider    Provider
                         |           |           |
                         +-----------+-----------+
                                     |
                                     v
                              Delivery Result
                                     |
                                     v
                            Notification Service
                                     |
                         +-----------+-----------+
                         |                       |
                         v                       v
                    PostgreSQL              Audit Log
```

Supporting infrastructure:

```text
                    +----------------+
                    |     Redis      |
                    +----------------+
                    | Rate limiting  |
                    | Idempotency    |
                    | Cache          |
                    | Locks          |
                    +----------------+

                    +----------------+
                    | Observability  |
                    +----------------+
                    | Logs           |
                    | Metrics        |
                    | Traces         |
                    +----------------+
```

The completed system must be:

- Scalable
- Fault tolerant
- Observable
- Secure
- Multi-tenant
- Asynchronous where appropriate
- Idempotent
- Testable
- Maintainable
- Horizontally scalable
- Production-oriented

The goal is not merely to make the application work.

The goal is to understand:

- Why each component exists
- When it should be introduced
- How it communicates with other components
- How it fails
- How it recovers
- How it scales
- How it is tested
- How it behaves under real production conditions
