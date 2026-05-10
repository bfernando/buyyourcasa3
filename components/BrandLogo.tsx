import Image from "next/image";
import clsx from "clsx";

type BrandLogoProps = {
  compact?: boolean;
  className?: string;
};

export default function BrandLogo({ compact = false, className }: BrandLogoProps) {
  return (
    <span className={clsx("inline-flex items-center gap-2.5", className)}>
      <span className="flex h-9 w-12 items-center justify-center overflow-hidden rounded-sm border border-surface-border bg-surface-card shadow-sm">
        <Image
          src="/mi-casa-house.png"
          alt=""
          width={96}
          height={36}
          className="h-7 w-10 object-contain"
          priority
        />
      </span>
      <span className="leading-none">
        <span className="block font-display text-xl font-semibold text-cream">
          Mi Casa
        </span>
        {!compact && (
          <span className="mt-1 block text-[9px] font-body font-semibold uppercase tracking-[0.22em] text-gold">
            Investment Group
          </span>
        )}
      </span>
    </span>
  );
}
