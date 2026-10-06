import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { InterviewQuestionsPage } from '../InterviewQuestionsPage';
import { interviewQuestions } from '../../data/interview-questions';

describe('InterviewQuestionsPage', () => {
  it('renders the heading and one section per category', () => {
    render(<InterviewQuestionsPage />);

    expect(
      screen.getByRole('heading', { name: 'Tough Interview Questions', level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Design Patterns questions', level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'System Design questions', level: 2 }),
    ).toBeInTheDocument();
  });

  it('renders every question as a labelled article with a solution', () => {
    const { container } = render(<InterviewQuestionsPage />);

    const articles = screen.getAllByRole('article');
    expect(articles).toHaveLength(interviewQuestions.length);
    expect(container.querySelectorAll('details.interview-page__solution')).toHaveLength(
      interviewQuestions.length,
    );
    expect(container.querySelectorAll('.interview-page__example pre code')).toHaveLength(
      interviewQuestions.length,
    );

    for (const question of interviewQuestions) {
      expect(
        screen.getByRole('article', {
          name: (accessibleName) => accessibleName.endsWith(question.title),
        }),
      ).toBeInTheDocument();
    }
  });

  it('numbers questions separately within each category', () => {
    render(<InterviewQuestionsPage />);

    const designSection = screen
      .getByRole('heading', { name: 'Design Patterns questions', level: 2 })
      .closest('section')!;
    const systemSection = screen
      .getByRole('heading', { name: 'System Design questions', level: 2 })
      .closest('section')!;

    const firstDesign = within(designSection).getAllByRole('heading', { level: 3 })[0];
    const firstSystem = within(systemSection).getAllByRole('heading', { level: 3 })[0];
    expect(firstDesign.textContent).toMatch(/^1\. /);
    expect(firstSystem.textContent).toMatch(/^1\. /);
  });

  it('reveals the complete solution when the summary is clicked', async () => {
    const user = userEvent.setup();
    render(<InterviewQuestionsPage />);

    const article = screen.getByRole('article', { name: /URL shortener/ });
    const details = article.querySelector('details')!;
    expect(details.open).toBe(false);

    await user.click(within(article).getByText('Show complete solution'));

    expect(details.open).toBe(true);
    expect(within(article).getByRole('heading', { name: 'ID generation', level: 4 })).toBeVisible();
    expect(
      within(article).getByRole('heading', { name: 'Likely follow-up questions', level: 4 }),
    ).toBeVisible();
  });
});
