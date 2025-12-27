import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import SnackPage from "./pages/SnackPage";
import SnackDetails from "./pages/SnackDetails";
import MealPage from "./pages/MealPage";
import AboutPage from "./pages/AboutPage";
import PricingPage from "./pages/PricingPage";

// Components
import ProtectedRoute from "./components/ProtectedRoute";

// Admin Pages
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import AdminRecipeList from "./pages/admin/AdminRecipeList";
import RecipeEditor from "./pages/admin/RecipeEditor";
import NewsletterTool from "./pages/admin/NewsletterTool";

// Layouts
import MainLayout from "./layouts/MainLayout";

function App() {
  return (
    <Routes>
      {/* Public Zone */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<MainLayout><AboutPage /></MainLayout>} />
      <Route path="/login" element={<LoginPage />} />

      {/* Public App Zone (Accessible by all, content might be locked) */}
      <Route path="/app/*" element={
        <MainLayout>
          <Routes>
            <Route path="home" element={<HomePage />} />
            <Route path="snack" element={<SnackPage />} />
            <Route path="meal/:mealId" element={<MealPage />} />
            <Route path="snack/:snackId" element={<SnackDetails />} />
            <Route path="subscribe" element={<PricingPage />} />
            <Route path="*" element={<Navigate to="home" replace />} />
          </Routes>
        </MainLayout>
      } />

      {/* Admin Zone (Restricted) */}
      <Route element={<ProtectedRoute requireAdmin={true} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="recipes" element={<AdminRecipeList />} />
          <Route path="recipes/new" element={<RecipeEditor />} />
          <Route path="recipes/edit/:id" element={<RecipeEditor />} />
          <Route path="newsletter" element={<NewsletterTool />} />
          <Route path="media" element={<div>Media Library (TODO)</div>} />
        </Route>
      </Route>

      {/* Legacy Redirects (handle old bookmarks) */}
      <Route path="/home" element={<Navigate to="/app/home" replace />} />
      <Route path="/snack" element={<Navigate to="/app/snack" replace />} />
    </Routes>
  );
}

export default App;