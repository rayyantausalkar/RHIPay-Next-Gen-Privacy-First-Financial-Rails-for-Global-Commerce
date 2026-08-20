import React from "react";
import { Metadata } from "next";
import { AuthPageLayout } from "@/components/auth/AuthPageLayout";

export const metadata: Metadata = {
  title: "Create Account — RHI Pay Nexus",
  description: "Register for instant cross-border settlement with ZKP privacy and ISO 20022 messaging.",
};

export default function SignupPage() {
  return <AuthPageLayout initialMode="signup" />;
}
