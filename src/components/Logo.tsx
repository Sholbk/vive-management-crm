import Image from "next/image";

export default function Logo({
  size = 32,
  showWordmark = false,
  className = "",
}: {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/vive-management-logo.png"
        alt="Vive Management"
        width={size * 1.6}
        height={size}
        priority
        className="object-contain"
      />
      {showWordmark && (
        <span className="font-semibold text-text">Vive Management CRM</span>
      )}
    </span>
  );
}
