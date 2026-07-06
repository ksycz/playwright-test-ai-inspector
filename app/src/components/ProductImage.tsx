interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function ProductImage({ src, alt, className = '' }: ProductImageProps) {
  return (
    <div className={`product-image-frame ${className}`.trim()}>
      <img src={src} alt={alt} className="h-full w-full object-contain" />
    </div>
  );
}
