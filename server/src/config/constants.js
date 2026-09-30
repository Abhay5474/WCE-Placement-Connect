export const ROLES = Object.freeze({
  STUDENT: 'student',
  FACULTY: 'faculty',
  COORDINATOR: 'coordinator', // Placement Coordinator
  ADMIN: 'admin',
});

export const ALL_ROLES = Object.values(ROLES);

// Trust / verification levels shown on content.
export const TRUST_LEVELS = Object.freeze({
  STUDENT_SUBMITTED: 'student_submitted',
  VERIFIED: 'verified', // verified by faculty/coordinator
  OFFICIAL: 'official', // published by placement cell/admin
});

export const BLOG_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
});

// AI + user-correctable classification categories.
export const CATEGORIES = Object.freeze([
  'Placement Experience',
  'Internship Experience',
  'Interview Questions',
  'Resume Guidance',
  'DSA',
  'System Design',
  'Aptitude',
  'HR Interview',
  'Technical Interview',
  'Career Guidance',
  'Company Preparation',
  'Off-Campus',
  'On-Campus',
]);

export const PLACEMENT_TYPES = Object.freeze(['Internship', 'Full Time', 'PPO']);
export const DIFFICULTY = Object.freeze(['Easy', 'Medium', 'Hard']);
export const RESULTS = Object.freeze(['Selected', 'Rejected', 'In Process', 'Not Disclosed']);

export const REPORT_STATUS = Object.freeze({
  OPEN: 'open',
  REVIEWING: 'reviewing',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
});

export const NOTIFICATION_TYPES = Object.freeze({
  NEW_FOLLOWER: 'new_follower',
  BLOG_PUBLISHED: 'blog_published',
  RECOMMENDED_BLOG: 'recommended_blog',
  COMMENT: 'comment',
  REPLY: 'reply',
  BLOG_VERIFIED: 'blog_verified',
  ADMIN_ANNOUNCEMENT: 'admin_announcement',
  PLACEMENT_ANNOUNCEMENT: 'placement_announcement',
  ACCESS_REQUEST: 'access_request', // student requests contributor access → admins
});
