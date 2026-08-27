import { Header } from '../components/Header';
import { SkillLink } from '../components/SkillLink';

export function AiFirstBestPracticesPage() {
  return (
    <div className="ai-first-page">
      <Header
        title="AI First Best Practices"
        subtitle="Practical guidelines for designing products and systems that responsibly build on AI."
      />
      <SkillLink skill="ai-first-best-practices" />
      <section className="ai-first-page__section">
        <h2>Design and product</h2>
        <ul>
          <li>Design AI features around real user problems, not novelty.</li>
          <li>Keep humans in the loop for high-stakes or irreversible decisions.</li>
          <li>Make it clear to users when they are interacting with AI-generated content.</li>
        </ul>
      </section>
      <section className="ai-first-page__section">
        <h2>Reliability and quality</h2>
        <ul>
          <li>Version, test, and evaluate prompts and models like production code.</li>
          <li>Design for graceful degradation when the model is wrong or unavailable.</li>
          <li>Continuously monitor outputs for drift, bias, and regressions.</li>
        </ul>
      </section>
      <section className="ai-first-page__section">
        <h2>Security and trust</h2>
        <ul>
          <li>Guard against prompt injection and validate all model outputs before acting on them.</li>
          <li>Never send sensitive or regulated data to a model without proper safeguards.</li>
          <li>Apply least-privilege access to any tools or actions an AI agent can invoke.</li>
        </ul>
      </section>
      <section className="ai-first-page__section">
        <h2>Cost and operations</h2>
        <ul>
          <li>Track token usage, latency, and cost per request as core operational metrics.</li>
          <li>Cache and reuse results where correctness allows it to control cost.</li>
          <li>Define fallbacks and rate limits to contain runaway usage or failures.</li>
        </ul>
      </section>
      <section className="ai-first-page__section">
        <h2>AI engineering interview tips</h2>
        <ul>
          <li>
            Know the fundamentals cold: tokenization, embeddings, context windows, temperature, and
            why models hallucinate.
          </li>
          <li>
            Be able to design a retrieval-augmented generation system end to end: chunking,
            indexing, retrieval, re-ranking, and grounded answer generation.
          </li>
          <li>
            Explain how you evaluate an AI feature with offline eval sets, golden datasets,
            LLM-as-judge, and online metrics — not just vibes.
          </li>
          <li>
            Show product judgment: state when a prompt, fine-tune, retrieval, or plain
            deterministic code is the right tool for the problem.
          </li>
          <li>
            Discuss latency, token cost, and caching trade-offs with concrete numbers for the
            systems you have built.
          </li>
          <li>
            Cover safety by default: prompt injection, output validation, PII handling, and
            least-privilege tool access.
          </li>
          <li>
            Bring a portfolio project you can demo and debug live, and be honest about its failure
            modes.
          </li>
          <li>
            Practice thinking out loud, ask clarifying questions before designing, and confirm
            requirements and constraints early.
          </li>
        </ul>
      </section>
    </div>
  );
}
