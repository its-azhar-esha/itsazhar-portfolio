"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AdminChat } from "@/components/admin/ai/admin-chat";
import { AiConfigManager } from "@/components/admin/ai/ai-config";
import type { AiConfigBundleWithKeyStatus } from "@/lib/ai/actions";

interface AiPageProps {
  initial: AiConfigBundleWithKeyStatus;
}

export function AiPage({ initial }: AiPageProps) {
  const [tab, setTab] = React.useState<"assistant" | "configuration">("assistant");

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "assistant" | "configuration")}>
        <TabsList>
          <TabsTrigger value="assistant">Assistant</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>
        <TabsContent value="assistant">
          <AdminChat />
        </TabsContent>
        <TabsContent value="configuration">
          <AiConfigManager initial={initial} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
