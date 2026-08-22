export const SKILLS_BASE_URL =
  'https://github.com/charles2ke/design-patterns/blob/main/.github/skills';

interface SkillLinkProps {
  /** Directory name of the skill under `.github/skills`. */
  skill: string;
}

export function SkillLink({ skill }: SkillLinkProps) {
  return (
    <p className="skill-link">
      <a
        className="skill-link__anchor"
        href={`${SKILLS_BASE_URL}/${skill}/SKILL.md`}
        target="_blank"
        rel="noreferrer"
        data-testid={`skill-link-${skill}`}
      >
        Copilot skill on GitHub
      </a>
    </p>
  );
}
