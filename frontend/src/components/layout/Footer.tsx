'use client';

import Image from 'next/image';
import Link from 'next/link';

const footerGroups = [
  {
    title: 'Về StayReco',
    links: [
      { href: '/about', label: 'Giới thiệu' },
      { href: '/careers', label: 'Cơ hội nghề nghiệp' },
      { href: '/press', label: 'Báo chí & Tin tức' },
      { href: '/partners', label: 'Đối tác khách sạn' },
    ],
  },
  {
    title: 'Khám phá & Trải nghiệm',
    links: [
      { href: '/destinations', label: 'Khám phá điểm đến' },
      { href: '/recommendations', label: 'Gợi ý cá nhân hóa' },
      { href: '/boutique-hotels', label: 'Boutique Hotel nổi bật' },
      { href: '/travel-guide', label: 'Cẩm nang du lịch' },
    ],
  },
  {
    title: 'Hỗ trợ & Pháp lý',
    links: [
      { href: '/support', label: 'Trung tâm trợ giúp' },
      { href: '/privacy-policy', label: 'Chính sách bảo mật' },
      { href: '/terms-of-service', label: 'Điều khoản dịch vụ' },
      { href: '/contact', label: 'Liên hệ hỗ trợ 24/7' },
    ],
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-white text-foreground">
      <div className="mx-auto max-w-[100rem] px-4 py-10 sm:px-8 lg:px-8 lg:py-11">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.75fr_0.8fr_1fr_0.8fr] lg:gap-12">
          <div className="max-w-[25rem]">
            <Link
              href="/"
              className="inline-block rounded-md focus-visible:outline-none"
              aria-label="StayReco - Trang chủ"
            >
              <Image
                src="/images/logo_stayreco.png"
                alt="StayReco"
                width={2055}
                height={765}
                className="h-auto w-24"
              />
            </Link>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Nền tảng đặt phòng khách sạn và boutique stay hàng đầu Việt Nam.
              Tận hưởng kỳ nghỉ với trải nghiệm chân thực, minh bạch giá cả và
              dịch vụ chăm sóc tận tâm.
            </p>
          </div>

          {footerGroups.map((group) => (
            <section
              key={group.title}
              aria-labelledby={group.title.replaceAll(' ', '-').toLowerCase()}
            >
              <h2
                id={group.title.replaceAll(' ', '-').toLowerCase()}
                className="text-base font-semibold text-foreground"
              >
                {group.title}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="rounded-sm text-sm leading-5 text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-border pt-5 text-sm text-muted-foreground lg:mt-11 lg:flex-row lg:items-center lg:justify-between">
          <p className="leading-6">
            © {currentYear} StayReco Hospitality Platform. Bản quyền thuộc về
            StayReco. Nền tảng đặt phòng khách sạn boutique Việt Nam.
          </p>
          <div
            className="flex shrink-0 items-center gap-4"
            aria-label="Ngôn ngữ và tiền tệ"
          >
            <button
              type="button"
              className="rounded-sm transition-colors hover:text-primary focus-visible:outline-none"
            >
              Tiếng Việt (VN)
            </button>
            <span aria-hidden="true">•</span>
            <button
              type="button"
              className="rounded-sm transition-colors hover:text-primary focus-visible:outline-none"
            >
              VND (₫)
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
