"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { ok, fail, type Result } from "@/lib/result";
import { saveSettings } from "@/lib/settings/repository";
import { saveAiConfigInputSchema, testAiProviderInputSchema } from "@/lib/validation";
import type { AiConfig, AiProviderId } from "@/types/settings";
import { getAiConfig, getCustomKnowledge, invalidateAiConfigCache } from "@/lib/ai/config";
import { resolveApiKey, getIntegrationList } from "@/lib/integrations/repository";
import { fetchWithRetry } from "@/lib/ai/providers/shared";
import { notify } from "@/lib/notifications/sender";

const MODELS_ENDPOINTS: Record<AiProviderId, string> = {
  groq: "https://api.groq.com/openai/v1/models",
  openrouter: "https://openrouter.ai/api/v1/models",
};

export interface AiConfigBundle {
  ai_config: AiConfig;
  custom_knowledge: string;
}

export interface AiProviderKeyStatus {
  configured: boolean;
  maskedKey: string | null;
  envConfigured: boolean;
}

export interface AiConfigWithKeyStatus extends Omit<AiConfig, "providers"> {
  providers: (AiConfig["providers"][number] & { keyStatus: AiProviderKeyStatus })[];
}

export interface AiConfigBundleWithKeyStatus {
  ai_config: AiConfigWithKeyStatus;
  custom_knowledge: string;
}

/** Admin view of the AI configuration plus the key status of each AI provider. */
export async function getAiConfigAction(): Promise<Result<AiConfigBundleWithKeyStatus>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const [config, customKnowledge, integrations] = await Promise.all([
      getAiConfig(),
      getCustomKnowledge(),
      getIntegrationList(),
    ]);

    const providers = config.providers.map((provider) => {
      const info = integrations.success
        ? integrations.data.find((i) => i.id === provider.id)
        : undefined;
      return {
        ...provider,
        keyStatus: info
          ? {
              configured: info.hasStoredKey || info.envConfigured,
              maskedKey: info.maskedKey,
              envConfigured: info.envConfigured,
            }
          : { configured: false, maskedKey: null, envConfigured: false },
      };
    });

    return ok({ ai_config: { ...config, providers }, custom_knowledge: customKnowledge });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to load AI configuration");
  }
}

export async function saveAiConfigAction(input: unknown): Promise<Result<AiConfigBundle>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const parsed = saveAiConfigInputSchema.safeParse(input);
    if (!parsed.success) {
      return fail(parsed.error.issues.map((i) => i.message).join("; "));
    }

    const result = await saveSettings({
      ai_config: parsed.data.ai_config,
      custom_knowledge: parsed.data.custom_knowledge,
    });
    if (!result.success) return fail(result.error);

    invalidateAiConfigCache();
    revalidatePath("/admin/ai");
    await logAudit({
      action: "ai.config.updated",
      entity: "settings",
      detail: {
        enabled: parsed.data.ai_config.enabled,
        providers: parsed.data.ai_config.providers.map((p) => p.id),
      },
    });
    await notify("ai.config.updated", {
      fields: { Status: parsed.data.ai_config.enabled ? "enabled" : "disabled" },
    });

    return ok({
      ai_config: parsed.data.ai_config,
      custom_knowledge: parsed.data.custom_knowledge,
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to save AI configuration");
  }
}

export interface ProviderTestResult {
  provider: AiProviderId;
  latencyMs: number;
  models: string[];
}

/**
 * Validates a provider API key and discovers the available models by calling
 * the provider's /models endpoint. Used by the "Test Connection" button and
 * to populate the model dropdown.
 */
export async function testAiProviderAction(input: unknown): Promise<Result<ProviderTestResult>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const parsed = testAiProviderInputSchema.safeParse(input);
    if (!parsed.success) {
      return fail(parsed.error.issues.map((i) => i.message).join("; "));
    }
    const id = parsed.data.id;

    const apiKey = await resolveApiKey(id);
    if (!apiKey) {
      return fail(
        `${id} has no API key. Save one on the Integrations page or set the ${id === "groq" ? "GROQ_API_KEY" : "OPENROUTER_API_KEY"} environment variable.`,
      );
    }

    const startedAt = Date.now();
    const response = await fetchWithRetry(
      MODELS_ENDPOINTS[id],
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
      1,
    );
    const latencyMs = Date.now() - startedAt;

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      return fail(`${id} returned ${response.status}: ${errorText.slice(0, 300)}`);
    }

    const body = (await response.json().catch(() => null)) as {
      data?: { id?: unknown }[];
    } | null;
    const models = Array.isArray(body?.data)
      ? body.data
          .map((m) => (typeof m.id === "string" ? m.id : ""))
          .filter((idValue): idValue is string => idValue !== "")
      : [];

    if (models.length === 0) {
      return fail(`${id} responded but returned no models.`);
    }

    return ok({ provider: id, latencyMs, models });
  } catch (err) {
    return fail(
      err instanceof Error
        ? `${err.message}`
        : "Failed to reach the provider. Check the key and try again.",
    );
  }
}
