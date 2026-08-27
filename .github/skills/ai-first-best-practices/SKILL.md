---
name: ai-first-best-practices
description: Apply AI-first best practices covering product design, reliability, evaluation, security against prompt injection, and cost operations, plus tips for clearing an AI engineering interview. Use when building or reviewing LLM-powered features, prompts, or agent tooling, or when preparing for an AI engineering interview.
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

## AI engineering interview tips

- Know the fundamentals cold: tokenization, embeddings, context windows, temperature, and why models hallucinate.
- Be able to design a retrieval-augmented generation system end to end: chunking, indexing, retrieval, re-ranking, and grounded answer generation.
- Explain how you evaluate an AI feature with offline eval sets, golden datasets, LLM-as-judge, and online metrics — not just vibes.
- Show product judgement: state when a prompt, fine-tune, retrieval, or plain deterministic code is the right tool for the problem.
- Discuss latency, token cost, and caching trade-offs with concrete numbers for the systems you have built.
- Cover safety by default: prompt injection, output validation, PII handling, and least-privilege tool access.
- Bring a portfolio project you can demo and debug live, and be honest about its failure modes.
- Practise thinking out loud, ask clarifying questions before designing, and confirm requirements and constraints early.

## Checklist

- [ ] Feature solves a real user problem with a non-AI fallback
- [ ] Prompts and models versioned with an evaluation set
- [ ] Model output treated as untrusted input
- [ ] Tool access scoped to least privilege
- [ ] Token cost, latency, and rate limits monitored
