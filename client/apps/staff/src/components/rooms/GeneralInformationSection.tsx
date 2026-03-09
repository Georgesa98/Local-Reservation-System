import { useFormContext, useController } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { SectionHeading } from "./SectionHeading";
import type { RoomFormState } from "../../pages/dashboard/rooms/[id]/SpecificRoom";

// Property type options — extend as needed
const PROPERTY_TYPES = [
  "Apartment",
  "House",
  "Villa",
  "Studio",
  "Loft",
  "Penthouse",
  "Hostel",
  "Hotel Room",
] as const;

export function GeneralInformationSection() {
  const { t } = useTranslation();
  const { register } = useFormContext<RoomFormState>();

  const { field: propertyTypeField } = useController<
    RoomFormState,
    "propertyType"
  >({
    name: "propertyType",
  });

  return (
    <section>
      <SectionHeading>{t("room.section.generalInfo")}</SectionHeading>

      {/* Internal title */}
      <div className="mt-5 flex flex-col gap-1.5">
        <label className="label-caps">{t("room.field.internalTitle")}</label>
        <Input {...register("title")} className="w-full" />
      </div>

      {/* Public listing name */}
      <div className="mt-4 flex flex-col gap-1.5">
        <label className="label-caps">
          {t("room.field.publicListingName")}
        </label>
        <Input {...register("location")} className="w-full" />
      </div>

      {/* Property type + floor area — two columns */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="label-caps">{t("room.field.propertyType")}</label>
          <Select
            value={propertyTypeField.value}
            onValueChange={propertyTypeField.onChange}
          >
            <SelectTrigger className="w-full h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {PROPERTY_TYPES.map((pt) => (
                <SelectItem key={pt} value={pt}>
                  {pt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="label-caps">{t("room.field.floorArea")}</label>
          <Input
            type="number"
            min={0}
            {...register("floorArea")}
            className="w-full"
          />
        </div>
      </div>
    </section>
  );
}
