"use client";

/**
 * Notification system admin panel.
 *
 * Sections:
 *  - Master switch + category/event toggles + per-event priorities
 *  - Telegram connection (token + status + test)
 *  - Recipients (chat ids) CRUD + send test message
 *  - Delivery history + retry failed sends
 */

import * as React from "react";
import {
  BellRing,
  CheckCircle2,
  Loader2,
  Radio,
  RefreshCcw,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/admin/projects/confirm-dialog";
import { formatDateTimeShortBD } from "@/lib/format/dates";
import {
  NOTIFICATION_CATEGORY_META,
  NOTIFICATION_PRIORITY_META,
  type NotificationCategory,
  type NotificationConfig,
  type NotificationDelivery,
  type NotificationPriority,
  type NotificationRecipient,
} from "@/types/notifications";
import { NOTIFICATION_EVENTS } from "@/lib/notifications/events";
import type { NotificationOverview } from "@/lib/notifications/actions";
import {
  saveNotificationConfigAction,
  testTelegramConnectionAction,
  saveTelegramTokenAction,
  clearTelegramTokenAction,
  sendTestMessageAction,
  retryDeliveryAction,
} from "@/lib/notifications/actions";

type Overview = NotificationOverview;

interface NotificationManagerProps {
  initial: Overview;
}

const PRIORITY_ORDER: NotificationPriority[] = ["critical", "high", "normal", "low"];

function priorityBadgeVariant(priority: NotificationPriority) {
  if (priority === "critical") return "destructive" as const;
  if (priority === "high") return "outline" as const;
  return "secondary" as const;
}

export function NotificationManager({ initial }: NotificationManagerProps) {
  const toast = useToast();
  const [config, setConfig] = React.useState<NotificationConfig>(initial.config);
  const [overview, setOverview] = React.useState<Overview>(initial);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [tokenInput, setTokenInput] = React.useState("");
  const [clearingToken, setClearingToken] = React.useState(false);
  const [recipientChatId, setRecipientChatId] = React.useState("");
  const [recipientLabel, setRecipientLabel] = React.useState("");
  const [selectedForTest, setSelectedForTest] = React.useState<Set<string>>(new Set());
  const [retryingId, setRetryingId] = React.useState<string | null>(null);

  const dirty = JSON.stringify(config) !== JSON.stringify(initial.config);

  function updateConfig(mutate: (draft: NotificationConfig) => void) {
    setConfig((prev) => {
      const draft = structuredClone(prev);
      mutate(draft);
      return draft;
    });
  }

  async function saveConfig() {
    setBusy("save");
    const result = await saveNotificationConfigAction(config as unknown as Record<string, unknown>);
    setBusy(null);
    if (result.success) {
      setConfig(result.data);
      setOverview((prev) => ({ ...prev, config: result.data }));
      toast.success("Notification settings saved.");
    } else {
      toast.error(result.error);
    }
  }

  async function testConnection() {
    setBusy("test");
    const result = await testTelegramConnectionAction();
    setBusy(null);
    if (result.success) {
      const me = result.data.me;
      setOverview((prev) => ({
        ...prev,
        telegramConnected: true,
        telegramMe: me ?? null,
        telegramError: null,
      }));
      toast.success(
        me?.username ? `Connected — bot @${me.username}.` : "Connected — Telegram bot reachable.",
      );
    } else {
      setOverview((prev) => ({ ...prev, telegramConnected: false, telegramError: result.error }));
      toast.error(result.error);
    }
  }

  async function saveToken() {
    if (!tokenInput.trim()) {
      toast.error("Paste a bot token first.");
      return;
    }
    setBusy("token");
    const result = await saveTelegramTokenAction({ token: tokenInput.trim() });
    setBusy(null);
    if (result.success) {
      setTokenInput("");
      setOverview((prev) => ({
        ...prev,
        telegramConnected: true,
        telegramMe: result.data.me ?? null,
        telegramError: null,
        tokenStored: true,
      }));
      toast.success("Bot token saved and encrypted.");
    } else {
      toast.error(result.error);
    }
  }

  async function clearToken() {
    setBusy("clearToken");
    const result = await clearTelegramTokenAction();
    setBusy(null);
    setClearingToken(false);
    if (result.success) {
      setOverview((prev) => ({ ...prev, tokenStored: false }));
      toast.success("Stored bot token removed.");
    } else {
      toast.error(result.error);
    }
  }

  function toggleRecipient(id: string) {
    updateConfig((draft) => {
      const rec = draft.recipients.find((r) => r.id === id);
      if (rec) rec.enabled = !rec.enabled;
    });
  }

  function addRecipient() {
    if (!recipientChatId.trim()) {
      toast.error("Enter a chat ID first.");
      return;
    }
    updateConfig((draft) => {
      draft.recipients.push({
        id: crypto.randomUUID(),
        chatId: recipientChatId.trim(),
        label: recipientLabel.trim() || recipientChatId.trim(),
        enabled: true,
      });
    });
    setRecipientChatId("");
    setRecipientLabel("");
  }

  function removeRecipient(id: string) {
    updateConfig((draft) => {
      draft.recipients = draft.recipients.filter((r) => r.id !== id);
    });
  }

  async function sendTest() {
    if (selectedForTest.size === 0) {
      toast.error("Pick at least one recipient for the test message.");
      return;
    }
    setBusy("testMessage");
    const result = await sendTestMessageAction({
      recipientIds: Array.from(selectedForTest),
    });
    setBusy(null);
    if (result.success) {
      toast.success(`Test message sent to ${result.data.sent} recipient(s).`);
    } else {
      toast.error(result.error);
    }
  }

  async function retry(delivery: NotificationDelivery) {
    setRetryingId(delivery.id);
    const result = await retryDeliveryAction({ deliveryId: delivery.id });
    setRetryingId(null);
    if (result.success) {
      setOverview((prev) => ({
        ...prev,
        recentDeliveries: prev.recentDeliveries.map((d) =>
          d.id === delivery.id ? result.data : d,
        ),
      }));
      toast.success("Delivery retried.");
    } else {
      toast.error(result.error);
    }
  }

  const toggleAll = (enabled: boolean) =>
    updateConfig((draft) => {
      for (const event of NOTIFICATION_EVENTS) {
        if (enabled) delete draft.events[event.id];
        else draft.events[event.id] = false;
      }
    });

  return (
    <div className="space-y-6">
      {/* ── Master switch ─────────────────────────────────────────────── */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 px-4 pt-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <BellRing className="text-primary h-4 w-4" />
            Notifications
            {dirty && (
              <Badge variant="outline" className="text-[10px]">
                Unsaved changes
              </Badge>
            )}
          </CardTitle>
          <Switch
            checked={config.enabled}
            onCheckedChange={(checked) => updateConfig((draft) => void (draft.enabled = checked))}
          />
        </CardHeader>
        <CardContent className="space-y-4 px-4 pt-1 pb-4">
          <p className="text-muted-foreground text-xs">
            Master switch. When off, nothing is sent, even if categories or events are enabled
            below. New lead alerts and critical backup/outage failures are marked{" "}
            <span className="font-semibold">Critical</span> so they stand out.
          </p>

          {/* Category toggles */}
          <div className="space-y-3">
            {(Object.keys(NOTIFICATION_CATEGORY_META) as NotificationCategory[]).map((cat) => {
              const meta = NOTIFICATION_CATEGORY_META[cat];
              const eventsInCat = NOTIFICATION_EVENTS.filter((e) => e.category === cat);
              const enabledCount = eventsInCat.filter((e) => config.events[e.id] !== false).length;
              return (
                <div
                  key={cat}
                  className="border-border/40 flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{meta.label}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {enabledCount}/{eventsInCat.length} events
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-xs">{meta.description}</p>
                  </div>
                  <Switch
                    checked={config.categories[cat]}
                    onCheckedChange={(checked) =>
                      updateConfig((draft) => void (draft.categories[cat] = checked))
                    }
                  />
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleAll(true)}
              disabled={!config.enabled}
            >
              Enable all events
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleAll(false)}
              disabled={!config.enabled}
            >
              Disable all events
            </Button>
            <Button size="sm" onClick={saveConfig} disabled={busy !== null || !dirty}>
              {busy === "save" ? "Saving…" : "Save settings"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Event list + priorities ───────────────────────────────────── */}
      <Card className="border-border/50">
        <CardHeader className="px-4 pt-4">
          <CardTitle className="text-sm font-semibold">Events &amp; priorities</CardTitle>
          <CardDescription className="text-xs">
            Each event can be enabled/disabled independently and assigned a priority. Critical and
            high events are visually distinct in Telegram. Changes apply after clicking{" "}
            <span className="font-semibold">Save settings</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 px-4 pt-1 pb-4">
          {NOTIFICATION_EVENTS.map((event) => {
            const enabled = config.events[event.id] !== false;
            const priority = config.priorities[event.id] ?? event.defaultPriority;
            const catMeta = NOTIFICATION_CATEGORY_META[event.category];
            const isEnabled = config.enabled && enabled;
            return (
              <div
                key={event.id}
                className="border-border/30 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border-b py-2 last:border-b-0"
              >
                <div className="min-w-0 flex-1 basis-52">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${isEnabled ? "" : "text-muted-foreground line-through"}`}
                    >
                      {event.label}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {catMeta.label}
                    </Badge>
                  </div>
                  <p
                    className="text-muted-foreground mt-0.5 truncate text-xs"
                    title={event.description}
                  >
                    {event.description}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Priority</span>
                  <select
                    className="border-input bg-background h-8 rounded-md border px-2 text-xs"
                    value={priority}
                    onChange={(e) =>
                      updateConfig((draft) => {
                        draft.priorities[event.id] = e.target.value as NotificationPriority;
                      })
                    }
                  >
                    {PRIORITY_ORDER.map((p) => (
                      <option key={p} value={p}>
                        {NOTIFICATION_PRIORITY_META[p].emoji} {NOTIFICATION_PRIORITY_META[p].label}
                      </option>
                    ))}
                  </select>
                </label>
                <Switch
                  checked={enabled}
                  onCheckedChange={(checked) =>
                    updateConfig((draft) => {
                      if (checked) delete draft.events[event.id];
                      else draft.events[event.id] = false;
                    })
                  }
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* ── Telegram connection ───────────────────────────────────────── */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 px-4 pt-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Send className="text-primary h-4 w-4" />
            Telegram connection
          </CardTitle>
          <Badge
            variant={overview.telegramConnected ? "default" : "outline"}
            className="text-[10px]"
          >
            {overview.telegramConnected ? (
              <CheckCircle2 className="mr-1 h-2.5 w-2.5" />
            ) : (
              <XCircle className="mr-1 h-2.5 w-2.5" />
            )}
            {overview.telegramConnected ? "Connected" : "Not connected"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pt-1 pb-4">
          {overview.telegramConnected && overview.telegramMe && (
            <p className="text-muted-foreground text-xs">
              Bot{" "}
              <span className="text-foreground font-semibold">
                @{overview.telegramMe.username ?? overview.telegramMe.id}
              </span>{" "}
              is reachable. Messages are delivered through this bot.
            </p>
          )}
          {overview.telegramError && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
              {overview.telegramError}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-1">
            <div className="space-y-2">
              <Label htmlFor="telegram-token">Bot token</Label>
              <div className="flex flex-wrap gap-2">
                <Input
                  id="telegram-token"
                  type="password"
                  autoComplete="off"
                  placeholder={
                    overview.tokenStored
                      ? "Stored token is masked — enter a new one to rotate"
                      : "Paste your bot token (from @BotFather)"
                  }
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="max-w-md"
                />
                <Button size="sm" onClick={saveToken} disabled={busy !== null}>
                  {busy === "token"
                    ? "Saving…"
                    : overview.tokenStored
                      ? "Rotate token"
                      : "Save token"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testConnection}
                  disabled={busy !== null}
                >
                  {busy === "test" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Radio className="h-3.5 w-3.5" />
                  )}
                  Test connection
                </Button>
                {overview.tokenStored && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
                    onClick={() => setClearingToken(true)}
                    disabled={busy !== null}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground text-xs">
                Create a bot with @BotFather to get a token. Tokens are encrypted (AES-256-GCM)
                before storage. If no token is stored here, the{" "}
                <code className="bg-accent/50 rounded px-1 font-mono">TELEGRAM_BOT_TOKEN</code>{" "}
                environment variable is used as a fallback.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Recipients ────────────────────────────────────────────────── */}
      <Card className="border-border/50">
        <CardHeader className="px-4 pt-4">
          <CardTitle className="text-sm font-semibold">Recipients</CardTitle>
          <CardDescription className="text-xs">
            Chat IDs / handles that receive notifications. Numeric ids (e.g.{" "}
            <code className="bg-accent/50 rounded px-1 font-mono">123456789</code>) or public
            handles (e.g. <code className="bg-accent/50 rounded px-1 font-mono">@username</code>).
            Get your numeric id from @userinfobot. Toggle recipients on/off individually.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pt-1 pb-4">
          {config.recipients.length === 0 ? (
            <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-xs">
              No recipients yet — add one below to receive notifications.
            </p>
          ) : (
            <div className="space-y-2">
              {config.recipients.map((recipient: NotificationRecipient) => (
                <div
                  key={recipient.id}
                  className="border-border/40 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{recipient.label}</span>
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {recipient.chatId}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {recipient.enabled ? "Receiving notifications" : "Muted"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        className="accent-primary h-3.5 w-3.5"
                        checked={selectedForTest.has(recipient.id)}
                        onChange={(e) =>
                          setSelectedForTest((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(recipient.id);
                            else next.delete(recipient.id);
                            return next;
                          })
                        }
                      />
                      Test
                    </label>
                    <Switch
                      checked={recipient.enabled}
                      onCheckedChange={() => toggleRecipient(recipient.id)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
                      onClick={() => removeRecipient(recipient.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="recipient-chat-id">Chat ID / handle</Label>
              <Input
                id="recipient-chat-id"
                placeholder="123456789 or @username"
                value={recipientChatId}
                onChange={(e) => setRecipientChatId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipient-label">Label (optional)</Label>
              <Input
                id="recipient-label"
                placeholder="e.g. Personal chat"
                value={recipientLabel}
                onChange={(e) => setRecipientLabel(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={addRecipient}>
              + Add recipient
            </Button>
            <Button
              size="sm"
              onClick={sendTest}
              disabled={busy !== null || selectedForTest.size === 0}
            >
              {busy === "testMessage" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Send test message
            </Button>
            {selectedForTest.size > 0 && (
              <span className="text-muted-foreground text-xs">{selectedForTest.size} selected</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Delivery history ──────────────────────────────────────────── */}
      <Card className="border-border/50">
        <CardHeader className="px-4 pt-4">
          <CardTitle className="text-sm font-semibold">Delivery history</CardTitle>
          <CardDescription className="text-xs">
            Most recent sends, one row per recipient. Failed deliveries can be retried.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pt-1 pb-4">
          {overview.recentDeliveries.length === 0 ? (
            <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-xs">
              No deliveries recorded yet.
            </p>
          ) : (
            <div className="space-y-2">
              {overview.recentDeliveries.map((delivery: NotificationDelivery) => (
                <div
                  key={delivery.id}
                  className="border-border/40 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1 basis-52">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={priorityBadgeVariant(delivery.priority as NotificationPriority)}
                        className="text-[10px]"
                      >
                        {NOTIFICATION_PRIORITY_META[delivery.priority as NotificationPriority]
                          ?.emoji ?? ""}{" "}
                        {delivery.priority}
                      </Badge>
                      <span className="text-sm font-medium">{delivery.title}</span>
                    </div>
                    <p
                      className="text-muted-foreground mt-0.5 truncate text-xs"
                      title={delivery.message}
                    >
                      {delivery.event} · {delivery.recipientLabel || delivery.chatId}
                    </p>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {formatDateTimeShortBD(delivery.createdAt)}
                    {delivery.attempts > 1 && ` · attempt ${delivery.attempts}`}
                  </div>
                  {delivery.status === "failed" ? (
                    <>
                      <Badge variant="destructive" className="text-[10px]">
                        Failed
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => retry(delivery)}
                        disabled={retryingId === delivery.id}
                      >
                        {retryingId === delivery.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCcw className="h-3 w-3" />
                        )}
                        Retry
                      </Button>
                    </>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">
                      <CheckCircle2 className="mr-1 h-2.5 w-2.5" />
                      Sent
                    </Badge>
                  )}
                  {delivery.error && (
                    <p className="w-full text-xs text-red-500" title={delivery.error}>
                      {delivery.error}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={clearingToken}
        title="Remove stored bot token?"
        description="The bot token stored in this admin panel will be deleted. If the TELEGRAM_BOT_TOKEN environment variable is set, notifications continue to work through the fallback."
        confirmLabel="Remove"
        onConfirm={clearToken}
        onCancel={() => setClearingToken(false)}
      />
    </div>
  );
}
