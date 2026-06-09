import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ApprovalPage from "@/pages/ApprovalPage";
import ReportsPage from "@/pages/ReportsPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/approval" element={<ApprovalPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
