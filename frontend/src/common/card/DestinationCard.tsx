'use client';

import Link from 'next/link';

export type DestinationCardProps = {
  name: string;
  image: string;
  countText: string;
  href?: string;
};

export default function DestinationCard({
  name,
  image,
  countText,
  href = '/search',
}: DestinationCardProps) {
  return (
    <Link
      href={href}
      className="group relative rounded-2xl overflow-hidden aspect-[4/5] shadow-xs cursor-pointer block"
    >
      <img
        src={image}
        alt={name}
        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4 text-white">
        <h3 className="text-xl font-bold">{name}</h3>
        <p className="text-xs text-gray-300">{countText}</p>
      </div>
    </Link>
  );
}
