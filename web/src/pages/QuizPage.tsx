import { QuizGame, type QuizQuestion } from '../components/QuizGame';

const QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    prompt:
      'Which pattern ensures only one object instance exists and provides global access to it?',
    options: [
      { id: 'a', label: 'Singleton' },
      { id: 'b', label: 'Builder' },
      { id: 'c', label: 'Decorator' },
      { id: 'd', label: 'Mediator' },
    ],
    hint:
      'Think about a class that guards its own single instance behind a static accessor.',
    correctOptionId: 'a',
  },
  {
    id: 2,
    prompt:
      'Which structural pattern wraps an object to add behavior dynamically at runtime?',
    options: [
      { id: 'a', label: 'Facade' },
      { id: 'b', label: 'Decorator' },
      { id: 'c', label: 'Flyweight' },
      { id: 'd', label: 'Bridge' },
    ],
    hint:
      'It wraps the original object and shares its interface, layering behavior on top.',
    correctOptionId: 'b',
  },
  {
    id: 3,
    prompt:
      'Which behavioral pattern lets multiple handlers process a request in sequence?',
    options: [
      { id: 'a', label: 'Observer' },
      { id: 'b', label: 'Strategy' },
      { id: 'c', label: 'Chain of Responsibility' },
      { id: 'd', label: 'Template Method' },
    ],
    hint:
      'Each handler either handles the request or passes it to the next link.',
    correctOptionId: 'c',
  },
  {
    id: 4,
    prompt:
      'When you need interchangeable algorithms selected at runtime, which pattern fits best?',
    options: [
      { id: 'a', label: 'Prototype' },
      { id: 'b', label: 'Strategy' },
      { id: 'c', label: 'Proxy' },
      { id: 'd', label: 'Visitor' },
    ],
    hint:
      'The algorithm is swapped by composing a different implementation object.',
    correctOptionId: 'b',
  },
  {
    id: 5,
    prompt:
      'Which pattern captures and restores object state to support undo/rollback?',
    options: [
      { id: 'a', label: 'Memento' },
      { id: 'b', label: 'Interpreter' },
      { id: 'c', label: 'Adapter' },
      { id: 'd', label: 'Factory Method' },
    ],
    hint:
      'Its name comes from the idea of keeping a souvenir of a past state.',
    correctOptionId: 'a',
  },
  {
    id: 6,
    prompt:
      'Which creational pattern separates the construction of a complex object from its representation?',
    options: [
      { id: 'a', label: 'Builder' },
      { id: 'b', label: 'Singleton' },
      { id: 'c', label: 'Observer' },
      { id: 'd', label: 'Composite' },
    ],
    hint:
      'It uses a step-by-step director to assemble parts of an object.',
    correctOptionId: 'a',
  },
  {
    id: 7,
    prompt:
      'Which pattern converts the interface of a class into another interface clients expect?',
    options: [
      { id: 'a', label: 'Proxy' },
      { id: 'b', label: 'Adapter' },
      { id: 'c', label: 'Command' },
      { id: 'd', label: 'State' },
    ],
    hint:
      'Think of a power plug converter between incompatible sockets.',
    correctOptionId: 'b',
  },
  {
    id: 8,
    prompt:
      'Which pattern notifies dependent objects automatically whenever the subject changes state?',
    options: [
      { id: 'a', label: 'Iterator' },
      { id: 'b', label: 'Abstract Factory' },
      { id: 'c', label: 'Observer' },
      { id: 'd', label: 'Facade' },
    ],
    hint:
      'Subscribers register with a subject and are notified on change.',
    correctOptionId: 'c',
  },
  {
    id: 9,
    prompt:
      'Which structural pattern offers a simplified entry point to a complex subsystem?',
    options: [
      { id: 'a', label: 'Bridge' },
      { id: 'b', label: 'Facade' },
      { id: 'c', label: 'Mediator' },
      { id: 'd', label: 'Prototype' },
    ],
    hint:
      'It hides subsystem complexity behind one friendly interface.',
    correctOptionId: 'b',
  },
  {
    id: 10,
    prompt:
      'Which creational pattern builds new objects by cloning an existing instance?',
    options: [
      { id: 'a', label: 'Prototype' },
      { id: 'b', label: 'Factory Method' },
      { id: 'c', label: 'Flyweight' },
      { id: 'd', label: 'Strategy' },
    ],
    hint:
      'It copies an existing object instead of constructing one from scratch.',
    correctOptionId: 'a',
  },
  {
    id: 11,
    prompt:
      'Which structural pattern decouples an abstraction from its implementation so both can vary independently?',
    options: [
      { id: 'a', label: 'Decorator' },
      { id: 'b', label: 'Composite' },
      { id: 'c', label: 'Bridge' },
      { id: 'd', label: 'Memento' },
    ],
    hint:
      'It uses composition, not inheritance, to pair two class hierarchies.',
    correctOptionId: 'c',
  },
  {
    id: 12,
    prompt:
      'Which pattern supplies a placeholder that controls access to another object?',
    options: [
      { id: 'a', label: 'Proxy' },
      { id: 'b', label: 'Adapter' },
      { id: 'c', label: 'Builder' },
      { id: 'd', label: 'Interpreter' },
    ],
    hint:
      'It stands in for the real object and can add lazy loading or access checks.',
    correctOptionId: 'a',
  },
  {
    id: 13,
    prompt:
      'Which pattern reduces memory use by sharing intrinsic state across many similar objects?',
    options: [
      { id: 'a', label: 'Singleton' },
      { id: 'b', label: 'Flyweight' },
      { id: 'c', label: 'Command' },
      { id: 'd', label: 'Visitor' },
    ],
    hint:
      'It shares immutable state between many fine-grained objects.',
    correctOptionId: 'b',
  },
  {
    id: 14,
    prompt:
      'Which behavioral pattern defines an algorithm skeleton in a base class and defers steps to subclasses?',
    options: [
      { id: 'a', label: 'State' },
      { id: 'b', label: 'Iterator' },
      { id: 'c', label: 'Mediator' },
      { id: 'd', label: 'Template Method' },
    ],
    hint:
      'The base class fixes the order of steps; subclasses fill in the blanks.',
    correctOptionId: 'd',
  },
  {
    id: 15,
    prompt:
      'Which behavioral pattern adds new operations to an object structure without modifying its classes?',
    options: [
      { id: 'a', label: 'Visitor' },
      { id: 'b', label: 'Observer' },
      { id: 'c', label: 'Chain of Responsibility' },
      { id: 'd', label: 'Decorator' },
    ],
    hint:
      'Operations move out of the element classes into a separate traversing class.',
    correctOptionId: 'a',
  },
];

export function QuizPage() {
  return (
    <QuizGame
      title="Who Wants to Be a Pattern Architect?"
      subtitle="A modern millionaire-style challenge about design patterns."
      ariaLabel="Design patterns quiz"
      cheer="Congratulations, Pattern Architect!"
      questions={QUESTIONS}
    />
  );
}
