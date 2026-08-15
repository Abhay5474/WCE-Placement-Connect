import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Home from './pages/Home.jsx';
import PlacementHub from './pages/PlacementHub.jsx';
import Explore from './pages/Explore.jsx';
import Companies from './pages/Companies.jsx';
import CompanyDetail from './pages/CompanyDetail.jsx';
import InterviewQuestions from './pages/InterviewQuestions.jsx';
import SearchPage from './pages/SearchPage.jsx';
import BlogDetail from './pages/BlogDetail.jsx';
import AuthorProfile from './pages/AuthorProfile.jsx';
import Assistant from './pages/Assistant.jsx';

import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import VerifyEmail from './pages/auth/VerifyEmail.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx';

import Dashboard from './pages/Dashboard.jsx';
import CreateBlog from './pages/CreateBlog.jsx';
import Drafts from './pages/Drafts.jsx';
import Saved from './pages/Saved.jsx';
import Notifications from './pages/Notifications.jsx';
import MyAnalytics from './pages/MyAnalytics.jsx';
import PlacementProfile from './pages/PlacementProfile.jsx';
import Admin from './pages/admin/Admin.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public */}
        <Route index element={<Home />} />
        <Route path="placement" element={<PlacementHub />} />
        <Route path="explore" element={<Explore />} />
        <Route path="companies" element={<Companies />} />
        <Route path="companies/:slug" element={<CompanyDetail />} />
        <Route path="interview-questions" element={<InterviewQuestions />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="blog/:slug" element={<BlogDetail />} />
        <Route path="author/:id" element={<AuthorProfile />} />
        <Route path="assistant" element={<Assistant />} />

        {/* Auth */}
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="verify-email" element={<VerifyEmail />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />

        {/* Authenticated */}
        <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="create" element={<ProtectedRoute><CreateBlog /></ProtectedRoute>} />
        <Route path="edit/:id" element={<ProtectedRoute><CreateBlog /></ProtectedRoute>} />
        <Route path="drafts" element={<ProtectedRoute><Drafts /></ProtectedRoute>} />
        <Route path="saved" element={<ProtectedRoute><Saved /></ProtectedRoute>} />
        <Route path="notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="analytics" element={<ProtectedRoute><MyAnalytics /></ProtectedRoute>} />
        <Route path="placement/profile" element={<ProtectedRoute><PlacementProfile /></ProtectedRoute>} />

        {/* Admin / Coordinator */}
        <Route path="admin/*" element={<ProtectedRoute roles={['admin', 'coordinator', 'faculty']}><Admin /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
