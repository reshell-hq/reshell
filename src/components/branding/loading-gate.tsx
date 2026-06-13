import { ReshellLogo } from "./reshell-logo";

type LoadingGateProps = {
  label: string;
};

export function LoadingGate({ label }: LoadingGateProps) {
  return (
    <div className="reshell-loading-gate" role="status">
      <ReshellLogo size={40} animated />
      <p className="reshell-loading-gate-label">{label}</p>
    </div>
  );
}
