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
    </div>
  );
}
