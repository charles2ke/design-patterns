---
name: database-design-best-practices
description: Apply database design best practices for modeling, normalization, constraints, indexing, and schema lifecycle. Use when designing tables, writing migrations, or reviewing data models and queries.
---

# Database Design Best Practices

Practical guidelines for building scalable, maintainable, and reliable data models.
Mirrors the database section of the site: https://charles2ke.github.io/design-patterns/#/best-practices/database-design

## Model around real business entities

Start with clear entities, relationships, and ownership rules so the schema maps to the domain and stays understandable.

## Normalize first, denormalize with evidence

Use normalization to avoid duplicate facts, then denormalize only when profiling proves a specific query bottleneck.

## Define constraints close to the data

Enforce primary keys, foreign keys, unique constraints, and check constraints in the database so integrity survives buggy callers.

## Design indexes for real query patterns

Create indexes based on frequent filters, joins, and sort operations; monitor index usage and remove dead weight.

## Plan for auditing and lifecycle changes

Include created/updated metadata, a soft-delete strategy where needed, and reversible migration paths from the beginning.

## Checklist

- [ ] Entities, keys, and relationships reflect the domain
- [ ] Constraints enforced in the schema, not only in code
- [ ] Indexes justified by actual queries
- [ ] Migrations are reversible and safe to run online
- [ ] Audit/lifecycle columns present where they matter
