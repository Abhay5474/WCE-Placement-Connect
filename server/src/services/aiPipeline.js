import crypto from 'crypto';
import { AIAnalysis } from '../models/AIAnalysis.js';
import { InterviewQuestion } from '../models/InterviewQuestion.js';
import { embedText, providerName } from './ai/providers/index.js';
import { analyze } from './ai/writingAssistant.js';
import { summarize, quickSummary } from './ai/summarizer.js';
import { moderate } from './ai/moderation.js';
import { extractQuestions } from './ai/interviewAnalyzer.js';
import { logger } from '../utils/logger.js';

const hash = (s) => crypto.createHash('sha256').update(String(s || '')).digest('hex');

/* Runs the full AI pipeline for a blog and caches the result. Skips work when the
   content hash is unchanged (AI cost control). Called asynchronously after a blog
   is created/updated/published so requests are not blocked by AI latency. */
export async function processBlogAI(blog, { force = false } = {}) {
  try {
    const text = `${blog.title}\n\n${blog.content}`;
    const contentHash = hash(text);
    const existing = await AIAnalysis.findOne({ blog: blog._id });
    if (existing && existing.contentHash === contentHash && !force) return existing;

    const wa = analyze(text);
    const { summary } = await summarize(text);
    const { embedding, model } = await embedText(text);
    const mod = moderate(text);

    // Extract + upsert interview questions (frequency counted from stored data).
    const questions = extractQuestions(blog.content);
    await upsertQuestions(blog, questions);

    const doc = await AIAnalysis.findOneAndUpdate(
      { blog: blog._id },
      {
        blog: blog._id,
        contentHash,
        summary,
        quickSummary: quickSummary(blog, questions.map((q) => q.question)),
        suggestedTags: wa.tags,
        suggestedTitles: wa.titles,
        suggestedCategories: wa.suggestedCategories,
        qualityScore: wa.quality,
        tone: wa.tone,
        keywords: wa.keywords,
        moderation: mod,
        embedding,
        embeddingModel: model,
        provider: providerName,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return doc;
  } catch (err) {
    logger.error(`AI pipeline failed for blog ${blog._id}: ${err.message}`);
    return null;
  }
}

async function upsertQuestions(blog, questions) {
  const companyName = blog.placement?.companyName || '';
  for (const q of questions) {
    const existing = await InterviewQuestion.findOne({ normalized: q.normalized, companyName });
    if (existing) {
      if (!existing.sourceBlogs.map(String).includes(String(blog._id))) {
        existing.sourceBlogs.push(blog._id);
        existing.frequency = existing.sourceBlogs.length; // frequency from real data only
        await existing.save();
      }
    } else {
      await InterviewQuestion.create({
        question: q.question,
        normalized: q.normalized,
        topic: q.topic,
        companyName,
        company: blog.placement?.company,
        role: blog.placement?.role || '',
        sourceBlog: blog._id,
        sourceBlogs: [blog._id],
        frequency: 1,
        extractedByAI: true,
        isDemo: blog.isDemo,
      });
    }
  }
}

/* Fire-and-forget wrapper. */
export function processBlogAIAsync(blog, opts) {
  setImmediate(() => processBlogAI(blog, opts));
}
