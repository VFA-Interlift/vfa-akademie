import { redirect } from "next/navigation";

export default function AdminTrainingsRemoveRedirectPage() {
  redirect("/admin/trainings");
}