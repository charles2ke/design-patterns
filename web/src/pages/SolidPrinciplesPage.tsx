import { Header } from '../components/Header';
import { SkillLink } from '../components/SkillLink';

export function SolidPrinciplesPage() {
  return (
    <div className="solid-page">
      <Header
        title="SOLID Principles"
        subtitle="Five object-oriented design principles that keep code easy to extend, test, and change."
      />
      <SkillLink skill="solid-principles" />
      <section className="solid-page__section">
        <h2>Single responsibility</h2>
        <ul>
          <li>Give each class or module one reason to change.</li>
          <li>
            Split types that mix unrelated concerns, such as persistence, formatting, and
            business rules.
          </li>
          <li>Prefer small, focused units that can be named without using &ldquo;and&rdquo;.</li>
        </ul>
      </section>
      <section className="solid-page__section">
        <h2>Open/closed</h2>
        <ul>
          <li>Make behavior extendable without editing existing, working code.</li>
          <li>Add new cases through new implementations rather than growing conditional chains.</li>
          <li>Use strategy, decorator, or template method patterns to absorb variation.</li>
        </ul>
      </section>
      <section className="solid-page__section">
        <h2>Liskov substitution</h2>
        <ul>
          <li>Ensure any subtype can replace its base type without breaking callers.</li>
          <li>Never strengthen preconditions or weaken postconditions in a subtype.</li>
          <li>
            Avoid overrides that throw &ldquo;not supported&rdquo;; the abstraction is wrong if
            you need them.
          </li>
        </ul>
      </section>
      <section className="solid-page__section">
        <h2>Interface segregation</h2>
        <ul>
          <li>Keep interfaces small and client-specific instead of broad and general.</li>
          <li>Split fat interfaces so implementers are not forced to stub unused members.</li>
          <li>Let consumers depend only on the operations they actually call.</li>
        </ul>
      </section>
      <section className="solid-page__section">
        <h2>Dependency inversion</h2>
        <ul>
          <li>Depend on abstractions, not on concrete implementations.</li>
          <li>Inject collaborators instead of constructing them inside the consuming class.</li>
          <li>Let the high-level policy own the abstraction that low-level details implement.</li>
        </ul>
      </section>
    </div>
  );
}
