"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  MapPinned,
  ShieldCheck,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";
import {
  DocumentType,
  REQUIRED_VERIFICATION_DOCUMENTS,
  submitVerificationSchema,
  UPLOAD_RULES,
  type Hotel,
  type SubmitVerificationInput,
  type VerificationRequest,
} from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  getApiErrorCode,
  getApiErrorMessage,
  getApiFieldErrors,
  validateWith,
  type FieldErrors,
} from "@/lib/api-error";
import { cn } from "@/lib/utils";
import * as partnerService from "@/services/partner.service";
import { partnerKeys, usePartnerMutation } from "../api/partner-queries";
import {
  FormAlert,
  FormField,
  PartnerPanel,
  SubmitButton,
  toOptionalNumber,
  toOptionalText,
  usePartnerActions,
} from "../components";
import { documentTypeLabels } from "../lib/labels";

type LegalKey = keyof SubmitVerificationInput["legal"];
type BeneficiaryKey = keyof SubmitVerificationInput["beneficiary"];
type PropertyKey = keyof SubmitVerificationInput["property"];

type TextField<K extends string> = {
  key: K;
  label: string;
  required?: boolean;
  wide?: boolean;
  hint?: string;
  placeholder?: string;
  suggestions?: string[];
  inputMode?: "numeric" | "tel" | "email";
  uppercase?: boolean;
};

const legalFields: TextField<LegalKey>[] = [
  { key: "legalName", label: "Tên pháp nhân", required: true, wide: true },
  { key: "taxCode", label: "Mã số thuế", required: true, hint: "10 số, hoặc dạng 0123456789-001", inputMode: "numeric" },
  {
    key: "businessType",
    label: "Loại hình doanh nghiệp",
    required: true,
    suggestions: ["Công ty TNHH", "Công ty cổ phần", "Doanh nghiệp tư nhân", "Hộ kinh doanh"],
  },
  { key: "representativeName", label: "Người đại diện theo pháp luật", required: true },
  { key: "representativeTitle", label: "Chức danh", required: true, placeholder: "Giám đốc" },
  { key: "representativeIdNumber", label: "Số CCCD / hộ chiếu", required: true, uppercase: true },
  { key: "contactPhone", label: "Điện thoại liên hệ", required: true, inputMode: "tel" },
  { key: "notificationEmail", label: "Email nhận kết quả", required: true, inputMode: "email", hint: "Kết quả thẩm định được gửi tới email này." },
];

const beneficiaryFields: TextField<BeneficiaryKey>[] = [
  { key: "bankName", label: "Ngân hàng", required: true },
  { key: "accountNumber", label: "Số tài khoản", required: true, inputMode: "numeric" },
  { key: "accountHolder", label: "Chủ tài khoản", required: true, wide: true },
];

const propertyFields: TextField<Exclude<PropertyKey, "starRating" | "surveyNotes">>[] = [
  { key: "tradeName", label: "Tên thương mại", required: true },
  {
    key: "propertyType",
    label: "Loại hình lưu trú",
    required: true,
    suggestions: ["Khách sạn", "Resort", "Căn hộ dịch vụ", "Homestay", "Nhà nghỉ"],
  },
  { key: "physicalRooms", label: "Số phòng vật lý", required: true, inputMode: "numeric" },
  { key: "propertyManager", label: "Người quản lý cơ sở", required: true },
  { key: "licensedAddress", label: "Địa chỉ theo giấy phép", required: true, wide: true },
  { key: "landmark", label: "Mốc nhận diện", placeholder: "Đối diện cầu Rồng" },
  { key: "frontDeskHours", label: "Giờ lễ tân", placeholder: "24/7" },
];

const documentSlots: DocumentType[] = [
  DocumentType.BUSINESS_LICENSE,
  DocumentType.FIRE_SAFETY,
  DocumentType.SECURITY_CERTIFICATE,
  DocumentType.OTHER,
];

const steps: Array<{ title: string; subtitle: string; icon: LucideIcon; description: string }> = [
  { title: "Pháp nhân", subtitle: "Doanh nghiệp & tài khoản", icon: Building2, description: "Phải trùng khớp với giấy chứng nhận đăng ký kinh doanh. Tài khoản thụ hưởng dùng để nhận tiền đối soát." },
  { title: "Cơ sở", subtitle: "Thông tin lưu trú", icon: MapPinned, description: "Xác nhận vị trí, quy mô và người chịu trách nhiệm vận hành thực tế." },
  { title: "Tài liệu", subtitle: "Hồ sơ pháp lý", icon: FileCheck2, description: "PDF, JPG hoặc PNG, tối đa 10 MB. Mỗi tài liệu là một tệp riêng." },
  { title: "Xác nhận", subtitle: "Rà soát & gửi", icon: ShieldCheck, description: "Rà soát lần cuối trước khi chuyển hồ sơ tới chuyên viên StayReco." },
];

