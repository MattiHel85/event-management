import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import AppLayout from "./layouts/AppLayout";
import PublicLayout from "./layouts/PublicLayout";
import LandingPage from "./pages/LandingPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import EventsPage from "./pages/EventsPage";
import MyEventsPage from "./pages/MyEventsPage";
import AdminEventsPage from "./pages/AdminEventsPage";
import NewEventPage from "./pages/NewEventPage";
import EventDetailPage from "./pages/EventDetailPage";
import EventBudgetPage from "./pages/EventBudgetPage";
import EventAttendeesPage from "./pages/EventAttendeesPage";
import AnnualBudgetPage from "./pages/AnnualBudgetPage";
import FeatureRequestPage from "./pages/FeatureRequestPage";
import DashboardPage from "./pages/DashboardPage";
import AdminOrganizationsPage from "./pages/AdminOrganizationsPage";
import OrganizationsPage from "./pages/OrganizationsPage";
import MyOrganizationsPage from "./pages/MyOrganizationsPage";
import ProfilePage from "./pages/ProfilePage";
import { useSession } from "./context/SessionContext";

function AppShell({ children }: { children: ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}

function SmartShell({ children }: { children: ReactNode }) {
  const { user, loading } = useSession();
  if (loading) return <div className="min-h-screen bg-[#f5f6fa]" />;
  if (user) return <AppLayout>{children}</AppLayout>;
  return <PublicLayout>{children}</PublicLayout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />

      <Route
        path="/dashboard"
        element={
          <AppShell>
            <DashboardPage />
          </AppShell>
        }
      />
      <Route
        path="/admin/organizations"
        element={
          <AppShell>
            <AdminOrganizationsPage />
          </AppShell>
        }
      />
      <Route
        path="/organizations"
        element={
          <AppShell>
            <OrganizationsPage />
          </AppShell>
        }
      />
      <Route
        path="/my-organizations"
        element={
          <AppShell>
            <MyOrganizationsPage />
          </AppShell>
        }
      />
      <Route
        path="/profile"
        element={
          <AppShell>
            <ProfilePage />
          </AppShell>
        }
      />
      <Route
        path="/events"
        element={
          <SmartShell>
            <EventsPage />
          </SmartShell>
        }
      />
      <Route
        path="/my-events"
        element={
          <AppShell>
            <MyEventsPage />
          </AppShell>
        }
      />
      <Route
        path="/admin-events"
        element={
          <AppShell>
            <AdminEventsPage />
          </AppShell>
        }
      />
      <Route
        path="/events/new"
        element={
          <AppShell>
            <NewEventPage />
          </AppShell>
        }
      />
      <Route
        path="/events/:id"
        element={
          <SmartShell>
            <EventDetailPage />
          </SmartShell>
        }
      />
      <Route
        path="/events/:id/budget"
        element={
          <AppShell>
            <EventBudgetPage />
          </AppShell>
        }
      />
      <Route
        path="/events/:id/attendees"
        element={
          <AppShell>
            <EventAttendeesPage />
          </AppShell>
        }
      />
      <Route
        path="/budgets"
        element={
          <AppShell>
            <AnnualBudgetPage />
          </AppShell>
        }
      />
      <Route path="/annual-budget" element={<Navigate to="/budgets" replace />} />
      <Route path="/budget" element={<Navigate to="/budgets" replace />} />
      <Route
        path="/feature-request"
        element={
          <AppShell>
            <FeatureRequestPage />
          </AppShell>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
