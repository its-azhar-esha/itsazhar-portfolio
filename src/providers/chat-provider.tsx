"use client";

import * as React from "react";
import { AnimatePresence } from "framer-motion";
import { FloatingButton } from "@/components/ai/floating-button";
import { ChatWindow } from "@/components/ai/chat-window";

interface ChatContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const ChatContext = React.createContext<ChatContextValue | null>(null);

export function useChat() {
  const ctx = React.useContext(ChatContext);
  if (!ctx) {
    return { isOpen: false, setIsOpen: () => {} };
  }
  return ctx;
}

export function ChatProvider({
  children,
  enabled = true,
}: {
  children: React.ReactNode;
  enabled?: boolean;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  if (!enabled) return <>{children}</>;

  return (
    <ChatContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
      <AnimatePresence>
        {isOpen ? (
          <ChatWindow key="chat-window" onClose={() => setIsOpen(false)} />
        ) : (
          <FloatingButton key="floating-btn" onClick={() => setIsOpen(true)} />
        )}
      </AnimatePresence>
    </ChatContext.Provider>
  );
}