type Values = {
  legal: Record<LegalKey, string>;
  beneficiary: Record<BeneficiaryKey, string>;
  property: Record<PropertyKey, string>;
};

type DocumentSlot = { fileId?: string; fileName?: string; uploading?: boolean; error?: string };

/** Starts from the previous request (full detail) when re-submitting, otherwise from the hotel's own data. */
function initialValues(hotel: Hotel, email: string, previous?: VerificationRequest): Values {
  const pick = <K extends string>(keys: K[], source: Record<string, unknown> | null | undefined, fallback: Partial<Record<K, string>>) =>
    Object.fromEntries(
      keys.map((key) => [key, source?.[key] != null ? String(source[key]) : (fallback[key] ?? "")]),
    ) as Record<K, string>;

  return {
    legal: pick(legalFields.map((field) => field.key), previous?.legal, {
      contactPhone: hotel.phone ?? "",
      notificationEmail: email,
    }),
    beneficiary: pick(beneficiaryFields.map((field) => field.key), previous?.beneficiary, {}),
    property: pick(
      [...propertyFields.map((field) => field.key), "starRating", "surveyNotes"] as PropertyKey[],
      previous?.property,
      {
        tradeName: hotel.name,
        propertyType: "Khách sạn",
        starRating: hotel.starRating?.toString() ?? "",
        physicalRooms: hotel.roomConfig?.totalRooms.toString() ?? "",
        licensedAddress: `${hotel.address}, ${hotel.city}`,
      },
    ),
  };
}

function stepOfField(path: string) {
  if (path.startsWith("legal") || path.startsWith("beneficiary")) return 0;
  if (path.startsWith("property")) return 1;
  if (path.startsWith("documents")) return 2;
  return 3;
}

