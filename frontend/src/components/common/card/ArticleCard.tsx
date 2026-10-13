'use client';

import Link from 'next/link';

export type ArticleCardProps = {
  image: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  author?: string;
  href?: string;
  variant?: 'grid' | 'featured';
};

export default function ArticleCard({
  image,
  category,
  title,
  excerpt,
  date,
  readTime,
  author,
  href = '/blog',
  variant = 'grid',
}: ArticleCardProps) {
  if (variant === 'featured') {
    return (
      <article className="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-md transition-shadow grid grid-cols-1 lg:grid-cols-12">
        <div className="relative lg:col-span-7 h-64 sm:h-80 lg:h-[390px] overflow-hidden group">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-semibold text-stone-700 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
              {category}
            </span>
          </div>
        </div>

        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-2.5">
              <svg className="w-4 h-4 text-[#1b4360]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              <span>Tiêu điểm biên tập StayReco</span>
            </div>
            <Link href={href}>
              <h2 className="text-xl sm:text-[23px] font-bold text-slate-900 leading-snug mb-3 hover:text-[#1b4360] cursor-pointer transition-colors">
                {title}
              </h2>
            </Link>
            <p className="text-xs sm:text-[13.5px] text-stone-600 leading-relaxed line-clamp-4">
              {excerpt}
            </p>
          </div>

          <div className="pt-6 mt-4 border-t border-stone-100 flex items-end justify-between">
            <div className="text-[12px] text-stone-500">
              {author && <p className="font-medium text-slate-800">{author}</p>}
              <p className="mt-0.5 text-stone-400">{date} • {readTime}</p>
            </div>
            <Link
              href={href}
              className="inline-flex items-center gap-1.5 bg-[#1b4360] hover:bg-[#122b47] text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors shadow-xs"
            >
              <span>Đọc bài viết</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="border border-gray-200 rounded-2xl overflow-hidden bg-white hover:shadow-md transition flex flex-col group">
      <div className="aspect-[16/10] overflow-hidden bg-gray-100 relative">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <span className="text-[11px] font-bold text-[#d96a43] uppercase tracking-wider block mb-2">
          {category}
        </span>
        <Link href={href}>
          <h3 className="font-bold text-base text-gray-900 leading-snug mb-2 hover:text-[#1b4360] transition-colors cursor-pointer line-clamp-2">
            {title}
          </h3>
        </Link>
        <p className="text-xs text-gray-600 line-clamp-2 mb-4 leading-relaxed">
          {excerpt}
        </p>
        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
          <span>{date}</span>
          <span>{readTime}</span>
        </div>
      </div>
    </article>
  );
}
