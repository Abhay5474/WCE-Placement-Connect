import { useQuery } from '@tanstack/react-query';
import { api } from './api.js';

/* Thin query hooks over the API envelope. Each returns { data, meta } via select. */
const get = (url, params) => api.get(url, { params }).then((r) => r.data);

export const useBlogs = (params) =>
  useQuery({ queryKey: ['blogs', params], queryFn: () => get('/blogs', params) });

export const usePlacementHub = () =>
  useQuery({ queryKey: ['hub'], queryFn: () => get('/placement/hub') });

export const useCompanies = (params) =>
  useQuery({ queryKey: ['companies', params], queryFn: () => get('/companies', params) });

export const useCompany = (slug) =>
  useQuery({ queryKey: ['company', slug], queryFn: () => get(`/companies/${slug}`), enabled: !!slug });

export const useInterviewQuestions = (params) =>
  useQuery({ queryKey: ['iq', params], queryFn: () => get('/interview-questions', params) });

export const useBlog = (slug) =>
  useQuery({ queryKey: ['blog', slug], queryFn: () => get(`/blogs/${slug}`), enabled: !!slug });

export const useDashboard = () =>
  useQuery({ queryKey: ['dashboard'], queryFn: () => get('/placement/dashboard') });

export const useNotifications = (options = {}) =>
  useQuery({
    queryKey: ['notifications'],
    queryFn: () => get('/notifications'),
    refetchInterval: 60000, // gentle poll so the badge stays fresh
    ...options,
  });