export function VerificationWizard({
  hotel,
  email,
  previous,
  onSubmitted,
}: {
  hotel: Hotel;
  email: string;
  previous?: VerificationRequest;
  onSubmitted: () => void;
}) {
  const { showNotice } = usePartnerActions();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(() => initialValues(hotel, email, previous));
  const [documents, setDocuments] = useState<Partial<Record<DocumentType, DocumentSlot>>>({});
  const [commitment, setCommitment] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();

  const submit = usePartnerMutation(
    (input: SubmitVerificationInput) => partnerService.submitVerification(hotel.id, input),
    {
      invalidate: () => [partnerKeys.verifications(hotel.id), partnerKeys.hotel(hotel.id), partnerKeys.hotels()],
      successMessage: "Đã gửi hồ sơ xác minh. StayReco sẽ phản hồi qua email.",
      errorNotice: false,
      onSuccess: onSubmitted,
    },
  );

  const setField = <G extends keyof Values>(group: G, key: keyof Values[G] & string, value: string) =>
    setValues((prev) => ({ ...prev, [group]: { ...prev[group], [key]: value } }));

  function buildBody() {
    const { property } = values;
    return {
      legal: values.legal,
      beneficiary: values.beneficiary,
      property: {
        tradeName: property.tradeName,
        propertyType: property.propertyType,
        starRating: toOptionalNumber(property.starRating),
        physicalRooms: toOptionalNumber(property.physicalRooms),
        propertyManager: property.propertyManager,
        licensedAddress: property.licensedAddress,
        landmark: toOptionalText(property.landmark),
        frontDeskHours: toOptionalText(property.frontDeskHours),
        surveyNotes: toOptionalText(property.surveyNotes),
      },
      documents: documentSlots
        .filter((type) => documents[type]?.fileId)
        .map((type) => ({ documentType: type, fileId: documents[type]!.fileId! })),
      commitment,
    };
  }

  /** Checks only the current step so the partner is not shown errors for steps not reached yet. */
  function validateStep(index: number): boolean {
    const body = buildBody();
    let stepErrors: FieldErrors = {};
    if (index === 0) {
      stepErrors = validateWith(submitVerificationSchema.pick({ legal: true, beneficiary: true }), body).errors ?? {};
    } else if (index === 1) {
      stepErrors = validateWith(submitVerificationSchema.pick({ property: true }), body).errors ?? {};
    } else if (index === 2) {
      for (const type of REQUIRED_VERIFICATION_DOCUMENTS) {
        if (!documents[type]?.fileId) stepErrors[`document.${type}`] = "Tài liệu bắt buộc.";
      }
      if (documentSlots.some((type) => documents[type]?.uploading)) {
        stepErrors.documents = "Vui lòng chờ tải tệp xong.";
      }
    }
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  }

  async function handleFile(type: DocumentType, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!(UPLOAD_RULES.document.mimeTypes as readonly string[]).includes(file.type)) {
      setDocuments((prev) => ({ ...prev, [type]: { ...prev[type], error: "Chỉ nhận tệp PDF, JPG hoặc PNG." } }));
      return;
    }
    if (file.size > UPLOAD_RULES.document.maxBytes) {
      setDocuments((prev) => ({ ...prev, [type]: { ...prev[type], error: "Tệp vượt quá 10 MB." } }));
      return;
    }
    setDocuments((prev) => ({ ...prev, [type]: { fileName: file.name, uploading: true } }));
    setErrors((prev) => ({ ...prev, [`document.${type}`]: "" }));
    try {
      const { fileId } = await partnerService.uploadVerificationDocument(file);
      setDocuments((prev) => ({ ...prev, [type]: { fileId, fileName: file.name } }));
    } catch (error) {
      setDocuments((prev) => ({ ...prev, [type]: { error: getApiErrorMessage(error) } }));
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (step < steps.length - 1) {
      if (validateStep(step)) setStep(step + 1);
      return;
    }
    setFormError(undefined);
    const result = validateWith(submitVerificationSchema, buildBody());
    if (result.errors) {
      setErrors(result.errors);
      setStep(Math.min(...Object.keys(result.errors).map(stepOfField)));
      return;
    }
    setErrors({});
    submit.mutate(result.data, {
      onError: (error) => {
        const code = getApiErrorCode(error);
        const fieldErrors = getApiFieldErrors(error);
        setErrors(fieldErrors);
        setFormError(getApiErrorMessage(error));
        if (code === "VERIFICATION_PENDING") {
          showNotice(getApiErrorMessage(error), "error");
          onSubmitted();
        } else if (code === "VERIFICATION_DOCUMENTS_MISSING") {
          setStep(2);
        } else if (Object.keys(fieldErrors).length) {
          setStep(Math.min(...Object.keys(fieldErrors).map(stepOfField)));
        }
      },
    });
  }

  const renderField = <G extends "legal" | "beneficiary" | "property">(group: G, field: TextField<string>) => {
    const path = `${group}.${field.key}`;
    const listId = field.suggestions ? `verification-${field.key}-options` : undefined;
    return (
      <FormField
        key={path}
        label={field.label}
        required={field.required}
        hint={field.hint}
        error={errors[path]}
        className={field.wide ? "md:col-span-2" : undefined}
      >
        <Input
          value={(values[group] as Record<string, string>)[field.key]}
          onChange={(event) =>
            setField(group, field.key as keyof Values[G] & string, field.uppercase ? event.target.value.toUpperCase() : event.target.value)
          }
          inputMode={field.inputMode}
          type={field.inputMode === "email" ? "email" : field.inputMode === "tel" ? "tel" : "text"}
          placeholder={field.placeholder}
          list={listId}
          aria-invalid={!!errors[path] || undefined}
        />
        {listId && (
          <datalist id={listId}>
            {field.suggestions!.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        )}
      </FormField>
    );
  };

  const current = steps[step];
  const StepIcon = current.icon;
  const requiredUploaded = REQUIRED_VERIFICATION_DOCUMENTS.filter((type) => documents[type]?.fileId).length;

  return (
    <div className="space-y-5">
      <PartnerPanel className="p-4">
        <ol className="grid gap-2 md:grid-cols-4">
          {steps.map((item, index) => (
            <li
              key={item.title}
              aria-current={index === step ? "step" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl p-3",
                index === step
                  ? "bg-primary text-primary-foreground"
                  : index < step
                    ? "bg-success-soft text-success"
                    : "bg-muted text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold",
                  index === step ? "bg-card text-primary" : index < step ? "bg-success text-success-foreground" : "bg-card",
                )}
              >
                {index < step ? <Check size={15} /> : index + 1}
              </span>
              <div>
                <strong className="block text-sm">{item.title}</strong>
                <span className="text-[10px] opacity-75">{item.subtitle}</span>
              </div>
            </li>
          ))}
        </ol>
      </PartnerPanel>

      <PartnerPanel className="p-6">
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-6 flex gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <StepIcon size={21} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-primary">{current.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{current.description}</p>
            </div>
          </div>

          {step === 0 && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">{legalFields.map((field) => renderField("legal", field))}</div>
              <div>
                <h3 className="mb-3 text-sm font-bold text-primary">Tài khoản thụ hưởng</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {beneficiaryFields.map((field) => renderField("beneficiary", field))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              {propertyFields.slice(0, 2).map((field) => renderField("property", field))}
              <FormField label="Hạng sao" error={errors["property.starRating"]}>
                <NativeSelect
                  value={values.property.starRating}
                  onChange={(event) => setField("property", "starRating", event.target.value)}
                  className="w-full"
                >
                  <NativeSelectOption value="">Chưa xếp hạng</NativeSelectOption>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <NativeSelectOption key={star} value={star}>
                      {star} sao
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </FormField>
              {propertyFields.slice(2).map((field) => renderField("property", field))}
              <FormField label="Hướng dẫn khảo sát" error={errors["property.surveyNotes"]} className="md:col-span-2">
                <Textarea
                  value={values.property.surveyNotes}
                  onChange={(event) => setField("property", "surveyNotes", event.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Lối vào chính, khu vực đón khách, người liên hệ khi khảo sát..."
                />
              </FormField>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              {documentSlots.map((type) => {
                const slot = documents[type];
                const required = REQUIRED_VERIFICATION_DOCUMENTS.includes(type);
                const error = slot?.error || errors[`document.${type}`];
                const inputId = `verification-document-${type}`;
                return (
                  <div key={type} className="flex flex-col gap-3 rounded-xl bg-muted p-4 sm:flex-row sm:items-center">
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-xl",
                        slot?.fileId ? "bg-success-soft text-success" : "bg-brand-accent-soft text-brand-accent",
                      )}
                    >
                      {slot?.fileId ? <FileCheck2 size={18} /> : <UploadCloud size={18} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <strong className="text-sm text-primary">
                        {documentTypeLabels[type]}
                        {required ? <span className="text-danger"> *</span> : <span className="font-normal text-muted-foreground"> (không bắt buộc)</span>}
                      </strong>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {slot?.uploading ? `Đang tải ${slot.fileName}...` : (slot?.fileName ?? "Chưa có tệp")}
                      </p>
                      {error && (
                        <p role="alert" className="mt-1 text-xs text-danger">
                          {error}
                        </p>
                      )}
                    </div>
                    <input
                      id={inputId}
                      type="file"
                      accept={UPLOAD_RULES.document.mimeTypes.join(",")}
                      className="sr-only"
                      onChange={(event) => void handleFile(type, event)}
                      disabled={slot?.uploading}
                    />
                    <label
                      htmlFor={inputId}
                      className={cn(
                        "inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg border bg-card px-2.5 text-[0.8rem] font-semibold text-primary hover:bg-primary/5",
                        slot?.uploading && "pointer-events-none opacity-50",
                      )}
                    >
                      {slot?.uploading ? <Spinner className="size-3.5" /> : <UploadCloud size={14} />}
                      {slot?.fileId ? "Đổi tệp" : "Tải tệp lên"}
                    </label>
                  </div>
                );
              })}
              <FormAlert message={errors.documents} />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <ReviewRow
                title="Pháp nhân & người đại diện"
                detail={`${values.legal.legalName} · MST ${values.legal.taxCode}`}
                onEdit={() => setStep(0)}
              />
              <ReviewRow
                title="Tài khoản thụ hưởng"
                detail={`${values.beneficiary.bankName} · ${values.beneficiary.accountHolder}`}
                onEdit={() => setStep(0)}
              />
              <ReviewRow
                title="Cơ sở lưu trú"
                detail={`${values.property.tradeName} · ${values.property.physicalRooms} phòng · ${values.property.licensedAddress}`}
                onEdit={() => setStep(1)}
              />
              <ReviewRow
                title="Tài liệu"
                detail={`${requiredUploaded}/${REQUIRED_VERIFICATION_DOCUMENTS.length} tài liệu bắt buộc${documents.OTHER?.fileId ? " · có chứng nhận hạng sao" : ""}`}
                onEdit={() => setStep(2)}
              />
              <label className="mt-2 flex items-start gap-3 rounded-xl bg-brand-accent-soft p-4 text-sm">
                <Checkbox className="mt-0.5" checked={commitment} onCheckedChange={setCommitment} />
                <span>Tôi cam kết toàn bộ thông tin và hồ sơ tải lên là chính xác, đúng pháp luật.</span>
              </label>
              {errors.commitment && (
                <p role="alert" className="text-xs text-danger">
                  Bạn cần xác nhận cam kết trước khi gửi.
                </p>
              )}
              <FormAlert message={formError} />
            </div>
          )}

          <div className="mt-7 flex items-center justify-between border-t pt-5">
            <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>
              <ChevronLeft />
              Quay lại
            </Button>
            {step < steps.length - 1 ? (
              <Button type="submit">
                Tiếp tục
                <ChevronRight />
              </Button>
            ) : (
              <SubmitButton pending={submit.isPending} disabled={!commitment}>
                <ShieldCheck />
                Gửi hồ sơ thẩm định
              </SubmitButton>
            )}
          </div>
        </form>
      </PartnerPanel>
    </div>
  );
}

function ReviewRow({ title, detail, onEdit }: { title: string; detail: string; onEdit: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-success-soft text-success">
        <Check size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <strong className="text-sm text-primary">{title}</strong>
        <p className="truncate text-xs text-muted-foreground">{detail}</p>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
        Sửa
      </Button>
    </div>
  );
}
