import { redirect } from 'next/navigation';

export default function Page() {
  console.log("❌ OLD DASHBOARD REDIRECTING");
  redirect('/teacher/dashboard');
}
