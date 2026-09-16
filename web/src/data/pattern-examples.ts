export type ExampleLanguage =
  | 'csharp'
  | 'java'
  | 'react'
  | 'python'
  | 'go'
  | 'rust';

export interface ExampleLanguageMeta {
  id: ExampleLanguage;
  /** Human readable label used by the tab switcher and README headings. */
  label: string;
  /** Fence info string used when the snippet is rendered as Markdown. */
  fence: string;
}

export const EXAMPLE_LANGUAGES: ExampleLanguageMeta[] = [
  { id: 'csharp', label: 'C#', fence: 'csharp' },
  { id: 'java', label: 'Java', fence: 'java' },
  { id: 'react', label: 'React', fence: 'jsx' },
  { id: 'python', label: 'Python', fence: 'python' },
  { id: 'go', label: 'Go', fence: 'go' },
  { id: 'rust', label: 'Rust', fence: 'rust' },
];

export interface PatternExample {
  /** Slug of the pattern in `data/patterns.ts` the snippets belong to. */
  slug: string;
  snippets: Record<ExampleLanguage, string>;
}

/**
 * Single source of truth for the code snippets shown on pattern detail pages
 * and rendered into the README example section by `scripts/generate-readme.ts`.
 */
export const patternExamples: PatternExample[] = [
  {
    slug: 'factory-method',
    snippets: {
      csharp: `public interface IButton { string Render(); }
public class WinButton : IButton { public string Render() => "Windows Button"; }
public abstract class Dialog { public abstract IButton CreateButton(); }
public class WinDialog : Dialog { public override IButton CreateButton() => new WinButton(); }`,
      java: `interface Button { String render(); }
class MacButton implements Button { public String render() { return "Mac Button"; } }
abstract class Dialog { abstract Button createButton(); }
class MacDialog extends Dialog { Button createButton() { return new MacButton(); } }`,
      react: `const buttonFactory = (platform) => {
  if (platform === "web") return ({ label }) => <button>{label}</button>;
  return ({ label }) => <a role="button">{label}</a>;
};
const Button = buttonFactory("web");`,
      python: `from abc import ABC, abstractmethod
class Button(ABC):
    @abstractmethod
    def render(self): ...
class WebButton(Button):
    def render(self): return "Web Button"`,
      go: `type Button interface{ Render() string }
type WebButton struct{}
func (WebButton) Render() string { return "Web Button" }
func NewButton(kind string) Button {
	if kind == "web" { return WebButton{} }
	return WebButton{}
}`,
      rust: `trait Button { fn render(&self) -> &'static str; }
struct WebButton;
impl Button for WebButton { fn render(&self) -> &'static str { "Web Button" } }
fn button_factory(_kind: &str) -> Box<dyn Button> { Box::new(WebButton) }`,
    },
  },
  {
    slug: 'adapter',
    snippets: {
      csharp: `public interface ITarget { string Request(); }
public class LegacyService { public string SpecificRequest() => "legacy"; }
public class Adapter : ITarget {
    private readonly LegacyService _legacy = new();
    public string Request() => _legacy.SpecificRequest();
}`,
      java: `interface Target { String request(); }
class LegacyService { String specificRequest(){ return "legacy"; } }
class ServiceAdapter implements Target {
  private final LegacyService legacy = new LegacyService();
  public String request(){ return legacy.specificRequest(); }
}`,
      react: `const legacyApi = { oldFormat: () => ({ text: "legacy" }) };
const adaptedApi = { getMessage: () => legacyApi.oldFormat().text };
export const Message = () => <p>{adaptedApi.getMessage()}</p>;`,
      python: `class LegacyService:
    def specific_request(self): return "legacy"
class Adapter:
    def __init__(self, legacy): self.legacy = legacy
    def request(self): return self.legacy.specific_request()`,
      go: `type Target interface{ Request() string }
type Legacy struct{}
func (Legacy) SpecificRequest() string { return "legacy" }
type Adapter struct{ Legacy }
func (a Adapter) Request() string { return a.SpecificRequest() }`,
      rust: `trait Target { fn request(&self) -> &'static str; }
struct Legacy;
impl Legacy { fn specific_request(&self) -> &'static str { "legacy" } }
struct Adapter { legacy: Legacy }
impl Target for Adapter { fn request(&self) -> &'static str { self.legacy.specific_request() } }`,
    },
  },
  {
    slug: 'observer',
    snippets: {
      csharp: `public class Subject {
    public event Action<string>? Changed;
    public void SetState(string s) => Changed?.Invoke(s);
}`,
      java: `interface Observer { void update(String state); }
class Subject {
  private final java.util.List<Observer> observers = new java.util.ArrayList<>();
  void subscribe(Observer o){ observers.add(o); }
  void setState(String s){ observers.forEach(o -> o.update(s)); }
}`,
      react: `import { useEffect, useState } from "react";
const bus = new EventTarget();
export function Counter() {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const h = (e) => setValue(e.detail);
    bus.addEventListener("change", h);
    return () => bus.removeEventListener("change", h);
  }, []);
  return <button onClick={() => bus.dispatchEvent(new CustomEvent("change", { detail: value + 1 }))}>{value}</button>;
}`,
      python: `class Subject:
    def __init__(self): self._observers = []
    def subscribe(self, obs): self._observers.append(obs)
    def set_state(self, s): [obs(s) for obs in self._observers]`,
      go: `type Observer func(string)
type Subject struct{ observers []Observer }
func (s *Subject) Subscribe(o Observer) { s.observers = append(s.observers, o) }
func (s *Subject) SetState(v string) {
	for _, o := range s.observers { o(v) }
}`,
      rust: `struct Subject { observers: Vec<Box<dyn Fn(&str)>> }
impl Subject {
    fn new() -> Self { Self { observers: vec![] } }
    fn subscribe<F: Fn(&str) + 'static>(&mut self, f: F) { self.observers.push(Box::new(f)); }
    fn set_state(&self, state: &str) { for o in &self.observers { o(state); } }
}`,
    },
  },
];

/** Looks up the code snippets for a pattern slug. */
export function findPatternExample(slug: string): PatternExample | undefined {
  return patternExamples.find((example) => example.slug === slug);
}
