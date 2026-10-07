import React from "react";
import { useAuth } from "../../context/AuthContext";
import { AuthPage } from "./AuthPage";

export const AuthModal: React.FC = () => {
  const { authView, closeAuth } = useAuth();

  if (authView === "none") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={closeAuth}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md animate-in zoom-in-95 duration-200">
        <AuthPage
          initialMode={authView}
          isModal={true}
          onClose={closeAuth}
          onSuccess={closeAuth}
        />
      </div>
    </div>
  );
};
