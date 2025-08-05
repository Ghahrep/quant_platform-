// src/pages/AuthPage.jsx
import React, { useState } from "react";
import LoginForm from "../components/auth/LoginForm";
import RegisterForm from "../components/auth/RegisterForm";

export const AuthPage = () => {
  const [isLoginView, setIsLoginView] = useState(true);

  const toggleView = () => setIsLoginView(!isLoginView);

  return (
    <div className="flex items-center justify-center h-full w-full py-12">
      {isLoginView ? (
        <LoginForm onSwitch={toggleView} />
      ) : (
        <RegisterForm onSwitch={toggleView} />
      )}
    </div>
  );
};

export default AuthPage;
