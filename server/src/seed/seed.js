/* Seed script — creates DEMO/SAMPLE data for development.
   IMPORTANT: every record is flagged isDemo:true and experiences are clearly
   labeled as sample content, NOT real student experiences. Run: npm run seed */
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { Blog } from '../models/Blog.js';
import { env } from '../config/env.js';
import { uniqueSlug } from '../utils/slug.js';
import { processBlogAI } from '../services/aiPipeline.js';
import { ROLES, BLOG_STATUS, TRUST_LEVELS } from '../config/constants.js';
import { logger } from '../utils/logger.js';

const COMPANIES = [
  { name: 'Microsoft', industry: 'Product', difficulty: 'Hard', roles: ['SDE', 'SDE Intern'], requiredSkills: ['DSA', 'System Design', 'OOP'] },
  { name: 'Amazon', industry: 'Product', difficulty: 'Hard', roles: ['SDE'], requiredSkills: ['DSA', 'Leadership Principles'] },
  { name: 'Google', industry: 'Product', difficulty: 'Hard', roles: ['SWE'], requiredSkills: ['DSA', 'System Design'] },
  { name: 'TCS', industry: 'Service', difficulty: 'Easy', roles: ['Systems Engineer', 'Digital'], requiredSkills: ['Aptitude', 'DBMS', 'Coding'] },
  { name: 'Infosys', industry: 'Service', difficulty: 'Easy', roles: ['Systems Engineer'], requiredSkills: ['Aptitude', 'Communication'] },
  { name: 'Accenture', industry: 'Consulting', difficulty: 'Medium', roles: ['ASE'], requiredSkills: ['Cognitive', 'Coding'] },
  { name: 'Deloitte', industry: 'Consulting', difficulty: 'Medium', roles: ['Analyst'], requiredSkills: ['Aptitude', 'HR'] },
  { name: 'Cognizant', industry: 'Service', difficulty: 'Easy', roles: ['GenC'], requiredSkills: ['Aptitude', 'SQL'] },
  { name: 'Capgemini', industry: 'Service', difficulty: 'Easy', roles: ['Analyst'], requiredSkills: ['Pseudocode', 'English'] },
  { name: 'Persistent', industry: 'Product', difficulty: 'Medium', roles: ['Software Engineer'], requiredSkills: ['DSA', 'DBMS'] },
];

const SAMPLE_CONTENT = (company, role) => `
<p><em>[DEMO / SAMPLE CONTENT — not a real student experience]</em></p>
<h2>Company</h2><p>${company}</p>
<h2>Job Role</h2><p>${role}</p>
<h2>Selection Process</h2>
<h3>Round 1 — Online Assessment</h3><p>The first round consisted of DSA questions on arrays and strings, plus aptitude.</p>
<h3>Round 2 — Technical Interview</h3><p>They asked me to reverse a linked list and explain REST APIs. Also discussed DBMS normalization.</p>
<h3>Round 3 — HR Interview</h3><p>Tell me about yourself and why ${company}. Behavioral questions on teamwork.</p>
<h2>Questions Asked</h2><p>Reverse a linked list. Explain indexing in SQL. Design a URL shortener.</p>
<h2>Preparation Strategy</h2><p>Practiced DSA on LeetCode for 8 weeks and revised core CS subjects.</p>
<h2>Advice for Juniors</h2><p>Start early, be consistent with DSA, and prepare your projects well.</p>
`;

async function run() {
  await connectDB();
  logger.warn('Seeding DEMO data — existing demo records will be reset.');

  await Promise.all([
    User.deleteMany({ isDemo: true }),
    Company.deleteMany({ isDemo: true }),
    Blog.deleteMany({ isDemo: true }),
  ]);

  const domain = env.collegeEmailDomain;
  const mk = async (name, email, role) => {
    const u = new User({ name, email: `${email}@${domain}`, role, isEmailVerified: true, isDemo: true, department: 'CSE', year: 4, graduationYear: 2026 });
    await u.setPassword('Password123');
    return u.save();
  };

  const [admin, coordinator, student] = await Promise.all([
    mk('Demo Admin', 'demo.admin', ROLES.ADMIN),
    mk('Demo Coordinator', 'demo.coordinator', ROLES.COORDINATOR),
    mk('Demo Student', 'demo.student', ROLES.STUDENT),
  ]);

  const companies = await Company.insertMany(
    COMPANIES.map((c) => ({ ...c, slug: uniqueSlug(c.name), placementType: ['On Campus'], verifiedInformation: true, isDemo: true, createdBy: coordinator._id }))
  );

  for (const c of companies.slice(0, 6)) {
    const role = c.roles[0];
    const blog = await Blog.create({
      title: `${c.name} ${role} Interview Experience (Sample)`,
      slug: uniqueSlug(`${c.name}-${role}-experience`),
      content: SAMPLE_CONTENT(c.name, role),
      excerpt: `[DEMO] Sample ${c.name} ${role} placement experience for development.`,
      author: student._id,
      status: BLOG_STATUS.PUBLISHED,
      type: 'placement',
      categories: ['Placement Experience', 'Technical Interview'],
      tags: [c.name, role, 'DSA', 'Placement Experience'],
      trustLevel: TRUST_LEVELS.VERIFIED,
      verifiedBy: coordinator._id,
      verifiedAt: new Date(),
      publishedAt: new Date(),
      isDemo: true,
      placement: {
        company: c._id, companyName: c.name, role, placementType: 'On Campus',
        year: 2026, department: 'CSE', difficulty: c.difficulty,
        skills: c.requiredSkills, preparationDuration: '8 weeks', result: 'Selected',
        rounds: [{ name: 'Online Assessment' }, { name: 'Technical Interview' }, { name: 'HR Interview' }],
      },
    });
    await processBlogAI(blog, { force: true }); // generates embeddings + extracts questions
  }

  logger.info('Seed complete. Demo logins (password: Password123):');
  logger.info(`  Admin:       demo.admin@${domain}`);
  logger.info(`  Coordinator: demo.coordinator@${domain}`);
  logger.info(`  Student:     demo.student@${domain}`);

  await disconnectDB();
  process.exit(0);
}

run().catch((e) => {
  logger.error(e);
  process.exit(1);
});
