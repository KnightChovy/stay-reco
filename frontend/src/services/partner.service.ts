import { api } from "@/lib/axios";
import type {
  Amenity,
  AvailabilityDay,
  AvailabilityQuery,
  BedType,
  Booking,
  BookingSummary,
  CancellationPolicyInput,
  CreateHotelInput,
  CreatePricingRuleInput,
  HotelBookingsQuery,
  PricePreview,
  PricingRule,
  UpdateAvailabilityInput,
  UpdatePricingRuleInput,
  CreateRoomInput,
  CreateRoomTypeInput,
  Hotel,
  HotelImage,
  HotelSummary,
  InvitationResult,
  InviteStaffInput,
  LockRoomInput,
  Room,
  RoomConfigInput,
  RoomListQuery,
  RoomType,
  RoomTypeImage,
  StaffMember,
  StaffPermission,
  SubmitVerificationInput,
  UpdateHotelImageInput,
  UpdateHotelInput,
  UpdateRoomInput,
  UpdateRoomTypeImageInput,
  UpdateRoomTypeInput,
  UploadedDocument,
  VerificationFileLink,
  VerificationRequest,
} from "@stayreco/shared";
import type { APIResponse, PageMeta } from "@/types/response.type";

/**
 * Hotel partner endpoints (docs/api/partner.md). Every function returns the `data` of the envelope; list endpoints
 * with pagination also return `meta`.
 */

// Multipart: overriding the instance's JSON content type lets axios send the FormData as-is (the browser adds the
// boundary). Uploads of up to 10 MB need more time than the default timeout.
const multipart = { headers: { "Content-Type": "multipart/form-data" }, timeout: 60_000 };

function fileForm(file: File, fields: Record<string, string | undefined> = {}) {
  const form = new FormData();
  form.append("file", file);
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) form.append(key, value);
  }
  return form;
}

// ── Catalog (public) ────────────────────────────────────────

export async function getAmenities() {
  const { data } = await api.get<APIResponse<Amenity[]>>("/amenities");
  return data.data;
}

export async function getBedTypes() {
  const { data } = await api.get<APIResponse<BedType[]>>("/bed-types");
  return data.data;
}

// ── Hotels ──────────────────────────────────────────────────

export async function getMyHotels() {
  const { data } = await api.get<APIResponse<HotelSummary[]>>("/me/hotels");
  return data.data;
}

export async function createHotel(input: CreateHotelInput) {
  const { data } = await api.post<APIResponse<Hotel>>("/hotels", input);
  return data.data;
}

export async function getHotel(hotelId: string) {
  const { data } = await api.get<APIResponse<Hotel>>(`/hotels/${hotelId}`);
  return data.data;
}

export async function updateHotel(hotelId: string, input: UpdateHotelInput) {
  const { data } = await api.patch<APIResponse<Hotel>>(`/hotels/${hotelId}`, input);
  return data.data;
}

/** Replaces the whole amenity list. */
export async function setHotelAmenities(hotelId: string, amenityIds: string[]) {
  const { data } = await api.put<APIResponse<Hotel>>(`/hotels/${hotelId}/amenities`, { amenityIds });
  return data.data;
}

/** Replaces every policy; keys not sent are removed. */
export async function setHotelPolicies(hotelId: string, policies: Record<string, string>) {
  const { data } = await api.put<APIResponse<Hotel>>(`/hotels/${hotelId}/policies`, { policies });
  return data.data;
}

export async function setRoomConfig(hotelId: string, input: RoomConfigInput) {
  const { data } = await api.put<APIResponse<Hotel>>(`/hotels/${hotelId}/room-config`, input);
  return data.data;
}

export async function uploadHotelImage(
  hotelId: string,
  file: File,
  options: { caption?: string; isCover?: boolean } = {},
) {
  const form = fileForm(file, {
    caption: options.caption || undefined,
    isCover: options.isCover ? "true" : undefined,
  });
  const { data } = await api.post<APIResponse<HotelImage>>(`/hotels/${hotelId}/images`, form, multipart);
  return data.data;
}

export async function updateHotelImage(imageId: string, input: UpdateHotelImageInput) {
  const { data } = await api.patch<APIResponse<HotelImage>>(`/hotel-images/${imageId}`, input);
  return data.data;
}

export async function deleteHotelImage(imageId: string) {
  await api.delete(`/hotel-images/${imageId}`);
}

