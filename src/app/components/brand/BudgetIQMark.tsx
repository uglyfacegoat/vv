import logoUrl from "../../../assets/logo.svg";

interface BudgetIQMarkProps {
  size?: number;
  className?: string;
}

export function BudgetIQMark({ size = 32, className = "" }: BudgetIQMarkProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <img
        src={logoUrl}
        alt=""
        className="block h-full w-full object-contain"
      />
    </span>
  );
}
