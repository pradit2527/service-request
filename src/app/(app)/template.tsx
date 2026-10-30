// A template remounts on every navigation, which replays the fade-in below.
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="motion-safe:animate-fade-up">{children}</div>;
}
