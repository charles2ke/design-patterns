# Design Patterns

Design patterns every engineer should be aware of.

## Gang of Four (GoF) Design Patterns

The GoF catalog contains 23 object-oriented patterns grouped into three families:

- **Creational**: how objects are created.
- **Structural**: how classes/objects are composed.
- **Behavioral**: how objects collaborate.

### 1) Creational Patterns

#### 1. Singleton
- **Intent**: Ensure a class has only one instance and provide a global access point.
- **Use when**: You need shared state/configuration with controlled access.

#### 2. Factory Method
- **Intent**: Define an interface for creating an object, but let subclasses decide which class to instantiate.
- **Use when**: Creation logic varies by context and you want to avoid tight coupling to concrete classes.

#### 3. Abstract Factory
- **Intent**: Provide an interface for creating families of related/dependent objects.
- **Use when**: You must enforce compatible product variants (for example, light/dark UI kits).

#### 4. Builder
- **Intent**: Separate the construction of a complex object from its representation.
- **Use when**: Objects have many optional fields/steps and telescoping constructors become messy.

#### 5. Prototype
- **Intent**: Create new objects by cloning an existing instance.
- **Use when**: Object setup is expensive and many similar objects are required.

### 2) Structural Patterns

#### 6. Adapter
- **Intent**: Convert one interface into another clients expect.
- **Use when**: You need to integrate incompatible interfaces without changing source code.

#### 7. Bridge
- **Intent**: Decouple abstraction from implementation so both can vary independently.
- **Use when**: You want to avoid class explosion from combining dimensions (shape x renderer, etc.).

#### 8. Composite
- **Intent**: Compose objects into tree structures and treat part-whole uniformly.
- **Use when**: You model hierarchies (file systems, UI trees, org charts).

#### 9. Decorator
- **Intent**: Add behavior to objects dynamically by wrapping them.
- **Use when**: You need optional, combinable features without many subclasses.

#### 10. Facade
- **Intent**: Provide a simplified interface to a complex subsystem.
- **Use when**: You want to hide subsystem complexity behind a stable API.

#### 11. Flyweight
- **Intent**: Share intrinsic state across many fine-grained objects to reduce memory.
- **Use when**: Large numbers of similar objects exist (characters, map tiles, particles).

#### 12. Proxy
- **Intent**: Provide a surrogate/placeholder to control access to another object.
- **Use when**: You need lazy loading, access control, caching, or remote indirection.

### 3) Behavioral Patterns

#### 13. Chain of Responsibility
- **Intent**: Pass requests along a chain until one handler processes it.
- **Use when**: Multiple handlers may process a request and sender should not know receiver.

#### 14. Command
- **Intent**: Encapsulate a request as an object.
- **Use when**: You need undo/redo, queueing, logging, or macro operations.

#### 15. Interpreter
- **Intent**: Define grammar and interpreter for a small language.
- **Use when**: You need to evaluate domain-specific expressions.

#### 16. Iterator
- **Intent**: Access elements of an aggregate sequentially without exposing internals.
- **Use when**: You need uniform traversal over different collections.

#### 17. Mediator
- **Intent**: Encapsulate how objects interact to reduce direct coupling.
- **Use when**: Many-to-many object communication becomes hard to maintain.

#### 18. Memento
- **Intent**: Capture and restore an object's internal state without violating encapsulation.
- **Use when**: You need snapshots/checkpoints (undo history, rollback).

#### 19. Observer
- **Intent**: Define one-to-many dependency so observers are notified of state changes.
- **Use when**: Event-driven updates are needed (UI updates, pub/sub).

#### 20. State
- **Intent**: Let an object alter behavior when its internal state changes.
- **Use when**: Behavior branches heavily on state and conditionals become large.

#### 21. Strategy
- **Intent**: Define a family of algorithms, encapsulate each, and make them interchangeable.
- **Use when**: You need runtime selection of behavior (sorting, pricing, validation rules).

#### 22. Template Method
- **Intent**: Define algorithm skeleton in a base class and defer steps to subclasses.
- **Use when**: Workflows are similar but some steps differ by variant.

#### 23. Visitor
- **Intent**: Separate operations from object structure by moving behavior into visitor objects.
- **Use when**: You frequently add operations over a stable object structure.

---

## Example Code (C#, Java, React, Python, Go, Rust)

Below are practical GoF examples across all requested languages.

### Factory Method (Creational)

#### C#
```csharp
public interface IButton { string Render(); }
public class WinButton : IButton { public string Render() => "Windows Button"; }
public abstract class Dialog { public abstract IButton CreateButton(); }
public class WinDialog : Dialog { public override IButton CreateButton() => new WinButton(); }
```

#### Java
```java
interface Button { String render(); }
class MacButton implements Button { public String render() { return "Mac Button"; } }
abstract class Dialog { abstract Button createButton(); }
class MacDialog extends Dialog { Button createButton() { return new MacButton(); } }
```

