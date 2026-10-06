import { describe, expect, it } from 'vitest';
import { INTERVIEW_CATEGORIES, interviewQuestions } from '../interview-questions';

describe('interview questions data', () => {
  it('uses unique slugs', () => {
    const slugs = interviewQuestions.map((question) => question.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('covers every category with several questions', () => {
    for (const category of INTERVIEW_CATEGORIES) {
      expect(
        interviewQuestions.filter((question) => question.category === category).length,
      ).toBeGreaterThanOrEqual(5);
    }
  });

  it('gives every question a complete solution, code sample and follow-ups', () => {
    for (const question of interviewQuestions) {
      expect(question.question.length).toBeGreaterThan(0);
      expect(question.whyItIsHard.length).toBeGreaterThan(0);
      expect(question.solution.length).toBeGreaterThan(0);
      for (const section of question.solution) {
        expect(section.heading.length).toBeGreaterThan(0);
        expect(section.points.length).toBeGreaterThan(0);
      }
      expect(question.code.label.length).toBeGreaterThan(0);
      expect(question.code.code.trim().length).toBeGreaterThan(0);
      expect(question.followUps.length).toBeGreaterThan(0);
    }
  });
});
