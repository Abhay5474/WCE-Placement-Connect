/* Pure-logic tests for the AI layer — no database required, so they run in any
   environment and validate the deterministic mock provider + heuristics. */
import { analyze, extractTags, qualityScore } from '../src/services/ai/writingAssistant.js';
import { classify } from '../src/services/ai/classifier.js';
import { extractQuestions } from '../src/services/ai/interviewAnalyzer.js';
import { moderate } from '../src/services/ai/moderation.js';
import { cosine } from '../src/services/ai/vectorStore.js';
import { embed } from '../src/services/ai/providers/mockProvider.js';

const SAMPLE =
  'I attended the Microsoft SDE interview. Round 1 asked me to reverse a linked list and explain REST APIs. ' +
  'I prepared DSA and system design for weeks. Finally I was selected.';

describe('classifier', () => {
  test('classifies a placement/technical experience', () => {
    const { categories } = classify(SAMPLE);
    // Sample mentions DSA, system design and a placement outcome.
    expect(categories.length).toBeGreaterThan(0);
    expect(categories).toEqual(expect.arrayContaining(['DSA']));
  });
});

describe('writing assistant', () => {
  test('extracts placement-relevant tags', () => {
    const tags = extractTags(SAMPLE).map((t) => t.toLowerCase());
    expect(tags).toEqual(expect.arrayContaining(['dsa']));
  });
  test('produces a bounded quality score', () => {
    const q = qualityScore(SAMPLE);
    expect(q.overall).toBeGreaterThanOrEqual(0);
    expect(q.overall).toBeLessThanOrEqual(100);
  });
  test('analyze returns aiGenerated flag', () => {
    expect(analyze(SAMPLE).aiGenerated).toBe(true);
  });
});

describe('interview question extraction', () => {
  test('splits compound asks into separate questions', () => {
    const qs = extractQuestions('Round 2: reverse a linked list and explain REST APIs.');
    const texts = qs.map((q) => q.question.toLowerCase());
    expect(qs.length).toBeGreaterThanOrEqual(2);
    expect(texts.some((t) => t.includes('reverse'))).toBe(true);
    expect(texts.some((t) => t.includes('rest'))).toBe(true);
  });
});

describe('moderation', () => {
  test('flags personal information (phone number)', () => {
    const r = moderate('Contact me at 9876543210 for details');
    expect(r.hasPII).toBe(true);
    expect(r.flagged).toBe(true);
  });
  test('clean text is not flagged', () => {
    expect(moderate('I studied DSA and got placed.').flagged).toBe(false);
  });
});

describe('vector similarity', () => {
  test('similar text has higher cosine than unrelated text', () => {
    const a = embed('graph and tree data structure interview');
    const b = embed('binary tree and graph traversal questions');
    const c = embed('hr behavioral tell me about yourself');
    expect(cosine(a, b)).toBeGreaterThan(cosine(a, c));
  });
});
