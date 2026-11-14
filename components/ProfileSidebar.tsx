import Image from "next/image";

import { Card } from "@/components/ui/card";

// Edit these to personalize the profile.
const PROFILE = {
  name: "Marco Burdeos",
  network: "Mapua University",
  city: "Batangas, Philippines",
};

export function ProfileSidebar() {
  return (
    <aside className="flex flex-col gap-3">
      <Image
        src="/profile.jpg"
        alt={`Profile photo of ${PROFILE.name}`}
        width={600}
        height={600}
        priority
        className="aspect-square w-40 rounded-lg object-cover md:w-full"
      />

      <div>
        <h1 className="text-lg leading-tight font-bold text-gray-900">
          {PROFILE.name}
        </h1>
        <p className="text-sm text-gray-500">wall</p>
      </div>

      <Card
        role="region"
        aria-labelledby="info-heading"
        className="gap-0 rounded-lg border border-gray-200 py-0 text-sm ring-0"
      >
        <h2
          id="info-heading"
          className="border-b border-gray-200 bg-[#eceff5] px-3 py-1.5 text-xs font-bold text-[#333]"
        >
          Information
        </h2>
        <dl className="space-y-2 px-3 py-3">
          <div>
            <dt className="text-xs text-gray-500">Networks:</dt>
            <dd className="text-gray-900">{PROFILE.network}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Current City:</dt>
            <dd className="text-gray-900">{PROFILE.city}</dd>
          </div>
        </dl>
      </Card>
    </aside>
  );
}
