"use client";
// Client because it holds state shared between cards: which video is playing. Children stay server-rendered.
import { createContext, useContext, useMemo, useState } from "react";

type Ctx = { activeId: string | null; setActiveId: (id: string | null) => void };
const VideoGroupContext = createContext<Ctx>({ activeId: null, setActiveId: () => {} });

export const useVideoGroup = () => useContext(VideoGroupContext);

/** Lets only one testimonial video play at a time (starting one replaces the other). */
export default function VideoGroup({ children }: { children: React.ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const value = useMemo(() => ({ activeId, setActiveId }), [activeId]);
  return <VideoGroupContext.Provider value={value}>{children}</VideoGroupContext.Provider>;
}
