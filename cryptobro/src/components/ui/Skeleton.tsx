interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circle' | 'card';
}

const VARIANT_STYLES = {
  text: 'h-4 w-full rounded-md',
  circle: 'rounded-full',
  card: 'h-24 w-full rounded-[14px]',
} as const;

export default function Skeleton({
  className = '',
  variant = 'text',
}: SkeletonProps) {
  return (
    <div
      className={`skeleton ${VARIANT_STYLES[variant]} ${className}`}
    />
  );
}
