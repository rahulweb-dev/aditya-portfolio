'use client';

import { createContext, useContext } from 'react';
import { DEFAULT_CONTENT, type SiteContent } from '@/lib/content';

// The site's text, loaded once on the server (from MongoDB) and shared with every component.
const Ctx = createContext<SiteContent>(DEFAULT_CONTENT);

export default function ContentProvider({ value, children }: { value: SiteContent; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useContent = () => useContext(Ctx);
