import React from "react";
import { AuthPage } from "./AuthPage";

export const RegisterPage: React.FC<{ onSuccess?: () => void; onClose?: () => void }> = ({
  onSuccess,
  onClose,
}) => {
  return <AuthPage initialMode="register" onSuccess={onSuccess} onClose={onClose} />;
};

export default RegisterPage;
