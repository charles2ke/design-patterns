# Design Patterns

Design patterns every engineer should be aware of.

## Web experience

A browsable React site for design patterns lives in [`web/`](web/README.md). It includes:

- a searchable index of all 23 GoF patterns, each with a detail page covering
  participants, trade-offs, pitfalls and related patterns, plus code examples
  in C#, Java, React, Python, Go and Rust
- a best-practices hub (front-end, backend, database design, AI-first, SOLID principles)
- three modern **Who Wants to Be a Millionaire?-style** quizzes: design patterns, algorithms & data structures, and best practices
- a **tough interview questions** page with the hardest design pattern and system design questions, each with a complete worked solution and code
- a **system design** page with 27 frequently reported system design interview questions from Google, Amazon, Microsoft, Meta, OpenAI, Anthropic, Apple and other companies, grouped into Easy, Medium and Hard, each with a detailed solution, architecture diagram and reference code

Live site: **Design Bible** — https://charles2ke.github.io/design-patterns/

```bash
cd web && npm install && npm run dev
```

Production deploys are published automatically to GitHub Pages from `main`.

## Best-practice skills

Each best-practice area is also packaged as an [agent skill](.github/skills) so Copilot can apply the same
guidance while writing or reviewing code. Every skill mirrors the matching page on the live site.

