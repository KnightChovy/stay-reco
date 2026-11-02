import type { APIResponse, HotelSummary } from "@stayreco/shared";
import { apiService } from "./ApiService";

/** Khách sạn nhân viên được phân công (cùng endpoint với StaffHotelProvider bên web). */
export const getMyHotels = async () => {
  const { data } = await apiService.get<APIResponse<HotelSummary[]>>("/me/hotels");
  return data.data;
};
