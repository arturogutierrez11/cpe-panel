import clsx from "clsx";

export function LoadingSpinner({ label = "Cargando", size = "md", className }) {
  return (
    <span className={clsx("loading-spinner-wrap", `loading-spinner-wrap--${size}`, className)} role="status" aria-label={label}>
      <span className="loading-spinner" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
