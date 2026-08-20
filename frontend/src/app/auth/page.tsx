import React from "react";
import { Metadata } from "next";
import { AuthPageLayout } from "@/components/auth/AuthPageLayout";

export const metadata: Metadata = {
  title: "Authentication — RHI Pay Nexus",
  description: "Secure Zero-Knowledge Authentication for RHI Pay Nexus.",
};

export default function AuthPage() {
  return <AuthPageLayout initialMode="login" />;
}
