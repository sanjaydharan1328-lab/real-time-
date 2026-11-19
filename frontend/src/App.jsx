import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import AppLayout from "./components/AppLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import DfaSimulator from "./pages/DfaSimulator.jsx";
import Editor from "./pages/Editor.jsx";
import History from "./pages/History.jsx";
import NetworkMonitor from "./pages/NetworkMonitor.jsx";
import Profile from "./pages/Profile.jsx";
import "./styles.css";

export default function App() {
  return <BrowserRouter><AuthProvider><Routes>
    <Route path="/login" element={<AuthPage mode="login"/>}/>
    <Route path="/register" element={<AuthPage mode="register"/>}/>
    <Route element={<ProtectedRoute/>}>
      <Route element={<AppLayout/>}>
        <Route index element={<Dashboard/>}/>
        <Route path="documents/:id" element={<Editor/>}/>
        <Route path="documents/:id/history" element={<History/>}/>
        <Route path="dfa" element={<DfaSimulator/>}/>
        <Route path="network" element={<NetworkMonitor/>}/>
        <Route path="profile" element={<Profile/>}/>
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></AuthProvider></BrowserRouter>;
}
