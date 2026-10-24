import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "../../lib/auth/admin-auth";
import { AdminDashboardView } from "../../components/admin/AdminDashboardView";

export const metadata: Metadata = {
  title: "Administrative Dashboard | HackMitra",
  description: "Secure moderation and event review console for HackMitra Karnataka.",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!token) {
    redirect("/admin/login");
  }

  const verifiedUser = verifyAdminToken(token);

  if (!verifiedUser) {
    redirect("/admin/login");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <AdminDashboardView currentUser={verifiedUser} />
    </div>
  );
}