#### React (JavaScript/TypeScript style)
```jsx
const buttonFactory = (platform) => {
  if (platform === "web") return ({ label }) => <button>{label}</button>;
  return ({ label }) => <a role="button">{label}</a>;
};
const Button = buttonFactory("web");
```

#### Python
```python
from abc import ABC, abstractmethod
class Button(ABC):
    @abstractmethod
    def render(self): ...
class WebButton(Button):
    def render(self): return "Web Button"
```

#### Go
```go
type Button interface{ Render() string }
type WebButton struct{}
func (WebButton) Render() string { return "Web Button" }
func NewButton(kind string) Button {
	if kind == "web" { return WebButton{} }
	return WebButton{}
}
```

#### Rust
```rust
trait Button { fn render(&self) -> &'static str; }
struct WebButton;
impl Button for WebButton { fn render(&self) -> &'static str { "Web Button" } }
fn button_factory(_kind: &str) -> Box<dyn Button> { Box::new(WebButton) }
```

### Adapter (Structural)

#### C#
```csharp
public interface ITarget { string Request(); }
public class LegacyService { public string SpecificRequest() => "legacy"; }
public class Adapter : ITarget {
    private readonly LegacyService _legacy = new();
    public string Request() => _legacy.SpecificRequest();
}
```

#### Java
```java
interface Target { String request(); }
class LegacyService { String specificRequest(){ return "legacy"; } }
class ServiceAdapter implements Target {
  private final LegacyService legacy = new LegacyService();
  public String request(){ return legacy.specificRequest(); }
}
```

#### React
```jsx
const legacyApi = { oldFormat: () => ({ text: "legacy" }) };
const adaptedApi = { getMessage: () => legacyApi.oldFormat().text };
export const Message = () => <p>{adaptedApi.getMessage()}</p>;
```

#### Python
```python
class LegacyService:
    def specific_request(self): return "legacy"
class Adapter:
    def __init__(self, legacy): self.legacy = legacy
    def request(self): return self.legacy.specific_request()
```

#### Go
```go
type Target interface{ Request() string }
type Legacy struct{}
func (Legacy) SpecificRequest() string { return "legacy" }
type Adapter struct{ Legacy }
func (a Adapter) Request() string { return a.SpecificRequest() }
```

#### Rust
```rust
trait Target { fn request(&self) -> &'static str; }
struct Legacy;
impl Legacy { fn specific_request(&self) -> &'static str { "legacy" } }
struct Adapter { legacy: Legacy }
impl Target for Adapter { fn request(&self) -> &'static str { self.legacy.specific_request() } }
```

### Observer (Behavioral)

#### C#
```csharp
public class Subject {
    public event Action<string>? Changed;
    public void SetState(string s) => Changed?.Invoke(s);
}
```

#### Java
```java
interface Observer { void update(String state); }
class Subject {
  private final java.util.List<Observer> observers = new java.util.ArrayList<>();
  void subscribe(Observer o){ observers.add(o); }
  void setState(String s){ observers.forEach(o -> o.update(s)); }
}
```

#### React
```jsx
import { useEffect, useState } from "react";
const bus = new EventTarget();
export function Counter() {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const h = (e) => setValue(e.detail);
    bus.addEventListener("change", h);
    return () => bus.removeEventListener("change", h);
  }, []);
  return <button onClick={() => bus.dispatchEvent(new CustomEvent("change", { detail: value + 1 }))}>{value}</button>;
}
```

#### Python
```python
class Subject:
    def __init__(self): self._observers = []
    def subscribe(self, obs): self._observers.append(obs)
    def set_state(self, s): [obs(s) for obs in self._observers]
```

#### Go
```go
type Observer func(string)
type Subject struct{ observers []Observer }
func (s *Subject) Subscribe(o Observer) { s.observers = append(s.observers, o) }
func (s *Subject) SetState(v string) {
	for _, o := range s.observers { o(v) }
}
```

#### Rust
```rust
struct Subject { observers: Vec<Box<dyn Fn(&str)>> }
impl Subject {
    fn new() -> Self { Self { observers: vec![] } }
    fn subscribe<F: Fn(&str) + 'static>(&mut self, f: F) { self.observers.push(Box::new(f)); }
    fn set_state(&self, state: &str) { for o in &self.observers { o(state); } }
}
```

---

## Quick Pattern Selection Guide

- Need exactly one shared instance: **Singleton**
- Need flexible object creation: **Factory Method / Abstract Factory / Builder / Prototype**
- Need to integrate incompatible APIs: **Adapter**
- Need optional behavior stacking: **Decorator**
- Need simple interface over complex subsystem: **Facade**
- Need decoupled event updates: **Observer**
- Need interchangeable algorithms: **Strategy**
- Need state-driven behavior switches: **State**
- Need request pipeline processing: **Chain of Responsibility**
