---
name: backend-best-practices
description: Apply backend best practices for architecture boundaries, data handling, security, resilience, testing, and operations. Use when designing or reviewing services, APIs, jobs, or server-side code.
---

# Backend Best Practices

Reliable, secure, and maintainable patterns for backend systems.
Mirrors the backend section of the site: https://charles2ke.github.io/design-patterns/#/best-practices/backend

## Architecture and boundaries

- Keep business logic independent from transport (HTTP/gRPC/queue) and storage layers.
- Use clear module boundaries so each component has a focused responsibility.
- Design APIs and services around stable contracts; version them before breaking clients.

## Data and persistence

- Validate all inbound data at service boundaries before it reaches domain logic.
- Use transactions when a workflow must succeed or fail as one unit.
- Prefer idempotent operations so retries and background processing are safe.
- Avoid N+1 queries and unbounded result sets; paginate by default.

## Security and resilience

- Treat every external input as untrusted and sanitize early.
- Apply least-privilege access for services, credentials, and database roles.
- Use structured logging with correlation IDs, and never log secrets or PII.
- Add timeouts, retries with backoff, and circuit breakers around remote dependencies.

## Testing and operations

- Cover critical flows with unit, integration, and end-to-end tests.
- Track latency, error rate, and saturation for each core dependency.
- Define runbooks for common incidents plus a tested rollback procedure.
- Make configuration environment-driven rather than hard-coded.

## Checklist

- [ ] Business logic isolated from transport and storage
- [ ] Inputs validated; writes transactional or idempotent
- [ ] Least-privilege credentials and no secrets in logs
- [ ] Timeouts/retries on every remote call
- [ ] Tests and observability cover the new path
