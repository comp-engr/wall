import { ProfileSidebar } from "@/components/ProfileSidebar";
import { Wall } from "@/components/Wall";

export default function Home() {
  return (
    <>
      <header className="bg-[#3b5998]">
        <div className="mx-auto flex h-10 max-w-[980px] items-center px-4">
          <span className="text-xl font-bold tracking-tight text-white">wall</span>
        </div>
      </header>

      <main className="mx-auto grid max-w-[980px] gap-6 px-4 py-5 md:grid-cols-4">
        <div className="md:col-span-1">
          <ProfileSidebar />
        </div>
        <div className="min-w-0 md:col-span-3">
          <Wall />
        </div>
      </main>
    </>
  );
}
