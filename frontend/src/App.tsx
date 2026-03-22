import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import AppLayout from "./layouts/AppLayout";
import LandingPage from "./pages/LandingPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import EventsPage from "./pages/EventsPage";
import NewEventPage from "./pages/NewEventPage";
import EventDetailPage from "./pages/EventDetailPage";
import EventBudgetPage from "./pages/EventBudgetPage";
import BudgetPage from "./pages/BudgetPage";
import FeatureRequestPage from "./pages/FeatureRequestPage";

function AppShell({ children }: { children: ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />

      <Route
        path="/events"
        element={
          <AppShell>
            <EventsPage />
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
          <AppShell>
            <EventDetailPage />
          </AppShell>
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
        path="/budget"
        element={
          <AppShell>
            <BudgetPage />
          </AppShell>
        }
      />
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
