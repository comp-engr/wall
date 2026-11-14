import Image from "next/image";

// Edit these to personalize the profile.
const PROFILE = {
  name: "Marco Burdeos",
  network: "[YOUR SCHOOL OR COMPANY]",
  city: "[YOUR CITY]",
};

export function ProfileSidebar() {
  return (
    <aside className="flex flex-col gap-3">
      <Image
        src="/profile.jpg"
        alt={`Profile photo of ${PROFILE.name}`}
        width={400}
        height={400}
        priority
        className="aspect-square w-40 rounded-lg object-cover md:w-full"
      />

      <div>
        <h1 className="text-lg leading-tight font-bold text-gray-900">
          {PROFILE.name}
        </h1>
        <p className="text-sm text-gray-500">wall</p>
      </div>

      <section aria-labelledby="info-heading" className="text-sm">
        <h2
          id="info-heading"
          className="border-t border-[#94a3c4] bg-[#eceff5] px-2 py-1 text-xs font-bold text-[#333]"
        >
          Information
        </h2>
        <dl className="space-y-2 px-2 pt-2">
          <div>
            <dt className="text-xs text-gray-500">Networks:</dt>
            <dd className="text-gray-900">{PROFILE.network}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Current City:</dt>
            <dd className="text-gray-900">{PROFILE.city}</dd>
          </div>
        </dl>
      </section>
    </aside>
  );
}