// ── Room types ──────────────────────────────────────────────

export async function getRoomTypes(hotelId: string) {
  const { data } = await api.get<APIResponse<RoomType[]>>(`/hotels/${hotelId}/room-types`);
  return data.data;
}

export async function createRoomType(hotelId: string, input: CreateRoomTypeInput) {
  const { data } = await api.post<APIResponse<RoomType>>(`/hotels/${hotelId}/room-types`, input);
  return data.data;
}

export async function updateRoomType(roomTypeId: string, input: UpdateRoomTypeInput) {
  const { data } = await api.patch<APIResponse<RoomType>>(`/room-types/${roomTypeId}`, input);
  return data.data;
}

export async function deleteRoomType(roomTypeId: string) {
  await api.delete(`/room-types/${roomTypeId}`);
}

export async function uploadRoomTypeImage(roomTypeId: string, file: File, caption?: string) {
  const form = fileForm(file, { caption: caption || undefined });
  const { data } = await api.post<APIResponse<RoomTypeImage>>(`/room-types/${roomTypeId}/images`, form, multipart);
  return data.data;
}

export async function updateRoomTypeImage(imageId: string, input: UpdateRoomTypeImageInput) {
  const { data } = await api.patch<APIResponse<RoomTypeImage>>(`/room-type-images/${imageId}`, input);
  return data.data;
}

export async function deleteRoomTypeImage(imageId: string) {
  await api.delete(`/room-type-images/${imageId}`);
}

// ── Rooms ───────────────────────────────────────────────────

export type RoomListParams = Partial<RoomListQuery>;

export async function getRooms(hotelId: string, params: RoomListParams) {
  const { data } = await api.get<APIResponse<Room[]>>(`/hotels/${hotelId}/rooms`, { params });
  return { rooms: data.data, meta: data.meta as PageMeta };
}

export async function createRoom(hotelId: string, input: CreateRoomInput) {
  const { data } = await api.post<APIResponse<Room>>(`/hotels/${hotelId}/rooms`, input);
  return data.data;
}

export async function updateRoom(roomId: string, input: UpdateRoomInput) {
  const { data } = await api.patch<APIResponse<Room>>(`/rooms/${roomId}`, input);
  return data.data;
}

export async function lockRoom(roomId: string, input: LockRoomInput) {
  const { data } = await api.post<APIResponse<Room>>(`/rooms/${roomId}/lock`, input);
  return data.data;
}

export async function unlockRoom(roomId: string) {
  const { data } = await api.post<APIResponse<Room>>(`/rooms/${roomId}/unlock`);
  return data.data;
}

// ── Staff ───────────────────────────────────────────────────

export async function getHotelStaff(hotelId: string) {
  const { data } = await api.get<APIResponse<StaffMember[]>>(`/hotels/${hotelId}/staff`);
  return data.data;
}

export async function inviteStaff(input: InviteStaffInput) {
  const { data } = await api.post<APIResponse<InvitationResult>>("/auth/invitations/staff", input);
  return data.data;
}

/** Replaces the whole list; an empty list makes the staff member read-only. */
export async function setStaffPermissions(staffId: string, permissions: StaffPermission[]) {
  const { data } = await api.patch<APIResponse<StaffMember>>(`/hotel-staff/${staffId}/permissions`, { permissions });
  return data.data;
}

export async function deactivateStaff(staffId: string) {
  const { data } = await api.post<APIResponse<StaffMember>>(`/hotel-staff/${staffId}/deactivate`);
  return data.data;
}

export async function activateStaff(staffId: string) {
  const { data } = await api.post<APIResponse<StaffMember>>(`/hotel-staff/${staffId}/activate`);
  return data.data;
}

/** Cancels a pending invitation (only while INVITED). */
export async function cancelStaffInvitation(staffId: string) {
  await api.delete(`/hotel-staff/${staffId}`);
}

// ── Verification ────────────────────────────────────────────

export async function uploadVerificationDocument(file: File) {
  const { data } = await api.post<APIResponse<UploadedDocument>>(
    "/uploads/verification-documents",
    fileForm(file),
    multipart,
  );
  return data.data;
}

export async function submitVerification(hotelId: string, input: SubmitVerificationInput) {
  const { data } = await api.post<APIResponse<VerificationRequest>>(
    `/hotels/${hotelId}/verification-requests`,
    input,
  );
  return data.data;
}

