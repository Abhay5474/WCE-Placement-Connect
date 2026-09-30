import crypto from 'crypto';
import { AIAnalysis } from '../models/AIAnalysis.js';
import { InterviewQuestion } from '../models/InterviewQuestion.js';
import { embedText, providerName } from './ai/providers/index.js';
import { analyze } from './ai/writingAssistant.js';
import { summarize, quickSummary } from './ai/summarizer.js';
import { moderate } from './ai/moderation.js';
import { extractInterviewQuestions } from './ai/interviewExtractor.js';
import { logger } from '../utils/logger.js';

const hash = (s) => crypto.createHash('sha256').update(String(s || '')).digest('hex');

/* Convert authored HTML to clean plain text so AI (summary, tags, embeddings)
   works on words, not markup. */
function htmlToText(html) {
  return String(html || '')
    .replace(/<\/(p|div|h[1-6]|li|br)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/* Runs the full AI pipeline for a blog and caches the result. Skips work when the
   content hash is unchanged (AI cost control). Called asynchronously after a blog
   is created/updated/published so requests are not blocked by AI latency. */
export async function processBlogAI(blog, { force = false } = {}) {
  try {
    const plain = htmlToText(blog.content);
    const text = `${blog.title}\n\n${plain}`;
    const contentHash = hash(text);
    const existing = await AIAnalysis.findOne({ blog: blog._id });
    if (existing && existing.contentHash === contentHash && !force) return existing;

    const wa = analyze(text);
    const { summary } = await summarize(text);
    const { embedding, model } = await embedText(text);
    const mod = moderate(text);

    // Extract + reconcile interview questions (LLM-based, from clean plain text).
    const questions = await extractInterviewQuestions(plain);
    await reconcileQuestions(blog, questions);

    const doc = await AIAnalysis.findOneAndUpdate(
      { blog: blog._id },
      {
        blog: blog._id,
        contentHash,
        summary,
        quickSummary: quickSummary(blog, questions.map((q) => q.question), plain),
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

/* Reconciles this blog's extracted questions against the store: detaches the blog
   from any questions it no longer contains, (re)attaches/creates the current set
   with refreshed text, deletes questions left with no source, and recomputes
   frequency from real data. This is what keeps stale/garbled questions from
   lingering after an edit or an extractor change. */
async function reconcileQuestions(blog, questions) {
  const companyName = blog.placement?.companyName || '';

  // 1. Detach this blog from every question it currently sources.
  await InterviewQuestion.updateMany({ sourceBlogs: blog._id }, { $pull: { sourceBlogs: blog._id } });

  // 2. (Re)attach / create the freshly extracted questions.
  for (const q of questions) {
    const existing = await InterviewQuestion.findOne({ normalized: q.normalized, companyName });
    if (existing) {
      if (!existing.sourceBlogs.map(String).includes(String(blog._id))) existing.sourceBlogs.push(blog._id);
      existing.question = q.question; // refresh cleaned text
      existing.topic = q.topic;
      if (q.difficulty) existing.difficulty = q.difficulty;
      existing.company = blog.placement?.company;
      existing.role = blog.placement?.role || existing.role;
      existing.isDemo = blog.isDemo;
      await existing.save();
    } else {
      await InterviewQuestion.create({
        question: q.question,
        normalized: q.normalized,
        topic: q.topic,
        difficulty: q.difficulty || 'Medium',
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

  // 3. Remove orphans and recompute frequency for this company's questions.
  await InterviewQuestion.deleteMany({ sourceBlogs: { $size: 0 } });
  const affected = await InterviewQuestion.find({ companyName });
  await Promise.all(
    affected
      .filter((iq) => iq.frequency !== iq.sourceBlogs.length)
      .map((iq) => { iq.frequency = iq.sourceBlogs.length; return iq.save(); })
  );
}

/* Fire-and-forget wrapper. */
export function processBlogAIAsync(blog, opts) {
  setImmediate(() => processBlogAI(blog, opts));
}
