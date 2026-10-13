'use client';

import Link from 'next/link';

export type HotelCardProps = {
  id?: string;
  name: string;
  image: string;
  starBadge?: string;
  verified?: boolean;
  serviceBadge?: string;
  location: string;
  distanceInfo?: string;
  rating: number;
  reviewCount: number;
  reviewText?: string;
  tags?: string[];
  vibeTag?: string;
  specialOfferTag?: string;
  roomTypeName?: string;
  cancellationPolicy?: string;
  paymentPolicy?: string;
  originalPrice?: string;
  price: string;
  totalPrice?: string;
  pricePeriod?: string;
  priceNote?: string;
  detailsHref?: string;
  layout?: 'grid' | 'horizontal';
};

export default function HotelCard({
  name,
  image,
  starBadge = 'Khách sạn 4 sao',
  verified = false,
  serviceBadge,
  location,
  distanceInfo,
  rating,
  reviewCount,
  reviewText = 'đánh giá thực',
  tags = [],
  vibeTag,
  specialOfferTag,
  roomTypeName,
  cancellationPolicy = 'Miễn phí hủy phòng',
  paymentPolicy = 'Đã gồm thuế, phí',
  originalPrice,
  price,
  totalPrice,
  pricePeriod = '/ đêm',
  priceNote = 'Đã gồm thuế, phí',
  detailsHref = '/hotels/an-nhien-riverside',
  layout = 'grid',
}: HotelCardProps) {
  if (layout === 'horizontal') {
    return (
      <article className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition flex flex-col md:flex-row">
        {/* Image & Badges */}
        <div className="md:w-[320px] h-[210px] md:h-auto relative shrink-0">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
          />
          {starBadge && (
            <span className="absolute top-3 left-3 bg-[#1b4360] text-white text-[11px] font-medium px-2.5 py-1 rounded-md shadow-xs">
              {starBadge}
            </span>
          )}
          {verified && (
            <span className="absolute top-10 left-3 bg-white/95 backdrop-blur-xs text-gray-800 text-[10px] font-semibold px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
              <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
              </svg>
              Xác minh thực địa
            </span>
          )}
          {serviceBadge && !verified && (
            <span className="absolute top-10 left-3 bg-white/95 backdrop-blur-xs text-gray-800 text-[10px] font-semibold px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
              <svg className="w-3 h-3 text-[#1b4360]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              {serviceBadge}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link href={detailsHref}>
                  <h2 className="text-base font-bold text-gray-900 leading-snug hover:text-[#1b4360] transition-colors cursor-pointer">
                    {name}
                  </h2>
                </Link>
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <svg className="w-3.5 h-3.5 text-[#d96a43] mr-1 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>{location}</span>
                  {distanceInfo && (
                    <>
                      <span className="mx-1.5">•</span>
                      <span className="font-semibold text-gray-700">{distanceInfo}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Rating Badge */}
              <div className="text-right shrink-0">
                <div className="inline-flex items-center bg-emerald-50 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded border border-emerald-200">
                  ★ {rating} <span className="text-gray-400 font-normal ml-1">/ 5</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">{reviewCount} {reviewText}</div>
              </div>
            </div>

            {/* Tags / Features */}
            {(vibeTag || specialOfferTag || tags.length > 0) && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {vibeTag && (
                  <span className="inline-flex items-center text-[11px] font-medium bg-[#f0f6fb] text-[#1b4360] px-2 py-0.5 rounded border border-[#d6e7f2]">
                    <span className="mr-1 text-xs">☕</span> {vibeTag}
                  </span>
                )}
                {specialOfferTag && (
                  <span className="inline-flex items-center text-[11px] font-medium bg-[#fdf2e9] text-[#c05621] px-2 py-0.5 rounded border border-[#fed7d7]">
                    <span className="mr-1 text-xs">🍽️</span> {specialOfferTag}
                  </span>
                )}
                {tags.map((tag, idx) => (
                  <span key={idx} className="inline-flex items-center text-[11px] font-medium bg-sky-50 text-sky-700 px-2 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Room Details & Policies */}
            {roomTypeName && (
              <div className="mt-3 pt-2.5 border-t border-gray-100 text-xs">
                <div className="font-semibold text-gray-800 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                  {roomTypeName}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-emerald-700 mt-1">
                  <span className="flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                    {cancellationPolicy}
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-600 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                    Thanh toán tại chỗ nghỉ
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Price & CTA */}
          <div className="mt-3 pt-2 border-t border-gray-100 flex items-end justify-between">
            <div>
              {originalPrice && <div className="text-xs text-gray-400 line-through">{originalPrice}</div>}
              {totalPrice ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-[11px] text-gray-500 font-medium">Tổng 2 đêm:</span>
                  <span className="text-xl font-extrabold text-[#1b4360]">{totalPrice}</span>
                </div>
              ) : (
                <div className="text-lg font-bold text-[#1b4360]">{price}</div>
              )}
              <div className="text-[10px] text-gray-400">{priceNote}</div>
            </div>

            <Link
              href={detailsHref}
              className="bg-[#1b4360] hover:bg-[#15344d] text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <span>Xem phòng</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </Link>
          </div>
        </div>
      </article>
    );
  }

  // Grid layout (G01 style)
  return (
    <div className="group border border-gray-200 rounded-2xl overflow-hidden bg-white flex flex-col shadow-xs hover:shadow-md transition">
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-400"
        />
        {starBadge && (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-xs font-semibold px-2.5 py-1 rounded-md text-gray-800">
            {starBadge}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-center justify-between text-xs mb-1 text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            {location}
          </span>
          <span className="flex items-center font-bold text-gray-800">
            <svg className="w-3 h-3 text-amber-500 fill-amber-400 mr-0.5" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            ★ {rating} <span className="text-gray-400 font-normal ml-0.5">({reviewCount})</span>
          </span>
        </div>

        <Link href={detailsHref}>
          <h3 className="font-bold text-base text-gray-900 line-clamp-1 mb-2 hover:text-[#1b4360] transition-colors cursor-pointer">
            {name}
          </h3>
        </Link>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map((tag, idx) => (
              <span key={idx} className="text-[11px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-gray-100 flex items-end justify-between">
          <div>
            <span className="text-[11px] text-gray-500 block">{cancellationPolicy}</span>
            <span className="text-[10px] text-gray-400 block">{paymentPolicy}</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-[#1b4360]">{price}</span>
            <span className="text-[11px] text-gray-500 block">{pricePeriod}</span>
          </div>
        </div>

        <Link
          href={detailsHref}
          className="mt-3 block text-center py-2 px-3 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Xem chi tiết
        </Link>
      </div>
    </div>
  );
}
