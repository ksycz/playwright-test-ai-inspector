import { isSeeded } from '@/seededBugs';

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function ProductImage({ src, alt, className = '' }: ProductImageProps) {
  return (
    <div className={`product-image-frame ${className}`.trim()}>
      <img src={src} alt={isSeeded('audit-image-alt-empty') ? '' : alt} className="h-full w-full object-contain" />
    </div>
  );
}
