import Image from "next/image";

const LOGO_ASPECT = 2646 / 1600;

export default function Logo({
  size = 48,
  showWordmark = false,
  className = "",
}: {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}) {
  const width = Math.round(size * LOGO_ASPECT);
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/vive-management-logo.png"
        alt="Vive Management"
        width={width}
        height={size}
        priority
        className="object-contain"
        style={{ height: size, width }}
      />
      {showWordmark && (
        <span className="font-semibold text-text">Vive Management CRM</span>
      )}
    </span>
  );
}
