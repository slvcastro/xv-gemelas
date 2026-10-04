"use client";

import { useState } from "react";
import { SplashScreen } from "@/components/SplashScreen";
import { HeroSection } from "@/components/HeroSection";
import { MessageSection } from "@/components/MessageSection";
import { FamilySection } from "@/components/FamilySection";
import { EventDetailsSection } from "@/components/EventDetailsSection";
import { DressCodeSection } from "@/components/DressCodeSection";
import { CheckInvitation } from "@/components/CheckInvitation";
import { CountdownSection } from "@/components/CountdownSection";
import { GiftsSection } from "@/components/GiftsSection";
import { db } from "@/db";
import { media } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export default async function Home() {
  const coverImage = await db.query.media.findFirst({
    where: eq(media.usage, "cover_both"),
    orderBy: [desc(media.createdAt)],
  });

  return (
    <main className="flex flex-col items-center min-h-screen bg-ivory overflow-hidden">
      {/* Splash Screen */}
      <SplashScreen />

      {/* Main Content */}
      <div className="w-full">
        <HeroSection coverImageUrl={coverImage?.url || null} />
        <CountdownSection />
        <MessageSection />
        <FamilySection />
        <EventDetailsSection />
        <GiftsSection />
        <DressCodeSection />
        <CheckInvitation />
        
        {/* Footer provisional */}
        <footer className="w-full py-12 text-center bg-espresso text-ivory/50 font-sans text-xs uppercase tracking-widest">
          <p>Kelly &amp; Kyara • 2026</p>
        </footer>
      </div>
    </main>
  );
}
