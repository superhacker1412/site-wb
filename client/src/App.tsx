import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import AosProvider from "@/components/AosProvider";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import Landing from "@/pages/Landing";
import AboutPage from "@/pages/AboutPage";
import Materials from "@/pages/Materials";
import MaterialDetail from "@/pages/MaterialDetail";
import Quiz from "@/pages/Quiz";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Cabinet from "@/pages/Cabinet";
import AdminUserEdit from "@/pages/admin/AdminUserEdit";
import AdminUserProfile from "@/pages/admin/AdminUserProfile";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminInsightsPage from "@/pages/admin/AdminInsightsPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminUserCreate from "@/pages/admin/AdminUserCreate";
import AdminCategoriesPage from "@/pages/admin/AdminCategoriesPage";
import AdminCategoryFormPage from "@/pages/admin/AdminCategoryFormPage";
import AdminMaterialsPage from "@/pages/admin/AdminMaterialsPage";
import AdminMaterialFormPage from "@/pages/admin/AdminMaterialFormPage";
import AdminDirectionsPage from "@/pages/admin/AdminDirectionsPage";
import AdminDirectionFormPage from "@/pages/admin/AdminDirectionFormPage";
import AdminQuestionsPage from "@/pages/admin/AdminQuestionsPage";
import AdminQuestionFormPage from "@/pages/admin/AdminQuestionFormPage";
import AdminAuditPage from "@/pages/admin/AdminAuditPage";
import AdminFeedbackPage from "@/pages/admin/AdminFeedbackPage";
import AdminSiteSettingsPage from "@/pages/admin/AdminSiteSettingsPage";
import AdminFooterSettingsPage from "@/pages/admin/AdminFooterSettingsPage";
import AdminRegionsPage from "@/pages/admin/AdminRegionsPage";
import AdminRegionFormPage from "@/pages/admin/AdminRegionFormPage";
import AdminCitiesPage from "@/pages/admin/AdminCitiesPage";
import AdminCityFormPage from "@/pages/admin/AdminCityFormPage";
import AdminDistrictsPage from "@/pages/admin/AdminDistrictsPage";
import AdminDistrictFormPage from "@/pages/admin/AdminDistrictFormPage";
import AdminSchoolsPage from "@/pages/admin/AdminSchoolsPage";
import AdminSchoolFormPage from "@/pages/admin/AdminSchoolFormPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AosProvider />
          <Header />
          <main className="min-h-[calc(100vh-4rem)]">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/o-nas" element={<AboutPage />} />
              <Route path="/o-sebe" element={<AboutPage />} />
              <Route path="/materiallar" element={<Materials />} />
              <Route path="/materiallar/:id" element={<MaterialDetail />} />

              {/* ✅ список тестов */}
              <Route
                path="/test"
                element={
                  <ProtectedRoute>
                    <Quiz />
                  </ProtectedRoute>
                }
              />

              {/* ✅ NEW: открытие теста по ID */}
              <Route
                path="/test/:id"
                element={
                  <ProtectedRoute>
                    <Quiz />
                  </ProtectedRoute>
                }
              />

              <Route path="/kirish" element={<Login />} />
              <Route path="/royxat" element={<Register />} />
              <Route
                path="/kabinet"
                element={
                  <ProtectedRoute>
                    <Cabinet />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="insights" element={<AdminInsightsPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="users/new" element={<AdminUserCreate />} />
                <Route path="users/:id/edit" element={<AdminUserEdit />} />
                <Route path="users/:id/profile" element={<AdminUserProfile />} />
                <Route path="categories" element={<AdminCategoriesPage />} />
                <Route path="categories/new" element={<AdminCategoryFormPage />} />
                <Route path="categories/:id/edit" element={<AdminCategoryFormPage />} />
                <Route path="materials" element={<AdminMaterialsPage />} />
                <Route path="materials/new" element={<AdminMaterialFormPage />} />
                <Route path="materials/:id/edit" element={<AdminMaterialFormPage />} />
                <Route path="directions" element={<AdminDirectionsPage />} />
                <Route path="directions/new" element={<AdminDirectionFormPage />} />
                <Route path="directions/:id/edit" element={<AdminDirectionFormPage />} />
                <Route path="questions" element={<AdminQuestionsPage />} />
                <Route path="questions/new" element={<AdminQuestionFormPage />} />
                <Route path="questions/:id/edit" element={<AdminQuestionFormPage />} />
                <Route path="feedback" element={<AdminFeedbackPage />} />
                <Route path="site/about" element={<AdminSiteSettingsPage />} />
                <Route path="site/footer" element={<AdminFooterSettingsPage />} />
                <Route path="regions" element={<AdminRegionsPage />} />
                <Route path="regions/new" element={<AdminRegionFormPage />} />
                <Route path="regions/:id/edit" element={<AdminRegionFormPage />} />
                <Route path="cities" element={<AdminCitiesPage />} />
                <Route path="cities/new" element={<AdminCityFormPage />} />
                <Route path="cities/:id/edit" element={<AdminCityFormPage />} />
                <Route path="districts" element={<AdminDistrictsPage />} />
                <Route path="districts/new" element={<AdminDistrictFormPage />} />
                <Route path="districts/:id/edit" element={<AdminDistrictFormPage />} />
                <Route path="schools" element={<AdminSchoolsPage />} />
                <Route path="schools/new" element={<AdminSchoolFormPage />} />
                <Route path="schools/:id/edit" element={<AdminSchoolFormPage />} />
                <Route path="audit" element={<AdminAuditPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <SiteFooter />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
