import React from "react";
import { AuthPage } from "./AuthPage";

export const LoginPage: React.FC<{ onSuccess?: () => void; onClose?: () => void }> = ({
  onSuccess,
  onClose,
}) => {
  return <AuthPage initialMode="login" onSuccess={onSuccess} onClose={onClose} />;
};

export default LoginPage;
