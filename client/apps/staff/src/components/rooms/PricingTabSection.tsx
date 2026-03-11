/**
 * PricingTabSection — full two-column pricing tab.
 *
 * Left column: PricingRulesTable
 * Right sidebar: PricingSidebar (base rate, active rules, final rate)
 *
 * All data fetching and mutations live here; child components are purely presentational.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchPricingRules,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
} from "../../pages/dashboard/rooms/[id]/api";
import type { PricingRule, PricingRulePayload } from "../../pages/dashboard/rooms/types";import { PricingRulesTable } from "./PricingRulesTable";
import { PricingSidebar } from "./PricingSidebar";
import { PricingRuleForm } from "./PricingRuleForm";

// ── Types ────────────────────────────────────────────────────────────────────

interface PricingTabSectionProps {
  roomId: number;
  basePrice: string | undefined; // e.g. "240.00"
}

// ── Component ────────────────────────────────────────────────────────────────

export function PricingTabSection({ roomId, basePrice }: PricingTabSectionProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // ── Dialog state ────────────────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<PricingRule | null>(null);

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data: rulesData, isLoading } = useQuery({
    queryKey: ["room-pricing-rules", roomId],
    queryFn: () => fetchPricingRules(roomId),
    enabled: !isNaN(roomId),
  });

  const rules = rulesData ?? [];

  // ── Mutations ───────────────────────────────────────────────────────────────

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["room-pricing-rules", roomId] });

  const createMutation = useMutation({
    mutationFn: (payload: PricingRulePayload) => createPricingRule(roomId, payload),
    onSuccess: () => {
      invalidate();
      setFormOpen(false);
      toast.success(t("room.pricing.toast.created"));
    },
    onError: () => toast.error(t("room.pricing.toast.createFailed")),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      ruleId,
      payload,
    }: {
      ruleId: number;
      payload: Partial<PricingRulePayload>;
    }) => updatePricingRule(roomId, ruleId, payload),
    onSuccess: () => {
      invalidate();
      setFormOpen(false);
      toast.success(t("room.pricing.toast.updated"));
    },
    onError: () => toast.error(t("room.pricing.toast.updateFailed")),
  });

  const deleteMutation = useMutation({
    mutationFn: (ruleId: number) => deletePricingRule(roomId, ruleId),
    onSuccess: () => {
      invalidate();
      setFormOpen(false);
      setSelectedRule(null);
      toast.success(t("room.pricing.toast.deleted"));
    },
    onError: () => toast.error(t("room.pricing.toast.deleteFailed")),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ ruleId, is_active }: { ruleId: number; is_active: boolean }) =>
      updatePricingRule(roomId, ruleId, { is_active }),
    onSuccess: () => {
      invalidate();
      toast.success(t("room.pricing.toast.toggled"));
    },
    onError: () => toast.error(t("room.pricing.toast.toggleFailed")),
  });

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function openAdd() {
    setSelectedRule(null);
    setFormOpen(true);
  }

  function openEdit(rule: PricingRule) {
    setSelectedRule(rule);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setSelectedRule(null);
  }

  function handleSave(payload: PricingRulePayload) {
    if (selectedRule) {
      updateMutation.mutate({ ruleId: selectedRule.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleDelete() {
    if (selectedRule) deleteMutation.mutate(selectedRule.id);
  }

  function handleToggle(rule: PricingRule) {
    toggleMutation.mutate({ ruleId: rule.id, is_active: !rule.is_active });
  }

  // Export CSV — simple download
  function handleExportCsv() {
    const headers = ["ID", "Rule Type", "Modifier", "Is %", "Start", "End", "Min Nights", "Active"];
    const rows = rules.map((r) =>
      [
        r.id,
        r.rule_type,
        r.price_modifier,
        r.is_percentage,
        r.start_date ?? "",
        r.end_date ?? "",
        r.min_nights ?? "",
        r.is_active,
      ].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `room-${roomId}-pricing-rules.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  return (
    <>
      <div className="grid grid-cols-[1fr_320px] h-full">
        {/* Left column */}
        <div
          className="flex flex-col gap-8 px-8 py-8 overflow-auto"
          style={{ borderInlineEnd: "1px solid var(--border)" }}
        >
          <PricingRulesTable
            rules={rules}
            isLoading={isLoading}
            onToggleActive={handleToggle}
            onEditRule={openEdit}
            onAddRule={openAdd}
            onExportCsv={handleExportCsv}
            onUpdateAll={() => {/* future: bulk update */}}
          />
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-8 px-6 py-8 overflow-auto">
          <PricingSidebar basePrice={basePrice} rules={rules} />
        </div>
      </div>

      {/* Dialog */}
      <PricingRuleForm
        open={formOpen}
        onClose={closeForm}
        onSave={handleSave}
        onDelete={selectedRule ? handleDelete : undefined}
        rule={selectedRule}
        isSaving={isMutating}
        isDeleting={deleteMutation.isPending}
      />
    </>
  );
}
