import { Navigate, type RouteObject } from "react-router-dom";
import LearnerLayout from "../layouts/LearnerLayout";
import AdminLayout from "../layouts/AdminLayout";
import LearnerLoginPage from "../features/auth/LearnerLoginPage";
import AdminLoginPage from "../features/auth/AdminLoginPage";
import ChatPage from "../features/chat/ChatPage";
import LessonsPage from "../features/lessons/LessonsPage";
import LessonWorkbenchPage from "../features/lessons/LessonWorkbenchPage";
import ProgressPage from "../features/progress/ProgressPage";
import VocabularyPage from "../features/vocabulary/VocabularyPage";
import AchievementsPage from "../features/achievements/AchievementsPage";
import ReportsPage from "../features/reports/ReportsPage";
import SettingsPage from "../features/settings/SettingsPage";
import AdminIndexRedirect from "../features/admin/AdminIndexRedirect";
import AdminContentUploadPage from "../features/admin/AdminContentUploadPage";
import AdminUsersPage from "../features/admin/AdminUsersPage";
import AdminLessonsPage from "../features/admin/AdminLessonsPage";
import AdminAnalyticsPage from "../features/admin/AdminAnalyticsPage";
import AdminSecurityPage from "../features/admin/AdminSecurityPage";
import AdminAccountsPage from "../features/admin/AdminAccountsPage";
import OnboardingPage from "../features/onboarding/OnboardingPage";
import ChoosePlanPage from "../features/subscription/ChoosePlanPage";
import AssessmentPage from "../features/assessment/AssessmentPage";
import InvoicesPage from "../features/invoices/InvoicesPage";
import ProfilePage from "../features/profile/ProfilePage";
import PronunciationPracticePage from "../features/pronunciation/PronunciationPracticePage";
import ProtectedRoute from "./ProtectedRoute";

export const routes: RouteObject[] = [
  { path: "/login", element: <LearnerLoginPage /> },
  { path: "/admin/login", element: <AdminLoginPage /> },

  {
    path: "/onboarding",
    element: (
      <ProtectedRoute>
        <OnboardingPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/choose-plan",
    element: (
      <ProtectedRoute>
        <ChoosePlanPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/assessment",
    element: (
      <ProtectedRoute>
        <AssessmentPage />
      </ProtectedRoute>
    ),
  },

  // The old dedicated full-screen voice page is gone - the hands-free
  // conversation now runs inline on the chat orb (ChatWindow.tsx), so
  // there's nothing to navigate away to. Kept as a redirect so any old
  // bookmark still lands somewhere sensible.
  { path: "/voice", element: <Navigate to="/" replace /> },

  {
    path: "/",
    element: (
      <ProtectedRoute>
        <LearnerLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <ChatPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "lessons", element: <LessonsPage /> },
      { path: "pronunciation", element: <PronunciationPracticePage /> },
      { path: "lessons/:lessonId", element: <LessonWorkbenchPage /> },
      { path: "progress", element: <ProgressPage /> },
      { path: "vocabulary", element: <VocabularyPage /> },
      { path: "achievements", element: <AchievementsPage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "billing", element: <InvoicesPage /> },
    ],
  },

  {
    path: "/admin",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminIndexRedirect /> },
      { path: "content", element: <AdminContentUploadPage /> },
      { path: "users", element: <AdminUsersPage /> },
      { path: "lessons", element: <AdminLessonsPage /> },
      { path: "analytics", element: <AdminAnalyticsPage /> },
      { path: "security", element: <AdminSecurityPage /> },
      { path: "accounts", element: <AdminAccountsPage /> },
    ],
  },
];