| Skill | Guidance | Live page |
| --- | --- | --- |
| [`frontend-best-practices`](.github/skills/frontend-best-practices/SKILL.md) | Accessibility, performance, code quality, security, architecture | [Front-End](https://charles2ke.github.io/design-patterns/#/best-practices) |
| [`backend-best-practices`](.github/skills/backend-best-practices/SKILL.md) | Boundaries, data and persistence, security and resilience, operations | [Backend](https://charles2ke.github.io/design-patterns/#/best-practices/backend) |
| [`database-design-best-practices`](.github/skills/database-design-best-practices/SKILL.md) | Modeling, normalization, constraints, indexing, schema lifecycle | [Database Design](https://charles2ke.github.io/design-patterns/#/best-practices/database-design) |
| [`ai-first-best-practices`](.github/skills/ai-first-best-practices/SKILL.md) | Product design, reliability, security and trust, cost and operations | [AI First](https://charles2ke.github.io/design-patterns/#/best-practices/ai-first) |
| [`solid-principles`](.github/skills/solid-principles/SKILL.md) | Single responsibility, open/closed, Liskov substitution, interface segregation, dependency inversion | [SOLID Principles](https://charles2ke.github.io/design-patterns/#/best-practices/solid-principles) |

## Repository quick links

- [Web app documentation](web/README.md)
- [GitHub Pages deployment](https://charles2ke.github.io/design-patterns/)
- [Best-practice skills](.github/skills)
- [Gang of Four catalog](#gang-of-four-gof-design-patterns)

## Gang of Four (GoF) Design Patterns

The GoF catalog contains 23 object-oriented patterns grouped into three families:

- **Creational**: 5
- **Structural**: 7
- **Behavioral**: 11

| ID | Pattern | Category | Intent | Use when |
| --- | --- | --- | --- | --- |
| 1 | Singleton | Creational | Ensure a class has only one instance and provide a global access point. | You need shared state/configuration with controlled access. |
| 2 | Factory Method | Creational | Define an interface for creating an object, but let subclasses decide which class to instantiate. | Creation logic varies by context and you want to avoid tight coupling to concrete classes. |
| 3 | Abstract Factory | Creational | Provide an interface for creating families of related/dependent objects. | You must enforce compatible product variants (for example, light/dark UI kits). |
| 4 | Builder | Creational | Separate the construction of a complex object from its representation. | Objects have many optional fields/steps and telescoping constructors become messy. |
| 5 | Prototype | Creational | Create new objects by cloning an existing instance. | Object setup is expensive and many similar objects are required. |
| 6 | Adapter | Structural | Convert one interface into another clients expect. | You need to integrate incompatible interfaces without changing source code. |
| 7 | Bridge | Structural | Decouple abstraction from implementation so both can vary independently. | You want to avoid class explosion from combining dimensions (shape x renderer, etc.). |
| 8 | Composite | Structural | Compose objects into tree structures and treat part-whole uniformly. | You model hierarchies (file systems, UI trees, org charts). |
| 9 | Decorator | Structural | Add behavior to objects dynamically by wrapping them. | You need optional, combinable features without many subclasses. |
| 10 | Facade | Structural | Provide a simplified interface to a complex subsystem. | You want to hide subsystem complexity behind a stable API. |
| 11 | Flyweight | Structural | Share intrinsic state across many fine-grained objects to reduce memory. | Large numbers of similar objects exist (characters, map tiles, particles). |
| 12 | Proxy | Structural | Provide a surrogate/placeholder to control access to another object. | You need lazy loading, access control, caching, or remote indirection. |
| 13 | Chain of Responsibility | Behavioral | Pass requests along a chain until one handler processes it. | Multiple handlers may process a request and sender should not know receiver. |
| 14 | Command | Behavioral | Encapsulate a request as an object. | You need undo/redo, queueing, logging, or macro operations. |
| 15 | Interpreter | Behavioral | Define grammar and interpreter for a small language. | You need to evaluate domain-specific expressions. |
| 16 | Iterator | Behavioral | Access elements of an aggregate sequentially without exposing internals. | You need uniform traversal over different collections. |
| 17 | Mediator | Behavioral | Encapsulate how objects interact to reduce direct coupling. | Many-to-many object communication becomes hard to maintain. |
| 18 | Memento | Behavioral | Capture and restore an object's internal state without violating encapsulation. | You need snapshots/checkpoints (undo history, rollback). |
| 19 | Observer | Behavioral | Define one-to-many dependency so observers are notified of state changes. | Event-driven updates are needed (UI updates, pub/sub). |
| 20 | State | Behavioral | Let an object alter behavior when its internal state changes. | Behavior branches heavily on state and conditionals become large. |
| 21 | Strategy | Behavioral | Define a family of algorithms, encapsulate each, and make them interchangeable. | You need runtime selection of behavior (sorting, pricing, validation rules). |
| 22 | Template Method | Behavioral | Define algorithm skeleton in a base class and defer steps to subclasses. | Workflows are similar but some steps differ by variant. |
| 23 | Visitor | Behavioral | Separate operations from object structure by moving behavior into visitor objects. | You frequently add operations over a stable object structure. |

---
## Example Code (C#, Java, React, Python, Go, Rust)

Below are practical GoF examples across all requested languages.

### Singleton (Creational)

#### C#
```csharp
public sealed class AppConfig {
    // Lazy<T> is thread-safe by default, so only one instance is ever created.
    private static readonly Lazy<AppConfig> _instance = new(() => new AppConfig());
    public static AppConfig Instance => _instance.Value;
    public string ApiUrl { get; } = "https://api.example.com";
    private AppConfig() { }
}
```

#### Java
```java
final class AppConfig {
  private final String apiUrl = "https://api.example.com";
  private AppConfig() {}
  // The holder class loads on first access, which makes the lazy init thread-safe.
  private static final class Holder { static final AppConfig INSTANCE = new AppConfig(); }
  static AppConfig getInstance() { return Holder.INSTANCE; }
  String apiUrl() { return apiUrl; }
}
```

#### React
```jsx
let instance = null;

// ES modules are evaluated once, so every importer shares this lazily created client.
export function getApiClient() {
  if (!instance) {
    instance = { baseUrl: "https://api.example.com", get: (path) => fetch(instance.baseUrl + path) };
  }
  return instance;
}

export function ApiStatus() {
  return <p>Requests go to {getApiClient().baseUrl}</p>;
}
```

#### Python
```python
import threading

class AppConfig:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:  # double-checked so two threads cannot both create one
                    instance = super().__new__(cls)
                    instance.api_url = "https://api.example.com"
                    cls._instance = instance
        return cls._instance

assert AppConfig() is AppConfig()
```

#### Go
```go
import "sync"

type Config struct{ APIURL string }

var (
	instance *Config
	once     sync.Once
)

// GetConfig creates the instance exactly once, even when called from many goroutines.
func GetConfig() *Config {
	once.Do(func() { instance = &Config{APIURL: "https://api.example.com"} })
	return instance
}
```

#### Rust
```rust
use std::sync::OnceLock;

struct Config {
    api_url: String,
}

// OnceLock initializes the value on first use and is safe to share across threads.
fn config() -> &'static Config {
    static INSTANCE: OnceLock<Config> = OnceLock::new();
    INSTANCE.get_or_init(|| Config { api_url: "https://api.example.com".to_string() })
}
```

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

#### React
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

### Abstract Factory (Creational)

#### C#
```csharp
public interface IButton { string Paint(); }
public interface ICheckbox { string Paint(); }
public interface IThemeFactory { IButton CreateButton(); ICheckbox CreateCheckbox(); }

public class DarkButton : IButton { public string Paint() => "dark button"; }
public class DarkCheckbox : ICheckbox { public string Paint() => "dark checkbox"; }
public class DarkThemeFactory : IThemeFactory {
    public IButton CreateButton() => new DarkButton();
    public ICheckbox CreateCheckbox() => new DarkCheckbox();
}

// The client only knows the abstract factory, so every widget comes from the same family.
public class SettingsForm(IThemeFactory theme) {
    public string Render() => $"{theme.CreateButton().Paint()} + {theme.CreateCheckbox().Paint()}";
}
```

#### Java
```java
interface Button { String paint(); }
interface Checkbox { String paint(); }
interface ThemeFactory { Button createButton(); Checkbox createCheckbox(); }

class LightButton implements Button { public String paint() { return "light button"; } }
class LightCheckbox implements Checkbox { public String paint() { return "light checkbox"; } }
class LightThemeFactory implements ThemeFactory {
  public Button createButton() { return new LightButton(); }
  public Checkbox createCheckbox() { return new LightCheckbox(); }
}

class SettingsForm {
  private final ThemeFactory theme;
  SettingsForm(ThemeFactory theme) { this.theme = theme; }
  String render() { return theme.createButton().paint() + " + " + theme.createCheckbox().paint(); }
}
```

#### React
```jsx
const darkTheme = {
  Button: (props) => <button className="btn btn-dark" {...props} />,
  Checkbox: (props) => <input type="checkbox" className="checkbox checkbox-dark" {...props} />,
};
const lightTheme = {
  Button: (props) => <button className="btn btn-light" {...props} />,
  Checkbox: (props) => <input type="checkbox" className="checkbox checkbox-light" {...props} />,
};

export function SettingsForm({ theme }) {
  const { Button, Checkbox } = theme; // both controls always come from the same family
  return (
    <form>
      <label><Checkbox name="alerts" /> Email alerts</label>
      <Button type="submit">Save</Button>
    </form>
  );
}

export const App = ({ prefersDark }) => <SettingsForm theme={prefersDark ? darkTheme : lightTheme} />;
```

#### Python
```python
from abc import ABC, abstractmethod

class ThemeFactory(ABC):
    @abstractmethod
    def create_button(self): ...
    @abstractmethod
    def create_checkbox(self): ...

class DarkButton:
    def paint(self): return "dark button"

class DarkCheckbox:
    def paint(self): return "dark checkbox"

class DarkThemeFactory(ThemeFactory):
    def create_button(self): return DarkButton()
    def create_checkbox(self): return DarkCheckbox()

def render_settings(theme: ThemeFactory) -> str:
    return f"{theme.create_button().paint()} + {theme.create_checkbox().paint()}"

print(render_settings(DarkThemeFactory()))  # dark button + dark checkbox
```

#### Go
```go
type Button interface{ Paint() string }
type Checkbox interface{ Paint() string }

type ThemeFactory interface {
	CreateButton() Button
	CreateCheckbox() Checkbox
}

type darkButton struct{}
type darkCheckbox struct{}

func (darkButton) Paint() string   { return "dark button" }
func (darkCheckbox) Paint() string { return "dark checkbox" }

type DarkTheme struct{}

func (DarkTheme) CreateButton() Button     { return darkButton{} }
func (DarkTheme) CreateCheckbox() Checkbox { return darkCheckbox{} }

func RenderSettings(theme ThemeFactory) string {
	return theme.CreateButton().Paint() + " + " + theme.CreateCheckbox().Paint()
}
```

#### Rust
```rust
trait Button { fn paint(&self) -> String; }
trait Checkbox { fn paint(&self) -> String; }

trait ThemeFactory {
    fn create_button(&self) -> Box<dyn Button>;
    fn create_checkbox(&self) -> Box<dyn Checkbox>;
}

struct DarkButton;
struct DarkCheckbox;
impl Button for DarkButton { fn paint(&self) -> String { "dark button".into() } }
impl Checkbox for DarkCheckbox { fn paint(&self) -> String { "dark checkbox".into() } }

struct DarkTheme;
impl ThemeFactory for DarkTheme {
    fn create_button(&self) -> Box<dyn Button> { Box::new(DarkButton) }
    fn create_checkbox(&self) -> Box<dyn Checkbox> { Box::new(DarkCheckbox) }
}

fn render_settings(theme: &dyn ThemeFactory) -> String {
    format!("{} + {}", theme.create_button().paint(), theme.create_checkbox().paint())
}
```

### Builder (Creational)

#### C#
```csharp
public record ApiRequest(string Url, string Method, IReadOnlyDictionary<string, string> Headers, TimeSpan Timeout);

public class ApiRequestBuilder(string url) {
    private string _method = "GET";
    private readonly Dictionary<string, string> _headers = new();
    private TimeSpan _timeout = TimeSpan.FromSeconds(30);

    public ApiRequestBuilder Method(string method) { _method = method; return this; }
    public ApiRequestBuilder Header(string name, string value) { _headers[name] = value; return this; }
    public ApiRequestBuilder Timeout(TimeSpan timeout) { _timeout = timeout; return this; }

    public ApiRequest Build() {
        if (!Uri.IsWellFormedUriString(url, UriKind.Absolute))
            throw new InvalidOperationException("An absolute URL is required");
        return new ApiRequest(url, _method, new Dictionary<string, string>(_headers), _timeout);
    }
}

// var request = new ApiRequestBuilder("https://api.example.com/orders")
//     .Method("POST").Header("Accept", "application/json").Build();
```

#### Java
```java
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

record ApiRequest(String url, String method, Map<String, String> headers, Duration timeout) {}

class ApiRequestBuilder {
  private final String url;
  private String method = "GET";
  private final Map<String, String> headers = new HashMap<>();
  private Duration timeout = Duration.ofSeconds(30);

  ApiRequestBuilder(String url) { this.url = url; }
  ApiRequestBuilder method(String method) { this.method = method; return this; }
  ApiRequestBuilder header(String name, String value) { headers.put(name, value); return this; }
  ApiRequestBuilder timeout(Duration timeout) { this.timeout = timeout; return this; }

  ApiRequest build() {
    if (url == null || url.isBlank()) throw new IllegalStateException("url is required");
    return new ApiRequest(url, method, Map.copyOf(headers), timeout);
  }
}
// ApiRequest request = new ApiRequestBuilder("https://api.example.com/orders").method("POST").build();
```

#### React
```jsx
class SearchQueryBuilder {
  #params = new URLSearchParams();
  term(value) { this.#params.set("q", value); return this; }
  filter(key, value) { if (value) this.#params.append(key, value); return this; }
  sort(field, direction = "asc") { this.#params.set("sort", field + ":" + direction); return this; }
  build() {
    if (!this.#params.get("q")) throw new Error("A search term is required");
    return "/api/search?" + this.#params.toString();
  }
}

export function SearchLink({ term, category }) {
  const href = new SearchQueryBuilder().term(term).filter("category", category).sort("price").build();
  return <a href={href}>Search for {term}</a>;
}
```

#### Python
```python
from dataclasses import dataclass, field

@dataclass(frozen=True)
class ApiRequest:
    url: str
    method: str = "GET"
    headers: dict[str, str] = field(default_factory=dict)

class ApiRequestBuilder:
    def __init__(self, url: str):
        self._url, self._method, self._headers = url, "GET", {}

    def method(self, method: str) -> "ApiRequestBuilder":
        self._method = method
        return self

    def header(self, name: str, value: str) -> "ApiRequestBuilder":
        self._headers[name] = value
        return self

    def build(self) -> ApiRequest:
        if not self._url.startswith("https://"):
            raise ValueError("an https URL is required")
        return ApiRequest(self._url, self._method, dict(self._headers))

request = (ApiRequestBuilder("https://api.example.com/orders")
           .method("POST").header("Accept", "application/json").build())
```

#### Go
```go
import (
	"errors"
	"maps"
	"time"
)

type Request struct {
	URL     string
	Method  string
	Headers map[string]string
	Timeout time.Duration
}

type RequestBuilder struct{ req Request }

func NewRequest(url string) *RequestBuilder {
	return &RequestBuilder{req: Request{URL: url, Method: "GET", Headers: map[string]string{}, Timeout: 30 * time.Second}}
}

func (b *RequestBuilder) Method(m string) *RequestBuilder         { b.req.Method = m; return b }
func (b *RequestBuilder) Header(k, v string) *RequestBuilder      { b.req.Headers[k] = v; return b }
func (b *RequestBuilder) Timeout(d time.Duration) *RequestBuilder { b.req.Timeout = d; return b }

func (b *RequestBuilder) Build() (Request, error) {
	if b.req.URL == "" {
		return Request{}, errors.New("url is required")
	}
	req := b.req
	req.Headers = maps.Clone(b.req.Headers) // the built request never shares state with the builder
	return req, nil
}
```

#### Rust
```rust
use std::collections::HashMap;
use std::time::Duration;

struct Request { url: String, method: String, headers: HashMap<String, String>, timeout: Duration }

struct RequestBuilder { url: String, method: String, headers: HashMap<String, String>, timeout: Duration }

impl RequestBuilder {
    fn new(url: &str) -> Self {
        Self { url: url.into(), method: "GET".into(), headers: HashMap::new(), timeout: Duration::from_secs(30) }
    }
    fn method(mut self, method: &str) -> Self { self.method = method.into(); self }
    fn header(mut self, name: &str, value: &str) -> Self { self.headers.insert(name.into(), value.into()); self }
    fn timeout(mut self, timeout: Duration) -> Self { self.timeout = timeout; self }
    fn build(self) -> Result<Request, String> {
        if self.url.is_empty() { return Err("url is required".into()); }
        Ok(Request { url: self.url, method: self.method, headers: self.headers, timeout: self.timeout })
    }
}

// let request = RequestBuilder::new("https://api.example.com/orders").method("POST").build()?;
```

### Prototype (Creational)

#### C#
```csharp
public class Document {
    public string Title { get; set; } = "";
    public List<string> Tags { get; private set; } = new();

    // Deep copy: the clone gets its own list instead of sharing the prototype's.
    public Document Clone() {
        var copy = (Document)MemberwiseClone();
        copy.Tags = new List<string>(Tags);
        return copy;
    }
}

// var template = new Document { Title = "Invoice", Tags = { "finance" } };
// var draft = template.Clone();
// draft.Tags.Add("draft"); // template.Tags is still ["finance"]
```

#### Java
```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

class Document {
  String title;
  final List<String> tags;
  Document(String title, List<String> tags) { this.title = title; this.tags = tags; }
  // Copy-constructor style clone that deep-copies the mutable list.
  Document copy() { return new Document(title, new ArrayList<>(tags)); }
}

class TemplateRegistry {
  private final Map<String, Document> prototypes = new HashMap<>();
  void register(String name, Document prototype) { prototypes.put(name, prototype); }
  Document create(String name) { return prototypes.get(name).copy(); }
}
```

#### React
```jsx
import { useState } from "react";

const prototypes = {
  task: { title: "New task", labels: ["todo"], checklist: [] },
  bug: { title: "New bug", labels: ["bug", "triage"], checklist: ["Steps to reproduce"] },
};

export function Board() {
  const [cards, setCards] = useState([]);
  // structuredClone deep-copies, so cards never share the prototype's arrays.
  const add = (kind) => setCards((prev) => [...prev, { ...structuredClone(prototypes[kind]), id: crypto.randomUUID() }]);
  return (
    <>
      <button onClick={() => add("task")}>Add task</button>
      <button onClick={() => add("bug")}>Add bug</button>
      <ul>{cards.map((card) => <li key={card.id}>{card.title} ({card.labels.join(", ")})</li>)}</ul>
    </>
  );
}
```

#### Python
```python
import copy
from dataclasses import dataclass, field

@dataclass
class Document:
    title: str
    tags: list[str] = field(default_factory=list)

    def clone(self, **changes) -> "Document":
        duplicate = copy.deepcopy(self)  # deep copy, so clones never share the tags list
        for name, value in changes.items():
            setattr(duplicate, name, copy.deepcopy(value))  # overrides are copied too
        return duplicate

template = Document("Invoice", ["finance"])
draft = template.clone(title="Invoice #42")
draft.tags.append("draft")
assert template.tags == ["finance"]
```

#### Go
```go
import "slices"

type Document struct {
	Title string
	Tags  []string
}

// Clone copies the slice too, so the clone never shares the prototype's backing array.
func (d *Document) Clone() *Document {
	return &Document{Title: d.Title, Tags: slices.Clone(d.Tags)}
}

// template := &Document{Title: "Invoice", Tags: []string{"finance"}}
// draft := template.Clone()
// draft.Tags[0] = "draft" // template.Tags is still ["finance"]
```

#### Rust
```rust
#[derive(Clone, Debug)]
struct Document {
    title: String,
    tags: Vec<String>,
}

fn new_invoice(template: &Document, number: u32) -> Document {
    let mut invoice = template.clone(); // Clone copies the Vec, so nothing is shared
    invoice.title = format!("Invoice #{number}");
    invoice
}
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

### Bridge (Structural)

#### C#
```csharp
public interface IChannel { string Deliver(string message); }
public class EmailChannel : IChannel { public string Deliver(string message) => $"email: {message}"; }
public class SmsChannel : IChannel { public string Deliver(string message) => $"sms: {message}"; }

// The abstraction holds a channel, so notification kinds and channels vary independently.
public abstract class Notification(IChannel channel) {
    protected IChannel Channel { get; } = channel;
    public abstract string Send(string text);
}
public class Alert(IChannel channel) : Notification(channel) {
    public override string Send(string text) => Channel.Deliver($"ALERT {text.ToUpperInvariant()}");
}
public class Reminder(IChannel channel) : Notification(channel) {
    public override string Send(string text) => Channel.Deliver($"Reminder: {text}");
}

// new Alert(new SmsChannel()).Send("disk almost full") returns "sms: ALERT DISK ALMOST FULL"
```

#### Java
```java
interface Channel { String deliver(String message); }
class EmailChannel implements Channel { public String deliver(String m) { return "email: " + m; } }
class PushChannel implements Channel { public String deliver(String m) { return "push: " + m; } }

// Two notification kinds x two channels, without four subclasses.
abstract class Notification {
  protected final Channel channel;
  Notification(Channel channel) { this.channel = channel; }
  abstract String send(String text);
}
class Alert extends Notification {
  Alert(Channel channel) { super(channel); }
  String send(String text) { return channel.deliver("ALERT " + text.toUpperCase()); }
}
class Reminder extends Notification {
  Reminder(Channel channel) { super(channel); }
  String send(String text) { return channel.deliver("Reminder: " + text); }
}
```

#### React
```jsx
// Implementations: how a message is delivered.
const channels = {
  email: { deliver: (message) => fetch("/api/email", { method: "POST", body: message }) },
  sms: { deliver: (message) => fetch("/api/sms", { method: "POST", body: message }) },
};

// Abstractions: what is said. Any abstraction works with any channel.
function AlertButton({ channel, text }) {
  return <button onClick={() => channel.deliver("ALERT: " + text)}>Send alert</button>;
}
function ReminderButton({ channel, text }) {
  return <button onClick={() => channel.deliver("Reminder: " + text)}>Send reminder</button>;
}

export const Toolbar = () => (
  <>
    <AlertButton channel={channels.sms} text="Disk almost full" />
    <ReminderButton channel={channels.email} text="Stand-up at 10:00" />
  </>
);
```

#### Python
```python
class EmailChannel:
    def deliver(self, message: str) -> str: return f"email: {message}"

class SmsChannel:
    def deliver(self, message: str) -> str: return f"sms: {message}"

class Notification:
    def __init__(self, channel): self.channel = channel  # the bridge to the implementation

class Alert(Notification):
    def send(self, text: str) -> str: return self.channel.deliver(f"ALERT {text.upper()}")

class Reminder(Notification):
    def send(self, text: str) -> str: return self.channel.deliver(f"Reminder: {text}")

print(Alert(SmsChannel()).send("disk almost full"))  # sms: ALERT DISK ALMOST FULL
```

#### Go
```go
import "strings"

type Channel interface{ Deliver(message string) string }

type Email struct{}
type SMS struct{}

func (Email) Deliver(m string) string { return "email: " + m }
func (SMS) Deliver(m string) string   { return "sms: " + m }

// Abstractions hold a Channel, so notification kinds and channels vary independently.
type Alert struct{ Channel Channel }
type Reminder struct{ Channel Channel }

func (a Alert) Send(text string) string    { return a.Channel.Deliver("ALERT " + strings.ToUpper(text)) }
func (r Reminder) Send(text string) string { return r.Channel.Deliver("Reminder: " + text) }
```

#### Rust
```rust
trait Channel { fn deliver(&self, message: &str) -> String; }
struct Email;
struct Sms;
impl Channel for Email { fn deliver(&self, m: &str) -> String { format!("email: {m}") } }
impl Channel for Sms { fn deliver(&self, m: &str) -> String { format!("sms: {m}") } }

// Abstractions own a channel, so both hierarchies grow independently.
struct Alert { channel: Box<dyn Channel> }
struct Reminder { channel: Box<dyn Channel> }
impl Alert {
    fn send(&self, text: &str) -> String { self.channel.deliver(&format!("ALERT {}", text.to_uppercase())) }
}
impl Reminder {
    fn send(&self, text: &str) -> String { self.channel.deliver(&format!("Reminder: {text}")) }
}
```

### Composite (Structural)

#### C#
```csharp
public interface INode { long Size(); }

public record FileNode(string Name, long Bytes) : INode {
    public long Size() => Bytes;
}

public class Folder(string name) : INode {
    private readonly List<INode> _children = new();
    public string Name => name;
    public Folder Add(INode node) { _children.Add(node); return this; }
    public long Size() => _children.Sum(child => child.Size()); // files and folders answer the same call
}

// new Folder("src").Add(new FileNode("app.cs", 120))
//     .Add(new Folder("lib").Add(new FileNode("util.cs", 80))).Size() == 200
```

#### Java
```java
import java.util.ArrayList;
import java.util.List;

interface Node { long size(); }

record FileNode(String name, long bytes) implements Node {
  public long size() { return bytes; }
}

class Folder implements Node {
  private final List<Node> children = new ArrayList<>();
  Folder add(Node node) { children.add(node); return this; }
  public long size() { return children.stream().mapToLong(Node::size).sum(); }
}
// new Folder().add(new FileNode("a.txt", 120)).add(new Folder().add(new FileNode("b.txt", 80))).size() == 200
```

#### React
```jsx
const tree = {
  name: "src",
  children: [
    { name: "App.jsx" },
    { name: "components", children: [{ name: "Button.jsx" }, { name: "Modal.jsx" }] },
  ],
};

// Files and folders render through the same component; folders recurse into their children.
function TreeItem({ node }) {
  return (
    <li>
      {node.name}
      {node.children && <ul>{node.children.map((child) => <TreeItem key={child.name} node={child} />)}</ul>}
    </li>
  );
}

export const FileTree = () => <ul><TreeItem node={tree} /></ul>;
```

#### Python
```python
class File:
    def __init__(self, name: str, size: int): self.name, self._size = name, size
    def size(self) -> int: return self._size

class Folder:
    def __init__(self, name: str, *children): self.name, self.children = name, list(children)
    def size(self) -> int: return sum(child.size() for child in self.children)

root = Folder("src", File("app.py", 120), Folder("lib", File("util.py", 80)))
print(root.size())  # 200
```

#### Go
```go
type Node interface{ Size() int64 }

type File struct {
	Name  string
	Bytes int64
}

func (f File) Size() int64 { return f.Bytes }

type Folder struct {
	Name     string
	Children []Node
}

// Size treats files and nested folders the same way.
func (f Folder) Size() int64 {
	var total int64
	for _, child := range f.Children {
		total += child.Size()
	}
	return total
}
```

#### Rust
```rust
trait Node { fn size(&self) -> u64; }

struct File { bytes: u64 }
impl Node for File { fn size(&self) -> u64 { self.bytes } }

struct Folder { children: Vec<Box<dyn Node>> }
impl Node for Folder {
    fn size(&self) -> u64 { self.children.iter().map(|child| child.size()).sum() }
}

// let components = Folder { children: vec![Box::new(File { bytes: 80 })] };
// let src = Folder { children: vec![Box::new(File { bytes: 120 }), Box::new(components)] };
// assert_eq!(src.size(), 200);
```

### Decorator (Structural)

#### C#
```csharp
public interface IApiClient { string Get(string path); }

public class HttpApiClient : IApiClient {
    public string Get(string path) => $"response for {path}";
}

public class LoggingClient(IApiClient inner) : IApiClient {
    public string Get(string path) {
        Console.WriteLine($"GET {path}");
        return inner.Get(path);
    }
}

public class CachingClient(IApiClient inner) : IApiClient {
    private readonly Dictionary<string, string> _cache = new();
    public string Get(string path) => _cache.TryGetValue(path, out var hit) ? hit : _cache[path] = inner.Get(path);
}

// Wrappers stack in any order: IApiClient client = new CachingClient(new LoggingClient(new HttpApiClient()));
```

#### Java
```java
import java.util.HashMap;
import java.util.Map;

interface ApiClient { String get(String path); }

class HttpApiClient implements ApiClient {
  public String get(String path) { return "response for " + path; }
}

class LoggingClient implements ApiClient {
  private final ApiClient inner;
  LoggingClient(ApiClient inner) { this.inner = inner; }
  public String get(String path) { System.out.println("GET " + path); return inner.get(path); }
}

class CachingClient implements ApiClient {
  private final ApiClient inner;
  private final Map<String, String> cache = new HashMap<>();
  CachingClient(ApiClient inner) { this.inner = inner; }
  public String get(String path) { return cache.computeIfAbsent(path, inner::get); }
}
// ApiClient client = new CachingClient(new LoggingClient(new HttpApiClient()));
```

#### React
```jsx
// Higher-order components are decorators: each adds one behavior and renders the wrapped component.
const withLoading = (Component) => function WithLoading({ isLoading, ...props }) {
  return isLoading ? <p>Loading...</p> : <Component {...props} />;
};

const withError = (Component) => function WithError({ error, ...props }) {
  return error ? <p role="alert">{error.message}</p> : <Component {...props} />;
};

const UserCard = ({ user }) => <h2>{user.name}</h2>;

export const UserCardWithStates = withError(withLoading(UserCard));
// <UserCardWithStates isLoading={false} error={null} user={{ name: "Ada" }} />
```

#### Python
```python
class HttpClient:
    def get(self, path: str) -> str: return f"response for {path}"

class LoggingClient:
    def __init__(self, inner): self.inner = inner
    def get(self, path: str) -> str:
        print(f"GET {path}")
        return self.inner.get(path)

class CachingClient:
    def __init__(self, inner): self.inner, self.cache = inner, {}
    def get(self, path: str) -> str:
        if path not in self.cache:
            self.cache[path] = self.inner.get(path)
        return self.cache[path]

client = CachingClient(LoggingClient(HttpClient()))
client.get("/users")  # logs "GET /users"
client.get("/users")  # served from the cache, nothing logged
```

#### Go
```go
import "fmt"

type APIClient interface{ Get(path string) string }

type HTTPClient struct{}

func (HTTPClient) Get(path string) string { return "response for " + path }

type LoggingClient struct{ Inner APIClient }

func (c LoggingClient) Get(path string) string {
	fmt.Println("GET", path)
	return c.Inner.Get(path)
}

type CachingClient struct {
	Inner APIClient
	cache map[string]string
}

func (c *CachingClient) Get(path string) string {
	if c.cache == nil {
		c.cache = map[string]string{}
	}
	if _, ok := c.cache[path]; !ok {
		c.cache[path] = c.Inner.Get(path)
	}
	return c.cache[path]
}

// client := &CachingClient{Inner: LoggingClient{Inner: HTTPClient{}}}
```

#### Rust
```rust
use std::collections::HashMap;

trait ApiClient { fn get(&mut self, path: &str) -> String; }

struct HttpClient;
impl ApiClient for HttpClient {
    fn get(&mut self, path: &str) -> String { format!("response for {path}") }
}

struct Logging<C: ApiClient> { inner: C }
impl<C: ApiClient> ApiClient for Logging<C> {
    fn get(&mut self, path: &str) -> String {
        println!("GET {path}");
        self.inner.get(path)
    }
}

struct Caching<C: ApiClient> { inner: C, cache: HashMap<String, String> }
impl<C: ApiClient> ApiClient for Caching<C> {
    fn get(&mut self, path: &str) -> String {
        self.cache.entry(path.to_string()).or_insert_with(|| self.inner.get(path)).clone()
    }
}

// let mut client = Caching { inner: Logging { inner: HttpClient }, cache: HashMap::new() };
```

### Facade (Structural)

#### C#
```csharp
public class Inventory { public bool Reserve(string sku) => true; }
public class Payments { public string Charge(decimal amount) => "payment-123"; }
public class Shipping { public string Schedule(string sku) => "TRACK-42"; }

// One call hides three subsystems and the order they must run in.
public class CheckoutFacade(Inventory inventory, Payments payments, Shipping shipping) {
    public string PlaceOrder(string sku, decimal amount) {
        if (!inventory.Reserve(sku)) throw new InvalidOperationException($"{sku} is out of stock");
        payments.Charge(amount);
        return shipping.Schedule(sku);
    }
}

// var tracking = new CheckoutFacade(new Inventory(), new Payments(), new Shipping()).PlaceOrder("BOOK-1", 25m);
```

#### Java
```java
class Inventory { boolean reserve(String sku) { return true; } }
class Payments { String charge(long cents) { return "payment-123"; } }
class Shipping { String schedule(String sku) { return "TRACK-42"; } }

// Clients make one call instead of coordinating three subsystems.
class CheckoutFacade {
  private final Inventory inventory = new Inventory();
  private final Payments payments = new Payments();
  private final Shipping shipping = new Shipping();

  String placeOrder(String sku, long cents) {
    if (!inventory.reserve(sku)) throw new IllegalStateException(sku + " is out of stock");
    payments.charge(cents);
    return shipping.schedule(sku);
  }
}
```

#### React
```jsx
import { useState } from "react";

async function post(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(url + " failed");
  return response.json();
}

// The hook is the facade: components call checkout() and never coordinate the three services.
function useCheckout() {
  const [status, setStatus] = useState("idle");
  async function checkout(sku) {
    setStatus("processing");
    try {
      await post("/api/inventory/reserve", { sku });
      await post("/api/payments/charge", { sku });
      await post("/api/shipping/schedule", { sku });
      setStatus("ordered");
    } catch {
      setStatus("failed");
    }
  }
  return { status, checkout };
}

export function BuyButton({ sku }) {
  const { status, checkout } = useCheckout();
  return (
    <>
      <button onClick={() => checkout(sku)} disabled={status === "processing"}>Buy now</button>
      {status === "ordered" && <p>Order placed!</p>}
      {status === "failed" && <p role="alert">Checkout failed. Please try again.</p>}
    </>
  );
}
```

#### Python
```python
class Inventory:
    def reserve(self, sku: str) -> bool: return True

class Payments:
    def charge(self, cents: int) -> str: return "payment-123"

class Shipping:
    def schedule(self, sku: str) -> str: return "TRACK-42"

class CheckoutFacade:
    """One call hides three subsystems and the order they must run in."""

    def __init__(self):
        self.inventory, self.payments, self.shipping = Inventory(), Payments(), Shipping()

    def place_order(self, sku: str, cents: int) -> str:
        if not self.inventory.reserve(sku):
            raise RuntimeError(f"{sku} is out of stock")
        self.payments.charge(cents)
        return self.shipping.schedule(sku)

print(CheckoutFacade().place_order("BOOK-1", 2500))  # TRACK-42
```

#### Go
```go
import "fmt"

type Inventory struct{}
type Payments struct{}
type Shipping struct{}

func (Inventory) Reserve(sku string) bool           { return true }
func (Payments) Charge(cents int64) (string, error) { return "payment-123", nil }
func (Shipping) Schedule(sku string) string         { return "TRACK-42" }

// CheckoutFacade gives clients one call instead of three subsystems to coordinate.
type CheckoutFacade struct {
	inventory Inventory
	payments  Payments
	shipping  Shipping
}

func (c CheckoutFacade) PlaceOrder(sku string, cents int64) (string, error) {
	if !c.inventory.Reserve(sku) {
		return "", fmt.Errorf("%s is out of stock", sku)
	}
	if _, err := c.payments.Charge(cents); err != nil {
		return "", fmt.Errorf("charge failed: %w", err)
	}
	return c.shipping.Schedule(sku), nil
}
```

#### Rust
```rust
struct Inventory;
struct Payments;
struct Shipping;
impl Inventory { fn reserve(&self, _sku: &str) -> bool { true } }
impl Payments { fn charge(&self, _cents: u64) -> Result<String, String> { Ok("payment-123".into()) } }
impl Shipping { fn schedule(&self, _sku: &str) -> String { "TRACK-42".into() } }

// One call hides three subsystems and the order they must run in.
struct CheckoutFacade { inventory: Inventory, payments: Payments, shipping: Shipping }

impl CheckoutFacade {
    fn place_order(&self, sku: &str, cents: u64) -> Result<String, String> {
        if !self.inventory.reserve(sku) { return Err(format!("{sku} is out of stock")); }
        self.payments.charge(cents)?;
        Ok(self.shipping.schedule(sku))
    }
}
```

### Flyweight (Structural)

#### C#
```csharp
public record Glyph(char Symbol, string Font); // intrinsic state: shared and immutable

public class GlyphFactory {
    private readonly Dictionary<(char, string), Glyph> _cache = new();
    public int Count => _cache.Count;

    public Glyph Get(char symbol, string font) {
        if (!_cache.TryGetValue((symbol, font), out var glyph)) {
            glyph = new Glyph(symbol, font);
            _cache[(symbol, font)] = glyph;
        }
        return glyph;
    }
}

// Extrinsic state (the position) lives outside the shared flyweight.
public record PlacedGlyph(Glyph Glyph, int X, int Y);
```

#### Java
```java
import java.util.HashMap;
import java.util.Map;

record Glyph(char symbol, String font) {} // intrinsic state: shared and immutable

class GlyphFactory {
  private final Map<String, Glyph> cache = new HashMap<>();
  Glyph get(char symbol, String font) {
    return cache.computeIfAbsent(symbol + "|" + font, key -> new Glyph(symbol, font));
  }
  int size() { return cache.size(); }
}

// Extrinsic state (the position) is stored per use, next to the shared glyph.
record PlacedGlyph(Glyph glyph, int x, int y) {}
```

#### React
```jsx
const iconCache = new Map();

// Each distinct icon is created once and shared by every marker that uses it.
function getIcon(kind) {
  if (!iconCache.has(kind)) {
    iconCache.set(kind, { src: "/icons/" + kind + ".svg", alt: kind + " marker" });
  }
  return iconCache.get(kind);
}

// Extrinsic state (the position) stays with each marker.
function Marker({ kind, x, y }) {
  const icon = getIcon(kind);
  return <img src={icon.src} alt={icon.alt} width={24} height={24} style={{ position: "absolute", left: x, top: y }} />;
}

export function MapLayer({ places }) {
  return (
    <div style={{ position: "relative" }}>
      {places.map((place) => <Marker key={place.id} kind={place.kind} x={place.x} y={place.y} />)}
    </div>
  );
}
```

#### Python
```python
from dataclasses import dataclass
from functools import lru_cache

@dataclass(frozen=True)
class Glyph:  # intrinsic state: shared and immutable
    symbol: str
    font: str

@lru_cache(maxsize=1024)
def glyph(symbol: str, font: str) -> Glyph:
    return Glyph(symbol, font)

# Extrinsic state (each character's position) lives outside the flyweight.
text = "hello" * 1000
placed = [(glyph(char, "Inter"), position) for position, char in enumerate(text)]
print(len(placed), glyph.cache_info().currsize)  # 5000 4
```

#### Go
```go
// Glyph holds the intrinsic state that many characters share. Its fields are unexported,
// so code in other packages reads them through accessors and cannot assign to them.
type Glyph struct {
	symbol rune
	font   string
}

func (g Glyph) Symbol() rune { return g.symbol }
func (g Glyph) Font() string { return g.font }

type GlyphFactory struct{ cache map[Glyph]*Glyph }

func NewGlyphFactory() *GlyphFactory { return &GlyphFactory{cache: map[Glyph]*Glyph{}} }

// Get returns one shared *Glyph per (symbol, font) pair.
func (f *GlyphFactory) Get(symbol rune, font string) *Glyph {
	key := Glyph{symbol: symbol, font: font}
	if g, ok := f.cache[key]; ok {
		return g
	}
	f.cache[key] = &key
	return &key
}

// PlacedGlyph keeps the extrinsic state (the position) next to the shared pointer.
type PlacedGlyph struct {
	Glyph *Glyph
	X, Y  int
}
```

#### Rust
```rust
use std::collections::HashMap;
use std::rc::Rc;

struct Glyph { symbol: char, font: String } // intrinsic state: shared and immutable

#[derive(Default)]
struct GlyphFactory { cache: HashMap<(char, String), Rc<Glyph>> }

impl GlyphFactory {
    fn get(&mut self, symbol: char, font: &str) -> Rc<Glyph> {
        let glyph = self.cache.entry((symbol, font.to_string()))
            .or_insert_with(|| Rc::new(Glyph { symbol, font: font.to_string() }));
        Rc::clone(glyph)
    }
}

// Extrinsic state (the position) is stored per use, next to a cheap Rc pointer.
struct PlacedGlyph { glyph: Rc<Glyph>, x: u32, y: u32 }
```

### Proxy (Structural)

#### C#
```csharp
public interface IReportService { string Generate(string user); }

public class ReportService : IReportService {
    // Expensive to create: imagine the constructor loads a large dataset.
    public string Generate(string user) => $"Revenue report for {user}";
}

// Same interface as the real service, plus an access check and lazy creation.
public class ReportProxy(Func<string, bool> isAdmin) : IReportService {
    private readonly Lazy<ReportService> _real = new(() => new ReportService());

    public string Generate(string user) {
        if (!isAdmin(user)) throw new UnauthorizedAccessException($"{user} cannot view reports");
        return _real.Value.Generate(user);
    }
}
```

#### Java
```java
import java.util.function.Predicate;

interface ReportService { String generate(String user); }

class RealReportService implements ReportService {
  RealReportService() { /* expensive: loads a large dataset */ }
  public String generate(String user) { return "Revenue report for " + user; }
}

// Same interface as the real service, plus an access check and lazy creation.
class ReportProxy implements ReportService {
  private final Predicate<String> isAdmin;
  private RealReportService real;
  ReportProxy(Predicate<String> isAdmin) { this.isAdmin = isAdmin; }

  public synchronized String generate(String user) {
    if (!isAdmin.test(user)) throw new SecurityException(user + " cannot view reports");
    if (real == null) real = new RealReportService();
    return real.generate(user);
  }
}
```

#### React
```jsx
import { lazy, Suspense } from "react";

// React.lazy returns a virtual proxy: the chart's code downloads only when it first renders.
const RevenueChart = lazy(() => import("./RevenueChart"));

// The dashboard also acts as a protection proxy by checking the role first.
export function Dashboard({ user }) {
  if (user.role !== "admin") return <p role="alert">You do not have access to revenue reports.</p>;
  return (
    <Suspense fallback={<p>Loading chart...</p>}>
      <RevenueChart />
    </Suspense>
  );
}
```

#### Python
```python
class ReportService:
    def __init__(self):
        print("loading a large dataset...")  # expensive, so the proxy delays it

    def generate(self, user: str) -> str:
        return f"Revenue report for {user}"

class ReportProxy:
    """Same interface as ReportService, plus an access check and lazy creation."""

    def __init__(self, admins: set[str]):
        self._admins, self._real = admins, None

    def generate(self, user: str) -> str:
        if user not in self._admins:
            raise PermissionError(f"{user} cannot view reports")
        if self._real is None:
            self._real = ReportService()
        return self._real.generate(user)

reports = ReportProxy(admins={"ada"})
print(reports.generate("ada"))  # the dataset loads here, on first use
```

#### Go
```go
import (
	"errors"
	"sync"
)

type ReportService interface {
	Generate(user string) (string, error)
}

type realReports struct{} // expensive to create: imagine it loads a large dataset

func (*realReports) Generate(user string) (string, error) { return "Revenue report for " + user, nil }

// ReportProxy checks access and creates the real service only on first authorized use.
type ReportProxy struct {
	IsAdmin func(user string) bool
	once    sync.Once
	real    *realReports
}

func (p *ReportProxy) Generate(user string) (string, error) {
	if !p.IsAdmin(user) {
		return "", errors.New(user + " cannot view reports")
	}
	p.once.Do(func() { p.real = &realReports{} })
	return p.real.Generate(user)
}
```

#### Rust
```rust
use std::cell::OnceCell;

trait ReportService { fn generate(&self, user: &str) -> Result<String, String>; }

struct RealReports; // expensive to create: imagine it loads a large dataset
impl ReportService for RealReports {
    fn generate(&self, user: &str) -> Result<String, String> { Ok(format!("Revenue report for {user}")) }
}

// The proxy checks access first and builds the real service only on first authorized use.
struct ReportProxy { admins: Vec<String>, real: OnceCell<RealReports> }
impl ReportService for ReportProxy {
    fn generate(&self, user: &str) -> Result<String, String> {
        if !self.admins.iter().any(|admin| admin == user) {
            return Err(format!("{user} cannot view reports"));
        }
        self.real.get_or_init(|| RealReports).generate(user)
    }
}
```

### Chain of Responsibility (Behavioral)

#### C#
```csharp
public record Request(string? Token, int RecentRequests);

public abstract class Handler {
    private Handler? _next;
    public Handler SetNext(Handler next) { _next = next; return next; }
    // Each handler either answers the request or passes it along the chain.
    public virtual string Handle(Request request) => _next?.Handle(request) ?? "200 OK";
}

public class AuthHandler : Handler {
    public override string Handle(Request request) =>
        request.Token is null ? "401 Unauthorized" : base.Handle(request);
}

public class RateLimitHandler(int limit) : Handler {
    public override string Handle(Request request) =>
        request.RecentRequests > limit ? "429 Too Many Requests" : base.Handle(request);
}

// var chain = new AuthHandler();
// chain.SetNext(new RateLimitHandler(100));
// chain.Handle(new Request("token", 3)) == "200 OK"
```

#### Java
```java
record Request(String token, int recentRequests) {}

abstract class Handler {
  private Handler next;
  Handler linkWith(Handler next) { this.next = next; return next; }
  // Each handler either answers the request or passes it along the chain.
  String handle(Request request) { return next == null ? "200 OK" : next.handle(request); }
}

class AuthHandler extends Handler {
  String handle(Request r) { return r.token() == null ? "401 Unauthorized" : super.handle(r); }
}

class RateLimitHandler extends Handler {
  private final int limit;
  RateLimitHandler(int limit) { this.limit = limit; }
  String handle(Request r) { return r.recentRequests() > limit ? "429 Too Many Requests" : super.handle(r); }
}
// Handler chain = new AuthHandler(); chain.linkWith(new RateLimitHandler(100));
```

#### React
```jsx
import { useState } from "react";

// Each rule either reports a problem or hands the value to the next rule in the chain.
const required = (next) => (value) => (value ? next(value) : "Password is required");
const minLength = (min) => (next) => (value) =>
  value.length >= min ? next(value) : "Use at least " + min + " characters";
const hasDigit = (next) => (value) => (/\d/.test(value) ? next(value) : "Include at least one number");
const accept = () => null;

const validatePassword = required(minLength(12)(hasDigit(accept)));

export function PasswordField() {
  const [password, setPassword] = useState("");
  const error = validatePassword(password);
  return (
    <>
      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={Boolean(error)}
        />
      </label>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
```

#### Python
```python
class Handler:
    def __init__(self, next_handler=None): self.next = next_handler

    def handle(self, request: dict) -> str:
        return self.next.handle(request) if self.next else "200 OK"

class Auth(Handler):
    def handle(self, request):
        return "401 Unauthorized" if not request.get("token") else super().handle(request)

class RateLimit(Handler):
    def __init__(self, limit: int, next_handler=None):
        super().__init__(next_handler)
        self.limit = limit

    def handle(self, request):
        return "429 Too Many Requests" if request["recent"] > self.limit else super().handle(request)

chain = Auth(RateLimit(100))
print(chain.handle({"token": "abc", "recent": 3}))  # 200 OK
print(chain.handle({"recent": 3}))                  # 401 Unauthorized
```

#### Go
```go
import (
	"errors"
	"io"
	"net/http"
)

// Each middleware either rejects the request or passes it to the next handler.
// RequireAuth asks the injected validator, so only verified credentials get through.
func RequireAuth(valid func(authorization string) bool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !valid(r.Header.Get("Authorization")) {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func RejectLargeBodies(limit int64) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.ContentLength > limit {
				http.Error(w, "request too large", http.StatusRequestEntityTooLarge)
				return
			}
			r.Body = http.MaxBytesReader(w, r.Body, limit)
			next.ServeHTTP(w, r)
		})
	}
}

func CreateOrder(w http.ResponseWriter, r *http.Request) {
	if _, err := io.ReadAll(r.Body); err != nil {
		var maxBytesErr *http.MaxBytesError
		if errors.As(err, &maxBytesErr) {
			http.Error(w, "request too large", http.StatusRequestEntityTooLarge)
			return
		}
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
}

// orders := RejectLargeBodies(1<<20)(http.HandlerFunc(CreateOrder))
// http.Handle("/orders", RequireAuth(verifySessionToken)(orders))
```

#### Rust
```rust
struct Request { token: Option<String>, recent_requests: u32 }

trait Handler { fn handle(&self, request: &Request) -> String; }

struct Auth { next: Box<dyn Handler> }
struct RateLimit { limit: u32, next: Box<dyn Handler> }
struct Accept;

// Each handler either answers the request or passes it to the next one.
impl Handler for Auth {
    fn handle(&self, r: &Request) -> String {
        if r.token.is_none() { return "401 Unauthorized".into(); }
        self.next.handle(r)
    }
}
impl Handler for RateLimit {
    fn handle(&self, r: &Request) -> String {
        if r.recent_requests > self.limit { return "429 Too Many Requests".into(); }
        self.next.handle(r)
    }
}
impl Handler for Accept { fn handle(&self, _: &Request) -> String { "200 OK".into() } }

// let chain = Auth { next: Box::new(RateLimit { limit: 100, next: Box::new(Accept) }) };
```

### Command (Behavioral)

#### C#
```csharp
public interface ICommand { void Execute(); void Undo(); }

public class Document { public string Text { get; set; } = ""; }

public class AppendText(Document doc, string text) : ICommand {
    public void Execute() => doc.Text += text;
    public void Undo() => doc.Text = doc.Text[..^text.Length];
}

// The invoker runs commands and keeps them for undo without knowing what they do.
public class Editor {
    private readonly Stack<ICommand> _history = new();
    public void Run(ICommand command) { command.Execute(); _history.Push(command); }
    public void Undo() { if (_history.TryPop(out var command)) command.Undo(); }
}
```

#### Java
```java
import java.util.ArrayDeque;
import java.util.Deque;

interface Command { void execute(); void undo(); }

class Document { final StringBuilder text = new StringBuilder(); }

class AppendText implements Command {
  private final Document doc;
  private final String text;
  AppendText(Document doc, String text) { this.doc = doc; this.text = text; }
  public void execute() { doc.text.append(text); }
  public void undo() { doc.text.setLength(doc.text.length() - text.length()); }
}

// The invoker runs commands and keeps them for undo without knowing what they do.
class Editor {
  private final Deque<Command> history = new ArrayDeque<>();
  void run(Command command) { command.execute(); history.push(command); }
  void undo() { if (!history.isEmpty()) history.pop().undo(); }
}
```

#### React
```jsx
import { useState } from "react";

// Each command knows how to apply itself and how to reverse itself.
const commands = {
  increment: { label: "+1", execute: (n) => n + 1, undo: (n) => n - 1 },
  double: { label: "x2", execute: (n) => n * 2, undo: (n) => n / 2 },
};

export function Calculator() {
  const [value, setValue] = useState(1);
  const [history, setHistory] = useState([]);

  function run(command) {
    setValue(command.execute(value));
    setHistory([...history, command]);
  }
  function undo() {
    setValue(history.at(-1).undo(value));
    setHistory(history.slice(0, -1));
  }

  return (
    <>
      <output aria-live="polite">{value}</output>
      {Object.entries(commands).map(([name, command]) => (
        <button key={name} onClick={() => run(command)}>{command.label}</button>
      ))}
      <button onClick={undo} disabled={history.length === 0}>Undo</button>
    </>
  );
}
```

#### Python
```python
class Document:
    def __init__(self): self.text = ""

class AppendText:
    def __init__(self, doc: Document, text: str): self.doc, self.text = doc, text
    def execute(self): self.doc.text += self.text
    def undo(self): self.doc.text = self.doc.text[: len(self.doc.text) - len(self.text)]

class Editor:
    """The invoker: runs commands and keeps them for undo without knowing what they do."""

    def __init__(self): self.history = []

    def run(self, command):
        command.execute()
        self.history.append(command)

    def undo(self):
        if self.history:
            self.history.pop().undo()

doc, editor = Document(), Editor()
editor.run(AppendText(doc, "Hello"))
editor.run(AppendText(doc, ", world"))
editor.undo()
print(doc.text)  # Hello
```

#### Go
```go
type Command interface {
	Execute()
	Undo()
}

type Document struct{ Text string }

type AppendText struct {
	Doc  *Document
	Text string
}

func (c AppendText) Execute() { c.Doc.Text += c.Text }
func (c AppendText) Undo()    { c.Doc.Text = c.Doc.Text[:len(c.Doc.Text)-len(c.Text)] }

// Editor is the invoker: it runs and undoes commands without knowing what they do.
type Editor struct{ history []Command }

func (e *Editor) Run(c Command) {
	c.Execute()
	e.history = append(e.history, c)
}

func (e *Editor) Undo() {
	if n := len(e.history); n > 0 {
		e.history[n-1].Undo()
		e.history = e.history[:n-1]
	}
}
```

#### Rust
```rust
trait Command {
    fn execute(&self, doc: &mut String);
    fn undo(&self, doc: &mut String);
}

struct AppendText(String);
impl Command for AppendText {
    fn execute(&self, doc: &mut String) { doc.push_str(&self.0); }
    fn undo(&self, doc: &mut String) { doc.truncate(doc.len() - self.0.len()); }
}

// The invoker keeps executed commands so it can undo them in reverse order.
#[derive(Default)]
struct Editor { doc: String, history: Vec<Box<dyn Command>> }
impl Editor {
    fn run(&mut self, command: Box<dyn Command>) {
        command.execute(&mut self.doc);
        self.history.push(command);
    }
    fn undo(&mut self) {
        if let Some(command) = self.history.pop() { command.undo(&mut self.doc); }
    }
}
```

### Interpreter (Behavioral)

#### C#
```csharp
using Context = System.Collections.Generic.IReadOnlyDictionary<string, decimal>;

// Each grammar rule is a class that knows how to evaluate itself.
public interface IExpression { decimal Interpret(Context context); }
public record Number(decimal Value) : IExpression { public decimal Interpret(Context _) => Value; }
public record Variable(string Name) : IExpression { public decimal Interpret(Context c) => c[Name]; }
public record Add(IExpression Left, IExpression Right) : IExpression {
    public decimal Interpret(Context c) => Left.Interpret(c) + Right.Interpret(c);
}
public record Multiply(IExpression Left, IExpression Right) : IExpression {
    public decimal Interpret(Context c) => Left.Interpret(c) * Right.Interpret(c);
}

// price * quantity + 5
// var total = new Add(new Multiply(new Variable("price"), new Variable("quantity")), new Number(5));
// total.Interpret(new Dictionary<string, decimal> { ["price"] = 10, ["quantity"] = 3 }) == 35
```

#### Java
```java
import java.util.Map;

// Each grammar rule is a record that knows how to evaluate itself.
interface Expr { int eval(Map<String, Integer> context); }
record Num(int value) implements Expr { public int eval(Map<String, Integer> c) { return value; } }
record Var(String name) implements Expr { public int eval(Map<String, Integer> c) { return c.get(name); } }
record Add(Expr left, Expr right) implements Expr {
  public int eval(Map<String, Integer> c) { return left.eval(c) + right.eval(c); }
}
record Mul(Expr left, Expr right) implements Expr {
  public int eval(Map<String, Integer> c) { return left.eval(c) * right.eval(c); }
}
// price * quantity + 5
// Expr total = new Add(new Mul(new Var("price"), new Var("quantity")), new Num(5));
// total.eval(Map.of("price", 10, "quantity", 3)) == 35
```

#### React
```jsx
// A tiny rule language stored as JSON, for example fetched from a feature-flag service.
const canSeeBilling = { and: [{ eq: ["plan", "pro"] }, { or: [{ eq: ["role", "admin"] }, { gt: ["seats", 10] }] }] };

// Each operator is a grammar rule; interpret() evaluates the tree recursively.
function interpret(rule, user) {
  if (rule.and) return rule.and.every((child) => interpret(child, user));
  if (rule.or) return rule.or.some((child) => interpret(child, user));
  if (rule.eq) return user[rule.eq[0]] === rule.eq[1];
  if (rule.gt) return user[rule.gt[0]] > rule.gt[1];
  throw new Error("Unknown rule: " + JSON.stringify(rule));
}

export function BillingLink({ user }) {
  return interpret(canSeeBilling, user) ? <a href="/billing">Billing</a> : null;
}
```

#### Python
```python
from dataclasses import dataclass

# Each grammar rule is a class that knows how to evaluate itself.
@dataclass
class Num:
    value: int
    def interpret(self, ctx): return self.value

@dataclass
class Var:
    name: str
    def interpret(self, ctx): return ctx[self.name]

@dataclass
class Add:
    left: object
    right: object
    def interpret(self, ctx): return self.left.interpret(ctx) + self.right.interpret(ctx)

@dataclass
class Mul:
    left: object
    right: object
    def interpret(self, ctx): return self.left.interpret(ctx) * self.right.interpret(ctx)

total = Add(Mul(Var("price"), Var("quantity")), Num(5))  # price * quantity + 5
print(total.interpret({"price": 10, "quantity": 3}))  # 35
```

#### Go
```go
// Expr is the grammar; each node type knows how to evaluate itself.
type Expr interface{ Eval(ctx map[string]int) int }

type Num int
type Var string
type Add struct{ Left, Right Expr }
type Mul struct{ Left, Right Expr }

func (n Num) Eval(map[string]int) int     { return int(n) }
func (v Var) Eval(ctx map[string]int) int { return ctx[string(v)] }
func (a Add) Eval(ctx map[string]int) int { return a.Left.Eval(ctx) + a.Right.Eval(ctx) }
func (m Mul) Eval(ctx map[string]int) int { return m.Left.Eval(ctx) * m.Right.Eval(ctx) }

// price * quantity + 5
// total := Add{Mul{Var("price"), Var("quantity")}, Num(5)}
// total.Eval(map[string]int{"price": 10, "quantity": 3}) == 35
```

#### Rust
```rust
use std::collections::HashMap;

// The grammar as an enum; eval() interprets one node and recurses into its children.
enum Expr {
    Num(i64),
    Var(&'static str),
    Add(Box<Expr>, Box<Expr>),
    Mul(Box<Expr>, Box<Expr>),
}

impl Expr {
    fn eval(&self, ctx: &HashMap<&str, i64>) -> i64 {
        match self {
            Expr::Num(n) => *n,
            Expr::Var(name) => ctx[name],
            Expr::Add(left, right) => left.eval(ctx) + right.eval(ctx),
            Expr::Mul(left, right) => left.eval(ctx) * right.eval(ctx),
        }
    }
}

// price * quantity + 5
// let product = Expr::Mul(Box::new(Expr::Var("price")), Box::new(Expr::Var("quantity")));
// let total = Expr::Add(Box::new(product), Box::new(Expr::Num(5)));
```

### Iterator (Behavioral)

#### C#
```csharp
// Callers just foreach; the paging logic stays hidden inside the iterator.
public class PagedResults<T>(Func<int, IReadOnlyList<T>> fetchPage) : IEnumerable<T> {
    public IEnumerator<T> GetEnumerator() {
        for (var page = 1; ; page++) {
            var items = fetchPage(page);
            if (items.Count == 0) yield break;
            foreach (var item in items) yield return item;
        }
    }

    System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator() => GetEnumerator();
}

// foreach (var order in new PagedResults<Order>(page => api.GetOrders(page))) { ... }
```

#### Java
```java
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.function.IntFunction;

// Callers use a for-each loop; fetching page after page stays hidden.
class PagedResults<T> implements Iterable<T> {
  private final IntFunction<List<T>> fetchPage;
  PagedResults(IntFunction<List<T>> fetchPage) { this.fetchPage = fetchPage; }

  public Iterator<T> iterator() {
    return new Iterator<>() {
      private int page = 0;
      private Iterator<T> current = Collections.emptyIterator();
      private boolean exhausted = false;

      public boolean hasNext() {
        while (!current.hasNext() && !exhausted) {
          List<T> items = fetchPage.apply(++page);
          exhausted = items.isEmpty();
          current = items.iterator();
        }
        return current.hasNext();
      }

      public T next() {
        if (!hasNext()) throw new NoSuchElementException();
        return current.next();
      }
    };
  }
}
```

#### React
```jsx
class TaskQueue {
  #head = null;
  #tail = null;
  add(task) {
    const node = { task, next: null };
    if (this.#tail) this.#tail.next = node;
    else this.#head = node;
    this.#tail = node;
    return this;
  }
  // Anything that consumes iterables (for...of, spread, Array.from) can walk the list.
  *[Symbol.iterator]() {
    for (let node = this.#head; node; node = node.next) yield node.task;
  }
}

const queue = new TaskQueue().add("Write tests").add("Review PR").add("Deploy");

export const Tasks = () => <ol>{Array.from(queue, (task) => <li key={task}>{task}</li>)}</ol>;
```

#### Python
```python
from collections.abc import Callable, Iterator

def paginate(fetch_page: Callable[[int], list[str]]) -> Iterator[str]:
    """Yields items one at a time and fetches the next page only when it is needed."""
    page = 1
    while items := fetch_page(page):
        yield from items
        page += 1

pages = {1: ["a", "b"], 2: ["c"]}
print(list(paginate(lambda page: pages.get(page, []))))  # ['a', 'b', 'c']
```

#### Go
```go
import "iter"

// Paginate exposes every item as one sequence and fetches pages lazily.
func Paginate(fetchPage func(page int) []string) iter.Seq[string] {
	return func(yield func(string) bool) {
		for page := 1; ; page++ {
			items := fetchPage(page)
			if len(items) == 0 {
				return
			}
			for _, item := range items {
				if !yield(item) {
					return
				}
			}
		}
	}
}

// for order := range Paginate(api.OrdersPage) { fmt.Println(order) }
```

#### Rust
```rust
// Implementing Iterator gives callers for loops, map, filter and take for free.
struct Paginator<F: FnMut(usize) -> Vec<String>> {
    fetch_page: F,
    page: usize,
    buffer: std::vec::IntoIter<String>,
}

impl<F: FnMut(usize) -> Vec<String>> Iterator for Paginator<F> {
    type Item = String;
    fn next(&mut self) -> Option<String> {
        loop {
            if let Some(item) = self.buffer.next() { return Some(item); }
            self.page += 1;
            let items = (self.fetch_page)(self.page);
            if items.is_empty() { return None; }
            self.buffer = items.into_iter();
        }
    }
}

// let first_ten: Vec<String> =
//     Paginator { fetch_page: |page| api.orders(page), page: 0, buffer: Vec::new().into_iter() }.take(10).collect();
```

### Mediator (Behavioral)

#### C#
```csharp
public class ChatRoom {
    private readonly List<User> _members = new();
    public void Join(User user) { _members.Add(user); user.Room = this; }

    // Users never reference each other; the room decides who receives each message.
    public void Broadcast(User sender, string message) {
        foreach (var member in _members.Where(m => m != sender)) member.Receive($"{sender.Name}: {message}");
    }
}

public class User(string name) {
    public string Name => name;
    public ChatRoom? Room { get; set; }
    public List<string> Inbox { get; } = new();
    public void Send(string message) => Room?.Broadcast(this, message);
    public void Receive(string message) => Inbox.Add(message);
}
```

#### Java
```java
import java.util.ArrayList;
import java.util.List;

class ChatRoom {
  private final List<User> members = new ArrayList<>();
  void join(User user) { members.add(user); }
  // Users only talk to the room; the room routes each message.
  void broadcast(User sender, String message) {
    for (User member : members) if (member != sender) member.receive(sender.name + ": " + message);
  }
}

class User {
  final String name;
  final List<String> inbox = new ArrayList<>();
  private final ChatRoom room;
  User(String name, ChatRoom room) { this.name = name; this.room = room; }
  void send(String message) { room.broadcast(this, message); }
  void receive(String message) { inbox.add(message); }
}
// ChatRoom room = new ChatRoom();
// User ada = new User("Ada", room), bob = new User("Bob", room);
// room.join(ada); room.join(bob); ada.send("hi"); // bob.inbox == ["Ada: hi"]
```

#### React
```jsx
import { useState } from "react";

const SameAsBilling = ({ checked, onChange }) => (
  <label>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    Same as billing address
  </label>
);

const AddressField = ({ value, disabled, onChange }) => (
  <label>
    Shipping address
    <input value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
  </label>
);

// The form is the mediator: the two fields never talk to each other directly.
export function ShippingForm({ billingAddress }) {
  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [address, setAddress] = useState("");
  return (
    <form>
      <SameAsBilling checked={sameAsBilling} onChange={setSameAsBilling} />
      <AddressField value={sameAsBilling ? billingAddress : address} disabled={sameAsBilling} onChange={setAddress} />
    </form>
  );
}
```

#### Python
```python
class ChatRoom:
    def __init__(self): self.members = []

    def join(self, user: "User"):
        self.members.append(user)
        user.room = self

    def broadcast(self, sender: "User", message: str):
        for member in self.members:
            if member is not sender:  # the room, not the sender, decides who hears it
                member.inbox.append(f"{sender.name}: {message}")

class User:
    def __init__(self, name: str): self.name, self.room, self.inbox = name, None, []
    def send(self, message: str): self.room.broadcast(self, message)

room, ada, bob = ChatRoom(), User("Ada"), User("Bob")
room.join(ada)
room.join(bob)
ada.send("hi")
print(bob.inbox)  # ['Ada: hi']
```

#### Go
```go
type ChatRoom struct{ members []*User }

type User struct {
	Name  string
	Inbox []string
	room  *ChatRoom
}

func (r *ChatRoom) Join(u *User) {
	u.room = r
	r.members = append(r.members, u)
}

// Broadcast is the only place that knows who should receive a message.
func (r *ChatRoom) Broadcast(from *User, message string) {
	for _, m := range r.members {
		if m != from {
			m.Inbox = append(m.Inbox, from.Name+": "+message)
		}
	}
}

func (u *User) Send(message string) { u.room.Broadcast(u, message) }
```

#### Rust
```rust
struct Member { name: String, inbox: Vec<String> }

// The room owns every member; members are addressed by id and never hold references to each other.
#[derive(Default)]
struct ChatRoom { members: Vec<Member> }

impl ChatRoom {
    fn join(&mut self, name: &str) -> usize {
        self.members.push(Member { name: name.into(), inbox: Vec::new() });
        self.members.len() - 1
    }
    fn send(&mut self, from: usize, message: &str) {
        let line = format!("{}: {message}", self.members[from].name);
        for (id, member) in self.members.iter_mut().enumerate() {
            if id != from { member.inbox.push(line.clone()); }
        }
    }
}
```

### Memento (Behavioral)

#### C#
```csharp
public interface IMemento { } // opaque to everyone except the editor

public class Editor {
    public string Text { get; set; } = "";
    public int Cursor { get; set; }

    private record Snapshot(string Text, int Cursor) : IMemento;

    public IMemento Save() => new Snapshot(Text, Cursor);
    public void Restore(IMemento memento) {
        var snapshot = (Snapshot)memento;
        (Text, Cursor) = (snapshot.Text, snapshot.Cursor);
    }
}

// The caretaker stores mementos but cannot read or change them.
public class History(Editor editor) {
    private readonly Stack<IMemento> _snapshots = new();
    public void Checkpoint() => _snapshots.Push(editor.Save());
    public void Undo() { if (_snapshots.TryPop(out var memento)) editor.Restore(memento); }
}
```

#### Java
```java
import java.util.ArrayDeque;
import java.util.Deque;

interface Memento {} // opaque to everyone except the editor

class Editor {
  private String text = "";
  private int cursor;
  private record Snapshot(String text, int cursor) implements Memento {}

  void write(String words) { text += words; cursor = text.length(); }
  String text() { return text; }
  Memento save() { return new Snapshot(text, cursor); }
  void restore(Memento memento) {
    Snapshot snapshot = (Snapshot) memento;
    text = snapshot.text();
    cursor = snapshot.cursor();
  }
}

// The caretaker stores mementos but cannot read or change them.
class History {
  private final Deque<Memento> snapshots = new ArrayDeque<>();
  private final Editor editor;
  History(Editor editor) { this.editor = editor; }
  void checkpoint() { snapshots.push(editor.save()); }
  void undo() { if (!snapshots.isEmpty()) editor.restore(snapshots.pop()); }
}
```

#### React
```jsx
import { useState } from "react";

export function DraftEditor() {
  const [draft, setDraft] = useState({ title: "", body: "" });
  const [snapshots, setSnapshots] = useState([]);

  // React state is never mutated, so the current draft object is already a safe snapshot.
  const checkpoint = () => setSnapshots([...snapshots, draft]);
  const restore = () => {
    setDraft(snapshots.at(-1));
    setSnapshots(snapshots.slice(0, -1));
  };

  return (
    <>
      <label>Title <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
      <label>Body <textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} /></label>
      <button onClick={checkpoint}>Save checkpoint</button>
      <button onClick={restore} disabled={snapshots.length === 0}>Restore last checkpoint</button>
    </>
  );
}
```

#### Python
```python
from dataclasses import dataclass

@dataclass(frozen=True)
class Snapshot:  # the memento: immutable, and only the editor reads it
    text: str
    cursor: int

class Editor:
    def __init__(self): self.text, self.cursor = "", 0

    def write(self, words: str):
        self.text += words
        self.cursor = len(self.text)

    def save(self) -> Snapshot: return Snapshot(self.text, self.cursor)
    def restore(self, snapshot: Snapshot): self.text, self.cursor = snapshot.text, snapshot.cursor

editor, history = Editor(), []
editor.write("Hello")
history.append(editor.save())  # the caretaker only stores snapshots
editor.write(" world")
editor.restore(history.pop())
print(editor.text)  # Hello
```

#### Go
```go
// Snapshot's fields are unexported, so code outside the package cannot read or change them.
type Snapshot struct {
	text   string
	cursor int
}

type Editor struct {
	text   string
	cursor int
}

func (e *Editor) Write(s string) {
	e.text += s
	e.cursor = len(e.text)
}

func (e *Editor) Save() Snapshot     { return Snapshot{text: e.text, cursor: e.cursor} }
func (e *Editor) Restore(s Snapshot) { e.text, e.cursor = s.text, s.cursor }

// History is the caretaker: it stores snapshots without looking inside them.
type History struct{ snapshots []Snapshot }

func (h *History) Push(s Snapshot) { h.snapshots = append(h.snapshots, s) }

func (h *History) Pop() (Snapshot, bool) {
	n := len(h.snapshots)
	if n == 0 {
		return Snapshot{}, false
	}
	s := h.snapshots[n-1]
	h.snapshots = h.snapshots[:n-1]
	return s, true
}
```

#### Rust
```rust
mod editor {
    // The field is private to this module, so only the editor can read a snapshot.
    pub struct Snapshot { text: String }

    #[derive(Default)]
    pub struct Editor { text: String }

    impl Editor {
        pub fn write(&mut self, words: &str) { self.text.push_str(words); }
        pub fn text(&self) -> &str { &self.text }
        pub fn save(&self) -> Snapshot { Snapshot { text: self.text.clone() } }
        pub fn restore(&mut self, snapshot: Snapshot) { self.text = snapshot.text; }
    }
}

// let mut doc = editor::Editor::default();
// let mut history = vec![doc.save()]; // the caretaker just holds snapshots
// doc.write("draft");
// doc.restore(history.pop().unwrap()); // doc.text() == ""
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

### State (Behavioral)

#### C#
```csharp
public abstract class OrderState {
    public string Name => GetType().Name;
    // By default every transition is rejected; each state overrides only the moves it allows.
    public virtual OrderState Pay() => throw new InvalidOperationException($"Cannot pay a {Name} order");
    public virtual OrderState Ship() => throw new InvalidOperationException($"Cannot ship a {Name} order");
    public virtual OrderState Cancel() => throw new InvalidOperationException($"Cannot cancel a {Name} order");
}

public class Draft : OrderState {
    public override OrderState Pay() => new Paid();
    public override OrderState Cancel() => new Cancelled();
}
public class Paid : OrderState {
    public override OrderState Ship() => new Shipped();
    public override OrderState Cancel() => new Cancelled();
}
public class Shipped : OrderState { }
public class Cancelled : OrderState { }

// The order delegates to its current state instead of switching on a status field.
public class Order {
    public OrderState State { get; private set; } = new Draft();
    public void Pay() => State = State.Pay();
    public void Ship() => State = State.Ship();
    public void Cancel() => State = State.Cancel();
}
```

#### Java
```java
enum OrderState {
  DRAFT {
    OrderState pay() { return PAID; }
    OrderState cancel() { return CANCELLED; }
  },
  PAID {
    OrderState ship() { return SHIPPED; }
    OrderState cancel() { return CANCELLED; }
  },
  SHIPPED,
  CANCELLED;

  // By default every transition is rejected; each state overrides only the moves it allows.
  OrderState pay() { throw new IllegalStateException("Cannot pay a " + this + " order"); }
  OrderState ship() { throw new IllegalStateException("Cannot ship a " + this + " order"); }
  OrderState cancel() { throw new IllegalStateException("Cannot cancel a " + this + " order"); }
}

class Order {
  private OrderState state = OrderState.DRAFT;
  void pay() { state = state.pay(); }
  void ship() { state = state.ship(); }
  void cancel() { state = state.cancel(); }
  OrderState state() { return state; }
}
```

#### React
```jsx
import { useReducer } from "react";

// Each state lists the actions it allows and the state each action leads to.
const orderStates = {
  draft: { pay: "paid", cancel: "cancelled" },
  paid: { ship: "shipped", cancel: "cancelled" },
  shipped: {},
  cancelled: {},
};

const orderReducer = (state, action) => orderStates[state][action] ?? state;

export function OrderActions() {
  const [state, dispatch] = useReducer(orderReducer, "draft");
  return (
    <>
      <p>Status: {state}</p>
      {Object.keys(orderStates[state]).map((action) => (
        <button key={action} onClick={() => dispatch(action)}>{action}</button>
      ))}
    </>
  );
}
```

#### Python
```python
class OrderState:
    # By default every transition is rejected; each state overrides only the moves it allows.
    def pay(self): raise ValueError(f"cannot pay a {self} order")
    def ship(self): raise ValueError(f"cannot ship a {self} order")
    def cancel(self): raise ValueError(f"cannot cancel a {self} order")
    def __str__(self): return type(self).__name__.lower()

class Draft(OrderState):
    def pay(self): return Paid()
    def cancel(self): return Cancelled()

class Paid(OrderState):
    def ship(self): return Shipped()
    def cancel(self): return Cancelled()

class Shipped(OrderState): pass
class Cancelled(OrderState): pass

class Order:
    def __init__(self): self.state = Draft()
    def pay(self): self.state = self.state.pay()
    def ship(self): self.state = self.state.ship()
    def cancel(self): self.state = self.state.cancel()

order = Order()
order.pay()
order.ship()
print(order.state)  # shipped
```

#### Go
```go
import "errors"

type OrderState interface {
	Pay() (OrderState, error)
	Ship() (OrderState, error)
	Cancel() (OrderState, error)
}

var errNotAllowed = errors.New("transition not allowed in this state")

// base rejects every transition; each state embeds it and overrides only the moves it allows.
type base struct{}

func (base) Pay() (OrderState, error)    { return nil, errNotAllowed }
func (base) Ship() (OrderState, error)   { return nil, errNotAllowed }
func (base) Cancel() (OrderState, error) { return nil, errNotAllowed }

type Draft struct{ base }
type Paid struct{ base }
type Shipped struct{ base }
type Cancelled struct{ base }

func (Draft) Pay() (OrderState, error)    { return Paid{}, nil }
func (Draft) Cancel() (OrderState, error) { return Cancelled{}, nil }
func (Paid) Ship() (OrderState, error)    { return Shipped{}, nil }
func (Paid) Cancel() (OrderState, error)  { return Cancelled{}, nil }

type Order struct{ State OrderState }

func (o *Order) apply(next OrderState, err error) error {
	if err == nil {
		o.State = next
	}
	return err
}

func (o *Order) Pay() error    { return o.apply(o.State.Pay()) }
func (o *Order) Ship() error   { return o.apply(o.State.Ship()) }
func (o *Order) Cancel() error { return o.apply(o.State.Cancel()) }

// order := &Order{State: Draft{}}
```

#### Rust
```rust
// Each state returns the next state, or None when the transition is not allowed.
trait OrderState {
    fn name(&self) -> &'static str;
    fn pay(&self) -> Option<Box<dyn OrderState>> { None }
    fn ship(&self) -> Option<Box<dyn OrderState>> { None }
}

struct Draft;
struct Paid;
struct Shipped;

impl OrderState for Draft {
    fn name(&self) -> &'static str { "draft" }
    fn pay(&self) -> Option<Box<dyn OrderState>> { Some(Box::new(Paid)) }
}
impl OrderState for Paid {
    fn name(&self) -> &'static str { "paid" }
    fn ship(&self) -> Option<Box<dyn OrderState>> { Some(Box::new(Shipped)) }
}
impl OrderState for Shipped { fn name(&self) -> &'static str { "shipped" } }

struct Order { state: Box<dyn OrderState> }

impl Order {
    fn pay(&mut self) -> Result<(), String> {
        self.state = self.state.pay().ok_or_else(|| format!("cannot pay a {} order", self.state.name()))?;
        Ok(())
    }
    fn ship(&mut self) -> Result<(), String> {
        self.state = self.state.ship().ok_or_else(|| format!("cannot ship a {} order", self.state.name()))?;
        Ok(())
    }
}
```

### Strategy (Behavioral)

#### C#
```csharp
public interface IPricingStrategy { decimal Total(decimal subtotal); }

public class RegularPricing : IPricingStrategy { public decimal Total(decimal subtotal) => subtotal; }

public class SalePricing(decimal percentOff) : IPricingStrategy {
    public decimal Total(decimal subtotal) => subtotal * (1 - percentOff / 100);
}

public class BulkPricing(decimal threshold) : IPricingStrategy {
    public decimal Total(decimal subtotal) => subtotal >= threshold ? subtotal * 0.9m : subtotal;
}

// The checkout works with any strategy, and the strategy can change at runtime.
public class Checkout(IPricingStrategy pricing) {
    public IPricingStrategy Pricing { get; set; } = pricing;
    public decimal Total(IEnumerable<decimal> prices) => Pricing.Total(prices.Sum());
}
```

#### Java
```java
import java.util.function.LongUnaryOperator;

// Each strategy maps a subtotal in cents to the amount to charge.
final class Pricing {
  static final LongUnaryOperator REGULAR = cents -> cents;
  static final LongUnaryOperator BLACK_FRIDAY = cents -> cents * 70 / 100;
  static LongUnaryOperator bulk(long thresholdCents) {
    return cents -> cents >= thresholdCents ? cents * 90 / 100 : cents;
  }
}

class Checkout {
  private LongUnaryOperator pricing = Pricing.REGULAR;
  void setPricing(LongUnaryOperator pricing) { this.pricing = pricing; }
  long total(long subtotalCents) { return pricing.applyAsLong(subtotalCents); }
}
```

#### React
```jsx
import { useState } from "react";

// Interchangeable comparison strategies; the list does not care which one is active.
const sortStrategies = {
  "Price: low to high": (a, b) => a.price - b.price,
  "Price: high to low": (a, b) => b.price - a.price,
  "Name": (a, b) => a.name.localeCompare(b.name),
};

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function ProductList({ products }) {
  const [strategy, setStrategy] = useState("Price: low to high");
  const sorted = [...products].sort(sortStrategies[strategy]);
  return (
    <>
      <label>
        Sort by
        <select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
          {Object.keys(sortStrategies).map((name) => <option key={name}>{name}</option>)}
        </select>
      </label>
      <ul>{sorted.map((p) => <li key={p.id}>{p.name}: {currency.format(p.price)}</li>)}</ul>
    </>
  );
}
```

#### Python
```python
from collections.abc import Callable

PricingStrategy = Callable[[int], int]  # subtotal in cents -> amount to charge

def regular(cents: int) -> int: return cents
def black_friday(cents: int) -> int: return cents * 70 // 100

def bulk(threshold: int) -> PricingStrategy:
    return lambda cents: cents * 90 // 100 if cents >= threshold else cents

class Checkout:
    def __init__(self, pricing: PricingStrategy = regular): self.pricing = pricing
    def total(self, subtotal_cents: int) -> int: return self.pricing(subtotal_cents)

checkout = Checkout(bulk(threshold=50_000))
print(checkout.total(60_000))  # 54000
checkout.pricing = black_friday  # swap the strategy at runtime
```

#### Go
```go
// PricingStrategy maps a subtotal in cents to the amount to charge.
type PricingStrategy func(cents int64) int64

func Regular(cents int64) int64     { return cents }
func BlackFriday(cents int64) int64 { return cents * 70 / 100 }

func Enterprise(threshold int64) PricingStrategy {
	return func(cents int64) int64 {
		if cents >= threshold {
			return cents * 85 / 100
		}
		return cents
	}
}

type Checkout struct{ Pricing PricingStrategy }

func (c Checkout) Total(subtotal int64) int64 { return c.Pricing(subtotal) }

// Checkout{Pricing: Enterprise(500_00)}.Total(600_00) == 510_00
```

#### Rust
```rust
trait PricingStrategy { fn total(&self, cents: u64) -> u64; }

struct Regular;
struct PercentOff(u64);
impl PricingStrategy for Regular { fn total(&self, cents: u64) -> u64 { cents } }
impl PricingStrategy for PercentOff { fn total(&self, cents: u64) -> u64 { cents * (100 - self.0) / 100 } }

struct Checkout { pricing: Box<dyn PricingStrategy> }
impl Checkout {
    fn total(&self, subtotal: u64) -> u64 { self.pricing.total(subtotal) }
}

// let mut checkout = Checkout { pricing: Box::new(Regular) };
// checkout.pricing = Box::new(PercentOff(20)); // swap the strategy at runtime
```

### Template Method (Behavioral)

#### C#
```csharp
public abstract class DataImporter {
    // The template method fixes the order of the steps; subclasses fill in the details.
    public int Import(string raw) {
        var rows = Parse(raw).Where(IsValid).ToList();
        Save(rows);
        return rows.Count;
    }

    protected abstract IEnumerable<string[]> Parse(string raw);
    protected virtual bool IsValid(string[] row) => row.All(cell => !string.IsNullOrWhiteSpace(cell));
    protected virtual void Save(List<string[]> rows) => Console.WriteLine($"saved {rows.Count} rows");
}

public class CsvImporter : DataImporter {
    // TrimEnd('\r') lets Windows (CRLF) line endings parse like LF ones.
    protected override IEnumerable<string[]> Parse(string raw) =>
        raw.Split('\n').Select(line => line.TrimEnd('\r').Split(','));
}

public class TsvImporter : DataImporter {
    protected override IEnumerable<string[]> Parse(string raw) =>
        raw.Split('\n').Select(line => line.TrimEnd('\r').Split('\t'));
}
```

#### Java
```java
import java.util.Arrays;
import java.util.List;

abstract class DataImporter {
  // final: subclasses can change the steps but not their order.
  final int importData(String raw) {
    List<String[]> rows = parse(raw).stream().filter(this::isValid).toList();
    save(rows);
    return rows.size();
  }

  protected abstract List<String[]> parse(String raw);
  protected boolean isValid(String[] row) { return Arrays.stream(row).noneMatch(String::isBlank); }
  protected void save(List<String[]> rows) { System.out.println("saved " + rows.size() + " rows"); }
}

class CsvImporter extends DataImporter {
  protected List<String[]> parse(String raw) {
    return raw.lines().map(line -> line.split(",", -1)).toList(); // -1 keeps empty trailing cells
  }
}
```

#### React
```jsx
// DataPanel fixes the skeleton (heading, then the list or an empty state);
// callers supply only the steps that vary.
function DataPanel({ title, items, renderItem, renderEmpty = () => <p>Nothing here yet.</p> }) {
  return (
    <section>
      <h2>{title}</h2>
      {items.length === 0 ? renderEmpty() : <ul>{items.map((item) => <li key={item.id}>{renderItem(item)}</li>)}</ul>}
    </section>
  );
}

export function OrdersPanel({ orders }) {
  return (
    <DataPanel
      title="Recent orders"
      items={orders}
      renderItem={(order) => <a href={"/orders/" + order.id}>Order #{order.id}</a>}
      renderEmpty={() => <p>No orders yet. <a href="/shop">Start shopping</a></p>}
    />
  );
}
```

#### Python
```python
from abc import ABC, abstractmethod

class DataImporter(ABC):
    def run(self, raw: str) -> int:
        """The template method: the steps and their order never change."""
        rows = [row for row in self.parse(raw) if self.is_valid(row)]
        self.save(rows)
        return len(rows)

    @abstractmethod
    def parse(self, raw: str) -> list[list[str]]: ...

    def is_valid(self, row: list[str]) -> bool:  # a hook with a default
        return all(cell.strip() for cell in row)

    def save(self, rows: list[list[str]]) -> None:
        print(f"saved {len(rows)} rows")

class CsvImporter(DataImporter):
    def parse(self, raw: str) -> list[list[str]]:
        return [line.split(",") for line in raw.splitlines()]

CsvImporter().run("ada,42\nbob,\ncy,7")  # saved 2 rows
```

#### Go
```go
import (
	"fmt"
	"slices"
	"strings"
)

// Steps are the parts that differ between importers.
type Steps interface {
	Parse(raw string) [][]string
	Valid(row []string) bool
}

// Import is the template: the order of the steps is defined once, here.
func Import(s Steps, raw string) int {
	var rows [][]string
	for _, row := range s.Parse(raw) {
		if s.Valid(row) {
			rows = append(rows, row)
		}
	}
	fmt.Printf("saved %d rows\n", len(rows))
	return len(rows)
}

type CSV struct{}

func (CSV) Parse(raw string) [][]string {
	var rows [][]string
	for _, line := range strings.Split(raw, "\n") {
		// Trimming the \r lets Windows (CRLF) line endings parse like LF ones.
		rows = append(rows, strings.Split(strings.TrimSuffix(line, "\r"), ","))
	}
	return rows
}

func (CSV) Valid(row []string) bool { return !slices.Contains(row, "") }
```

#### Rust
```rust
trait DataImporter {
    fn parse(&self, raw: &str) -> Vec<Vec<String>>;
    fn is_valid(&self, row: &[String]) -> bool { row.iter().all(|cell| !cell.trim().is_empty()) }
    fn save(&self, rows: &[Vec<String>]) { println!("saved {} rows", rows.len()); }

    // The template method: implementors customize the steps, not their order.
    fn import(&self, raw: &str) -> usize {
        let rows: Vec<_> = self.parse(raw).into_iter().filter(|row| self.is_valid(row)).collect();
        self.save(&rows);
        rows.len()
    }
}

struct CsvImporter;
impl DataImporter for CsvImporter {
    fn parse(&self, raw: &str) -> Vec<Vec<String>> {
        raw.lines().map(|line| line.split(',').map(String::from).collect()).collect()
    }
}
```

### Visitor (Behavioral)

#### C#
```csharp
public interface IShapeVisitor<T> { T Visit(Circle circle); T Visit(Rectangle rectangle); }

public interface IShape { T Accept<T>(IShapeVisitor<T> visitor); }
public record Circle(double Radius) : IShape { public T Accept<T>(IShapeVisitor<T> v) => v.Visit(this); }
public record Rectangle(double Width, double Height) : IShape { public T Accept<T>(IShapeVisitor<T> v) => v.Visit(this); }

// A new operation is a new visitor; the shape classes never change.
public class AreaVisitor : IShapeVisitor<double> {
    public double Visit(Circle c) => Math.PI * c.Radius * c.Radius;
    public double Visit(Rectangle r) => r.Width * r.Height;
}

public class SvgVisitor : IShapeVisitor<string> {
    public string Visit(Circle c) => FormattableString.Invariant($"<circle r='{c.Radius}' />");
    public string Visit(Rectangle r) => FormattableString.Invariant($"<rect width='{r.Width}' height='{r.Height}' />");
}

// IShape[] shapes = [new Circle(1), new Rectangle(2, 3)];
// var totalArea = shapes.Sum(shape => shape.Accept(new AreaVisitor()));
```

#### Java
```java
interface ShapeVisitor<T> { T visitCircle(Circle c); T visitRectangle(Rectangle r); }

interface Shape { <T> T accept(ShapeVisitor<T> visitor); }
record Circle(double radius) implements Shape {
  public <T> T accept(ShapeVisitor<T> v) { return v.visitCircle(this); }
}
record Rectangle(double width, double height) implements Shape {
  public <T> T accept(ShapeVisitor<T> v) { return v.visitRectangle(this); }
}

// A new operation is a new visitor; the shape classes never change.
class AreaVisitor implements ShapeVisitor<Double> {
  public Double visitCircle(Circle c) { return Math.PI * c.radius() * c.radius(); }
  public Double visitRectangle(Rectangle r) { return r.width() * r.height(); }
}

class SvgVisitor implements ShapeVisitor<String> {
  public String visitCircle(Circle c) { return "<circle r='" + c.radius() + "' />"; }
  public String visitRectangle(Rectangle r) { return "<rect width='" + r.width() + "' height='" + r.height() + "' />"; }
}
```

#### React
```jsx
// The document tree is plain data; each visitor adds one operation without changing the nodes.
const renderVisitor = {
  doc: (node, children) => <article>{children}</article>,
  paragraph: (node, children, key) => <p key={key}>{children}</p>,
  bold: (node, children, key) => <strong key={key}>{children}</strong>,
  text: (node) => node.value,
};

const sum = (numbers) => numbers.reduce((total, n) => total + n, 0);
const wordCountVisitor = {
  doc: (node, counts) => sum(counts),
  paragraph: (node, children) => children.join("").split(/\s+/).filter(Boolean).length,
  bold: (node, children) => children.join(""),
  text: (node) => node.value,
};

// accept() walks the tree and dispatches each node to the visitor method for its type.
function accept(node, visitor, key) {
  const children = (node.children ?? []).map((child, index) => accept(child, visitor, index));
  return visitor[node.type](node, children, key);
}

export function Article({ doc }) {
  return (
    <>
      {accept(doc, renderVisitor)}
      <p>{accept(doc, wordCountVisitor)} words</p>
    </>
  );
}
```

#### Python
```python
import math
from dataclasses import dataclass

@dataclass
class Circle:
    radius: float
    def accept(self, visitor): return visitor.visit_circle(self)

@dataclass
class Rectangle:
    width: float
    height: float
    def accept(self, visitor): return visitor.visit_rectangle(self)

# A new operation is a new visitor; the shape classes never change.
class AreaVisitor:
    def visit_circle(self, c): return math.pi * c.radius ** 2
    def visit_rectangle(self, r): return r.width * r.height

class SvgVisitor:
    def visit_circle(self, c): return f"<circle r='{c.radius}' />"
    def visit_rectangle(self, r): return f"<rect width='{r.width}' height='{r.height}' />"

shapes = [Circle(1), Rectangle(2, 3)]
print(round(sum(shape.accept(AreaVisitor()) for shape in shapes), 2))  # 9.14
print("".join(shape.accept(SvgVisitor()) for shape in shapes))
```

#### Go
```go
import (
	"fmt"
	"math"
)

type Visitor interface {
	VisitCircle(c Circle)
	VisitRectangle(r Rectangle)
}

type Shape interface{ Accept(v Visitor) }

type Circle struct{ Radius float64 }
type Rectangle struct{ Width, Height float64 }

func (c Circle) Accept(v Visitor)    { v.VisitCircle(c) }
func (r Rectangle) Accept(v Visitor) { v.VisitRectangle(r) }

// A new operation is a new visitor type; the shapes never change.
type AreaVisitor struct{ Total float64 }

func (a *AreaVisitor) VisitCircle(c Circle)       { a.Total += math.Pi * c.Radius * c.Radius }
func (a *AreaVisitor) VisitRectangle(r Rectangle) { a.Total += r.Width * r.Height }

type SVGVisitor struct{ Out string }

func (s *SVGVisitor) VisitCircle(c Circle) { s.Out += fmt.Sprintf("<circle r='%g' />", c.Radius) }
func (s *SVGVisitor) VisitRectangle(r Rectangle) {
	s.Out += fmt.Sprintf("<rect width='%g' height='%g' />", r.Width, r.Height)
}
```

#### Rust
```rust
trait Visitor {
    fn visit_circle(&mut self, c: &Circle);
    fn visit_rectangle(&mut self, r: &Rectangle);
}

trait Shape { fn accept(&self, visitor: &mut dyn Visitor); }

struct Circle { radius: f64 }
struct Rectangle { width: f64, height: f64 }
impl Shape for Circle { fn accept(&self, v: &mut dyn Visitor) { v.visit_circle(self) } }
impl Shape for Rectangle { fn accept(&self, v: &mut dyn Visitor) { v.visit_rectangle(self) } }

// A new operation is a new visitor; Circle and Rectangle never change.
#[derive(Default)]
struct Area { total: f64 }
impl Visitor for Area {
    fn visit_circle(&mut self, c: &Circle) { self.total += std::f64::consts::PI * c.radius * c.radius; }
    fn visit_rectangle(&mut self, r: &Rectangle) { self.total += r.width * r.height; }
}

#[derive(Default)]
struct Svg { out: String }
impl Visitor for Svg {
    fn visit_circle(&mut self, c: &Circle) { self.out += &format!("<circle r='{}' />", c.radius); }
    fn visit_rectangle(&mut self, r: &Rectangle) {
        self.out += &format!("<rect width='{}' height='{}' />", r.width, r.height);
    }
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
