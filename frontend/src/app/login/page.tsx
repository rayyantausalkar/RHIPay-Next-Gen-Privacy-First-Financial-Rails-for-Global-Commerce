import React from "react";
import { Metadata } from "next";
import { AuthPageLayout } from "@/components/auth/AuthPageLayout";

export const metadata: Metadata = {
  title: "Sign In — RHI Pay Nexus",
  description: "Access your RHI Pay Nexus cross-border account with zero-knowledge cryptographic privacy.",
};

export default function LoginPage() {
  return <AuthPageLayout initialMode="login" />;
}
