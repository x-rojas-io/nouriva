import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SnackPage from "./pages/SnackPage";
import SnackDetails from "./pages/SnackDetails";
import MealPage from "./pages/MealPage";
import AboutPage from "./pages/AboutPage";
import MainLayout from "./layouts/MainLayout";

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<AboutPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/snack" element={<SnackPage />} />
        <Route path="/meal/:mealId" element={<MealPage />} />
        <Route path="/snack/:snackId" element={<SnackDetails />} />
      </Routes>
    </MainLayout>
  );
}

export default App;