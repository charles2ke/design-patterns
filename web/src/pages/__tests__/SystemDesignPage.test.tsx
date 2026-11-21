import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SystemDesignPage } from '../SystemDesignPage';
import { systemDesignQuestions } from '../../data/system-design-questions';
import { urlShortener } from '../../data/system-design/url-shortener';
import type { SystemDesignQuestion } from '../../types/system-design';

const fixtures: SystemDesignQuestion[] = [
  urlShortener,
  {
    ...urlShortener,
    slug: 'medium-stripe',
    title: 'Design a medium fixture',
    difficulty: 'Medium',
    companies: ['Stripe'],
  },
  {
    ...urlShortener,
    slug: 'hard-openai',
    title: 'Design a hard fixture',
    difficulty: 'Hard',
    companies: ['OpenAI', 'Uber'],
  },
];

function filterButton(group: 'Difficulty' | 'Company', name: string) {
  return within(screen.getByRole('group', { name: group })).getByRole('button', { name });
}

describe('SystemDesignPage', () => {
  it('groups every question under its difficulty level', () => {
    render(<SystemDesignPage />);

    expect(
      screen.getByRole('heading', { name: 'System Design Interview Questions', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/companies do not publish their interview questions/)).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent(
      `Showing ${systemDesignQuestions.length} of ${systemDesignQuestions.length} questions`,
    );
    for (const level of ['Easy', 'Medium', 'Hard'] as const) {
      const expected = systemDesignQuestions.filter(({ difficulty }) => difficulty === level);
      const section = screen.getByRole('region', { name: level });

      expect(section).toHaveTextContent(`${expected.length} questions.`);
      expect(
        within(section)
          .getAllByRole('heading', { level: 3 })
          .map((heading) => heading.textContent),
      ).toEqual(expected.map(({ title }) => title));
    }
  });

  it('filters by difficulty and company, mirrors them in the URL and can clear them', async () => {
    const user = userEvent.setup();
    render(<SystemDesignPage source={fixtures} />);

    await user.click(filterButton('Difficulty', 'Hard'));

    expect(filterButton('Difficulty', 'Hard')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Showing 1 of 3 questions');
    expect(screen.queryByRole('region', { name: 'Easy' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Hard' })).toHaveTextContent('1 question.');

    await user.click(filterButton('Company', 'Other'));

    expect(screen.getByRole('article', { name: 'Design a hard fixture' })).toBeInTheDocument();

    await user.click(filterButton('Company', 'Google'));

    expect(window.location.hash).toBe('#/system-design?difficulty=Hard&company=Google');
    expect(screen.getByText('No questions match your filters.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(screen.getByRole('status')).toHaveTextContent('Showing 3 of 3 questions');
    expect(window.location.hash).toBe('#/system-design');
  });

  it('reveals the full worked solution when expanded', async () => {
    const user = userEvent.setup();
    render(<SystemDesignPage source={[urlShortener]} />);

    const article = screen.getByRole('article', { name: urlShortener.title });
    const companies = within(article).getByRole('list', { name: 'Reported at' });
    expect(within(companies).getAllByRole('listitem').map((item) => item.textContent)).toEqual(
      urlShortener.companies,
    );
    const details = article.querySelector('details')!;
    expect(details.open).toBe(false);

    await user.click(within(article).getByText('Show detailed solution'));

    expect(details.open).toBe(true);
    expect(within(article).getByRole('heading', { name: '1. Requirements' })).toBeVisible();
    // The diagram's whitespace is its layout, so it must reach the DOM untouched.
    expect(within(article).getByRole('img', { name: /architecture diagram/ }).textContent).toBe(
      urlShortener.architecture.diagram,
    );
    expect(within(article).getAllByRole('row')).toHaveLength(urlShortener.tradeOffs.length + 1);
    expect(
      within(article).getByRole('region', {
        name: `${urlShortener.title}: ${urlShortener.code.label}`,
      }),
    ).toHaveTextContent(urlShortener.code.code.split('\n')[0]!);
    expect(within(article).getByText(urlShortener.followUps[0]!.question)).toBeVisible();
  });
});
