---
name: ai-first-best-practices
description: Apply AI-first best practices covering product design, reliability, evaluation, security against prompt injection, and cost operations. Use when building or reviewing LLM-powered features, prompts, or agent tooling.
---

# AI First Best Practices

Practical guidelines for designing products and systems that responsibly build on AI.
Mirrors the AI-first section of the site: https://charles2ke.github.io/design-patterns/#/best-practices/ai-first

## Design and product

- Design AI features around real user problems, not novelty.
- Keep humans in the loop for high-stakes or irreversible decisions.
- Make it clear to users when they are interacting with AI-generated content.

## Reliability and quality

- Version, test, and evaluate prompts and models like production code.
- Design for graceful degradation when the model is wrong or unavailable.
- Continuously monitor outputs for drift, bias, and regressions.

## Security and trust

- Guard against prompt injection and validate all model outputs before acting on them.
- Never send sensitive or regulated data to a model without proper safeguards.
- Apply least-privilege access to any tools or actions an AI agent can invoke.

## Cost and operations

- Track token usage, latency, and cost per request as core operational metrics.
- Cache and reuse results where correctness allows it to control cost.
- Define fallbacks and rate limits to contain runaway usage or failures.

## Checklist

- [ ] Feature solves a real user problem with a non-AI fallback
- [ ] Prompts and models versioned with an evaluation set
- [ ] Model output treated as untrusted input
- [ ] Tool access scoped to least privilege
- [ ] Token cost, latency, and rate limits monitored
