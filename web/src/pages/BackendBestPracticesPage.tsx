import { Header } from '../components/Header';

export function BackendBestPracticesPage() {
  return (
    <div className="backend-page">
      <Header
        title="Backend Code Best Practices"
        subtitle="Reliable, secure, and maintainable patterns for backend systems."
      />
      <section className="backend-page__section">
        <h2>Architecture and boundaries</h2>
        <ul>
          <li>Keep business logic independent from transport and storage layers.</li>
          <li>Use clear module boundaries to keep responsibilities focused.</li>
          <li>Design APIs and services around stable contracts.</li>
        </ul>
      </section>
      <section className="backend-page__section">
        <h2>Data and persistence</h2>
        <ul>
          <li>Validate all inbound data at service boundaries.</li>
          <li>Use transactions when a workflow must succeed or fail as one unit.</li>
          <li>Prefer idempotent operations for retries and background processing.</li>
        </ul>
      </section>
      <section className="backend-page__section">
        <h2>Security and resilience</h2>
        <ul>
          <li>Treat every external input as untrusted and sanitize early.</li>
          <li>Apply least-privilege access for services and credentials.</li>
          <li>Use structured logging with correlation IDs for traceability.</li>
        </ul>
      </section>
      <section className="backend-page__section">
        <h2>Testing and operations</h2>
        <ul>
          <li>Cover critical flows with unit, integration, and end-to-end tests.</li>
          <li>Track latency, error rate, and saturation for each core dependency.</li>
          <li>Define runbooks for common incidents and rollback procedures.</li>
        </ul>
      </section>
    </div>
  );
}
