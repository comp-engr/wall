import { ProfileSidebar } from "@/components/ProfileSidebar";
import { Wall } from "@/components/Wall";

// Shared page width so the top bar, content, and footer line up.
const CONTAINER = "mx-auto w-full max-w-6xl px-4";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-[#3b5998]">
        <div className={`${CONTAINER} flex h-10 items-center`}>
          <span className="text-xl font-bold tracking-tight text-white">wall</span>
        </div>
      </header>

      <main className={`${CONTAINER} grid flex-1 content-start gap-6 py-5 md:grid-cols-4`}>
        <div className="md:col-span-1">
          <ProfileSidebar />
        </div>
        <div className="min-w-0 md:col-span-3">
          <Wall />
        </div>
      </main>

      <footer className="border-t border-gray-200">
        <p className={`${CONTAINER} py-4 text-center text-xs text-gray-500`}>
          Built with React 19, Next.js 15, Supabase, Tailwind CSS, and shadcn/ui
        </p>
      </footer>
    </div>
  );
}
