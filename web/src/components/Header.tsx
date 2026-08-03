interface HeaderProps {
  title: string;
  subtitle: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="header">
      <h1>{title}</h1>
      <p className="header__subtitle">{subtitle}</p>
    </header>
  );
}
