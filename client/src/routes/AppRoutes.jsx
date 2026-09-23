import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import RootLayout from '../layouts/RootLayout';

// Lazy-Loaded Public Pages
const HomePage = lazy(() => import('../pages/public/HomePage'));
const LoginPage = lazy(() => import('../pages/public/LoginPage'));
const RegisterPage = lazy(() => import('../pages/public/RegisterPage'));
const OpportunitiesPage = lazy(() => import('../pages/public/OpportunitiesPage'));
const OpportunityDetailPage = lazy(() => import('../pages/public/OpportunityDetailPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

// Lazy-Loaded Student Pages
const StudentDashboardPage = lazy(() => import('../pages/student/StudentDashboardPage'));
const StudentProfilePage = lazy(() => import('../pages/student/StudentProfilePage'));
const MyApplicationsPage = lazy(() => import('../pages/student/MyApplicationsPage'));
const ApplicationDetailsPage = lazy(() => import('../pages/student/ApplicationDetailsPage'));

// Lazy-Loaded Recruiter Pages
const RecruiterDashboardPage = lazy(() => import('../pages/recruiter/RecruiterDashboardPage'));
const ManageOpportunitiesPage = lazy(() => import('../pages/recruiter/ManageOpportunitiesPage'));
const CreateOpportunityPage = lazy(() => import('../pages/recruiter/CreateOpportunityPage'));
const EditOpportunityPage = lazy(() => import('../pages/recruiter/EditOpportunityPage'));
const ApplicantsPage = lazy(() => import('../pages/recruiter/ApplicantsPage'));

import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';


const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        {/* Public Browsing Routes */}
        <Route index element={<HomePage />} />
        <Route path="opportunities" element={<OpportunitiesPage />} />
        <Route path="opportunities/:id" element={<OpportunityDetailPage />} />

        {/* Public-Only Guest Routes (Redirect authenticated users) */}
        <Route element={<PublicRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        {/* Protected Student Routes */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="student/dashboard" element={<StudentDashboardPage />} />
          <Route path="student/applications" element={<MyApplicationsPage />} />
          <Route path="student/applications/:id" element={<ApplicationDetailsPage />} />
        </Route>

        {/* Protected Recruiter-Only Dashboard (Phase 7 Correction: Recruiter only, no admin) */}
        <Route element={<ProtectedRoute allowedRoles={['recruiter']} />}>
          <Route path="recruiter/dashboard" element={<RecruiterDashboardPage />} />
        </Route>

        {/* Protected Recruiter / Admin Management Routes */}
        <Route element={<ProtectedRoute allowedRoles={['recruiter', 'admin']} />}>
          <Route path="recruiter/opportunities" element={<ManageOpportunitiesPage />} />
          <Route path="recruiter/opportunities/create" element={<CreateOpportunityPage />} />
          <Route path="recruiter/opportunities/new" element={<CreateOpportunityPage />} />
          <Route path="recruiter/opportunities/:id/edit" element={<EditOpportunityPage />} />
          <Route path="recruiter/opportunities/:id/applicants" element={<ApplicantsPage />} />
        </Route>

        {/* Shared Authenticated Routes */}
        <Route element={<ProtectedRoute allowedRoles={['student', 'recruiter', 'admin']} />}>
          <Route path="student/profile" element={<StudentProfilePage />} />
          <Route path="profile" element={<StudentProfilePage />} />
        </Route>

        {/* 404 Catch-All Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
