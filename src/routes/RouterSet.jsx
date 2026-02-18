import { Navigate, Route, Routes } from "react-router-dom";
import SignUpEmail from "../pages/SinUp/Step/SignUpEmail";
import MakeItYours from "../pages/SinUp/Step/MakeItYours";
import Login from "../pages/Signin/Signin";
import SignUp from "../pages/SinUp/SinUp";
import EmailVerify from "../pages/SinUp/Step/EmailVerify";
import AuthLayout from "../pages/SinUp/layout";
import Main from "../pages/Dashboard/main";
import MainLayout from "../pages/mainLayout/mainLayout";

export default function RouterSet() {
  return (
    <Routes>
      {/* Sign-in route is separate from MainLayout */}
      <Route path="/" element={<Navigate to="/sign-up" />} />

      <Route path="/sign-up/*" element={<SignUp />}>
        <Route path="" element={<SignUpEmail />} />
        <Route path="verify-email" element={<EmailVerify />} />
        <Route path="make-it-yours" element={<MakeItYours />} />
      </Route>

      <Route path="/sign-in" element={<AuthLayout />}>
        <Route path="" element={<Login />} />
      </Route>

      <Route path="/" element={<MainLayout />}>
        <Route path="main" element={<Main />} />
      </Route>


    </Routes>
  );
}
