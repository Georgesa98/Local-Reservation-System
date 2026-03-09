/**
 * SpecificRoom — Room detail overview page.
 *
 * Accessed via /rooms/:id (clicking a row in the rooms table).
 * Tabs: Overview (fully implemented) | Images | Pricing | Availability | Reviews (stubs).
 *
 * Layout: two-column — left form column + right sidebar.
 * Form state is owned by react-hook-form; PATCH is fired only on "Save Changes".
 * FormProvider wraps the overview layout so child sections can read/write the
 * form directly via useFormContext — no prop-drilling of values or onChange handlers.
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useForm, FormProvider } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@workspace/ui/components/tabs";
import DashboardLayout from "../../layout";
import { fetchRoom, updateRoom, fetchPricingRules } from "./api";
import {
  RoomDetailHeader,
  GeneralInformationSection,
  OccupancySection,
  DescriptionSection,
  AmenitiesSection,
  MainImageSection,
  ActiveRulesSection,
  RoomDetailSkeleton,
} from "../../../../components/rooms";

// ─── Form state shape ─────────────────────────────────────────────────────────

export interface RoomFormState {
  title: string;
  location: string; // matches API field "location" (public listing name)
  propertyType: string; // UI-only — not sent to API
  floorArea: string; // UI-only — not sent to API
  capacity: number;
  bedrooms: number; // UI-only — not sent to API
  base_price_per_night: string;
  description: string;
  services: string[];
  is_active: boolean;
}

function defaultFormState(): RoomFormState {
  return {
    title: "",
    location: "",
    propertyType: "Apartment",
    floorArea: "",
    capacity: 1,
    bedrooms: 1,
    base_price_per_night: "0.00",
    description: "",
    services: [],
    is_active: true,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SpecificRoomPage() {
  const { id } = useParams<{ id: string }>();
  const roomId = Number(id);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("overview");

  // ── RHF form ────────────────────────────────────────────────────────────────

  const methods = useForm<RoomFormState>({
    defaultValues: defaultFormState(),
  });

  const {
    handleSubmit,
    reset,
    watch,
    formState: { isDirty },
  } = methods;

  // ── Data fetching ───────────────────────────────────────────────────────────

  const {
    data: room,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => fetchRoom(roomId),
    enabled: !isNaN(roomId),
  });

  const { data: rulesData, isLoading: rulesLoading } = useQuery({
    queryKey: ["room-pricing-rules", roomId],
    queryFn: () => fetchPricingRules(roomId),
    enabled: !isNaN(roomId),
  });

  // ── Sync server data → form (on first load and after successful save) ───────

  useEffect(() => {
    if (room) {
      reset({
        title: room.title,
        location: room.location,
        propertyType: "Apartment", // not in API — keep UI default
        floorArea: "", // not in API — keep UI default
        capacity: room.capacity,
        bedrooms: 1, // not in API — keep UI default
        base_price_per_night: room.base_price_per_night,
        description: room.description,
        services: room.services ?? [],
        is_active: room.is_active,
      });
    }
  }, [room, reset]);

  // ── Save mutation ───────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: (data: RoomFormState) =>
      updateRoom(roomId, {
        title: data.title,
        location: data.location,
        capacity: data.capacity,
        base_price_per_night: data.base_price_per_night,
        description: data.description,
        services: data.services,
        is_active: data.is_active,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["room", roomId], updated);
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      // reset with the returned server data to clear dirty state
      reset({
        title: updated.title,
        location: updated.location,
        propertyType: methods.getValues("propertyType"),
        floorArea: methods.getValues("floorArea"),
        capacity: updated.capacity,
        bedrooms: methods.getValues("bedrooms"),
        base_price_per_night: updated.base_price_per_night,
        description: updated.description,
        services: updated.services ?? [],
        is_active: updated.is_active,
      });
      toast.success(t("room.toast.saved"));
    },
    onError: () => {
      toast.error(t("room.toast.saveFailed"));
    },
  });

  const onSubmit = handleSubmit((data) => saveMutation.mutate(data));

  // ── Derived values ─────────────────────────────────────────────────────────

  const pricingRules = rulesData?.results ?? [];
  const totalRulesCount = rulesData?.count ?? 0;

  // is_active is read by the header — watch it so the header re-renders on change
  const isActive = watch("is_active");

  // Last-synced: show room's updated_at time or "—"
  const lastSynced = room?.updated_at
    ? new Date(room.updated_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  // ── Error state ─────────────────────────────────────────────────────────────

  if (isError) {
    return (
      <DashboardLayout>
        <div
          className="flex flex-col flex-1 items-center justify-center gap-4"
          style={{ background: "var(--card)" }}
        >
          <p
            className="label-caps"
            style={{ color: "var(--muted-foreground)" }}
          >
            {t("room.errorLoading")}
          </p>
          <button
            onClick={() => navigate("/rooms")}
            className="label-caps underline"
            style={{ color: "var(--foreground)" }}
          >
            {t("common.back")}
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div
        className="flex flex-col w-full flex-1 min-h-0"
        style={{ background: "var(--card)" }}
      >
        {/* Top bar — outside FormProvider intentionally; reads via watch() above */}
        <RoomDetailHeader
          roomNumber={room?.id ?? "…"}
          isActive={isActive}
          lastSynced={lastSynced}
          isDirty={isDirty}
          isSaving={saveMutation.isPending}
          onSave={onSubmit}
        />

        {/* Tabs nav */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col flex-1 min-h-0"
        >
          <TabsList
            variant="line"
            className="w-full justify-start px-6 h-12 shrink-0"
            style={{ borderBottom: "1px solid var(--border)", borderRadius: 0 }}
          >
            {(
              [
                ["overview", t("room.tabs.overview")],
                ["images", t("room.tabs.images")],
                ["pricing", t("room.tabs.pricing")],
                ["availability", t("room.tabs.availability")],
                ["reviews", t("room.tabs.reviews")],
              ] as [string, string][]
            ).map(([value, label]) => (
              <TabsTrigger
                key={value}
                value={value}
                className="label-caps px-4 h-full"
                style={{ borderRadius: 0 }}
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── Overview tab ───────────────────────────────────────────────── */}
          <TabsContent
            value="overview"
            className="flex-1 min-h-0 overflow-auto m-0"
          >
            {isLoading ? (
              <RoomDetailSkeleton />
            ) : (
              <FormProvider {...methods}>
                <div className="grid grid-cols-[1fr_320px] h-full">
                  {/* Left column — form sections */}
                  <div
                    className="flex flex-col gap-10 px-8 py-8 overflow-auto"
                    style={{ borderInlineEnd: "1px solid var(--border)" }}
                  >
                    <GeneralInformationSection />
                    <OccupancySection />
                    <DescriptionSection />
                  </div>

                  {/* Right sidebar */}
                  <div className="flex flex-col gap-8 px-6 py-8 overflow-auto">
                    <AmenitiesSection />

                    <MainImageSection
                      images={room?.images ?? []}
                      onManageAll={() => setActiveTab("images")}
                    />

                    <ActiveRulesSection
                      rules={pricingRules}
                      totalCount={totalRulesCount}
                      isLoading={rulesLoading}
                      onEditRules={() => setActiveTab("pricing")}
                    />
                  </div>
                </div>
              </FormProvider>
            )}
          </TabsContent>

          {/* ── Stub tabs ──────────────────────────────────────────────────── */}
          {(["images", "pricing", "availability", "reviews"] as const).map(
            (tab) => (
              <TabsContent
                key={tab}
                value={tab}
                className="flex-1 min-h-0 overflow-auto m-0 flex items-center justify-center"
              >
                <p
                  className="label-caps"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {t(`room.tabs.${tab}`)} — {t("common.comingSoon")}
                </p>
              </TabsContent>
            ),
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