/** Newest first; account and ID numbers are masked. */
export async function getVerificationRequests(hotelId: string) {
  const { data } = await api.get<APIResponse<VerificationRequest[]>>(`/hotels/${hotelId}/verification-requests`);
  return data.data;
}

/** Full request: unlike the history, account and ID numbers are not masked. */
export async function getVerificationRequest(requestId: string) {
  const { data } = await api.get<APIResponse<VerificationRequest>>(`/verification-requests/${requestId}`);
  return data.data;
}

/** A signed link valid for 5 minutes; ask for a new one every time. */
export async function getVerificationDocumentLink(documentId: string) {
  const { data } = await api.get<APIResponse<VerificationFileLink>>(`/verification-documents/${documentId}/file`);
  return data.data;
}

// ── Cancellation policy ─────────────────────────────────────

/** Fixed on each booking when it is made: a change never affects existing bookings. */
export async function setCancellationPolicy(hotelId: string, input: CancellationPolicyInput) {
  const { data } = await api.patch<APIResponse<Hotel>>(`/hotels/${hotelId}/cancellation-policy`, input);
  return data.data;
}

// ── Pricing rules ───────────────────────────────────────────

/** Highest priority first. */
export async function getPricingRules(hotelId: string, roomTypeId?: string) {
  const { data } = await api.get<APIResponse<PricingRule[]>>(`/hotels/${hotelId}/pricing-rules`, {
    params: { roomTypeId },
  });
  return data.data;
}

export async function createPricingRule(hotelId: string, input: CreatePricingRuleInput) {
  const { data } = await api.post<APIResponse<PricingRule>>(`/hotels/${hotelId}/pricing-rules`, input);
  return data.data;
}

export async function updatePricingRule(ruleId: string, input: UpdatePricingRuleInput) {
  const { data } = await api.patch<APIResponse<PricingRule>>(`/pricing-rules/${ruleId}`, input);
  return data.data;
}

export async function deletePricingRule(ruleId: string) {
  await api.delete(`/pricing-rules/${ruleId}`);
}

/** Price of one night; `date` is treated as the check-in date and `bookedOn` defaults to today. */
export async function getPricePreview(roomTypeId: string, params: { date: string; bookedOn?: string }) {
  const { data } = await api.get<APIResponse<PricePreview>>(`/room-types/${roomTypeId}/price-preview`, { params });
  return data.data;
}

// ── Availability calendar ──────────────────────────────────

/** One entry per room type and date; at most 62 days per request. */
export async function getAvailability(hotelId: string, params: AvailabilityQuery) {
  const { data } = await api.get<APIResponse<AvailabilityDay[]>>(`/hotels/${hotelId}/availability`, { params });
  return data.data;
}

/** Keeps `onSale` rooms sellable on each day of the range; booked and held nights are never touched. */
export async function updateAvailability(hotelId: string, input: UpdateAvailabilityInput) {
  const { data } = await api.patch<APIResponse<AvailabilityDay[]>>(`/hotels/${hotelId}/availability`, input);
  return data.data;
}

// ── Bookings and refunds ────────────────────────────────────

export type HotelBookingsParams = Partial<HotelBookingsQuery>;

export async function getHotelBookings(hotelId: string, params: HotelBookingsParams) {
  const { data } = await api.get<APIResponse<BookingSummary[]>>(`/hotels/${hotelId}/bookings`, {
    params,
    // Repeated filters are sent as `status=a&status=b`, not `status[]=` (api-guide §5).
    paramsSerializer: { indexes: null },
  });
  return { bookings: data.data, meta: data.meta as PageMeta };
}

export async function getBooking(bookingId: string) {
  const { data } = await api.get<APIResponse<Booking>>(`/bookings/${bookingId}`);
  return data.data;
}

/** The booking becomes CANCELLED and the refund moves to the customer's wallet. Allowed while suspended. */
export async function approveRefund(bookingId: string) {
  const { data } = await api.post<APIResponse<Booking>>(`/bookings/${bookingId}/approve-refund`);
  return data.data;
}

/** Only for the BR-20 reasons; the reason is emailed to the customer. */
export async function rejectRefund(bookingId: string, reason: string) {
  const { data } = await api.post<APIResponse<Booking>>(`/bookings/${bookingId}/reject-refund`, { reason });
  return data.data;
}
