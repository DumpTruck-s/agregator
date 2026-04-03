import { redirect } from 'next/navigation';

// Root redirects to login; middleware handles role routing after login
export default function Home() {
  redirect('/login');
}
