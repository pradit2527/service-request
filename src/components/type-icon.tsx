import {
  AppWindow,
  BookOpen,
  BrickWall,
  Cable,
  Cloud,
  Database,
  DatabaseBackup,
  Download,
  FilePen,
  FileText,
  Gauge,
  Globe,
  GraduationCap,
  KeyRound,
  KeySquare,
  Laptop,
  Layers,
  LifeBuoy,
  MessagesSquare,
  Rocket,
  Server,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
  UserMinus,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import type { RequestType } from "@/lib/request-types";

const CONFIG: Record<RequestType, { icon: LucideIcon; gradient: string; shadow: string }> = {
  DATA_EXTRACT: { icon: Download, gradient: "from-teal-400 to-cyan-600", shadow: "shadow-teal-500/30" },
  DATA_CORRECTION: { icon: FilePen, gradient: "from-rose-400 to-red-500", shadow: "shadow-rose-500/30" },
  BULK_IMPORT: { icon: Upload, gradient: "from-lime-400 to-emerald-600", shadow: "shadow-emerald-500/30" },
  REPORT_TEMPLATE: { icon: FileText, gradient: "from-sky-400 to-indigo-500", shadow: "shadow-sky-500/30" },
  SYSTEM_CONFIG: { icon: SlidersHorizontal, gradient: "from-slate-400 to-indigo-600", shadow: "shadow-indigo-500/25" },
  DEPLOYMENT: { icon: Rocket, gradient: "from-orange-400 to-rose-500", shadow: "shadow-orange-500/30" },
  BACKUP_RESTORE: { icon: DatabaseBackup, gradient: "from-cyan-400 to-blue-600", shadow: "shadow-cyan-500/30" },
  TRAINING: { icon: GraduationCap, gradient: "from-yellow-400 to-amber-600", shadow: "shadow-amber-500/30" },
  DOCUMENT: { icon: BookOpen, gradient: "from-purple-400 to-fuchsia-600", shadow: "shadow-purple-500/30" },
  ENVIRONMENT: { icon: Layers, gradient: "from-emerald-400 to-cyan-600", shadow: "shadow-emerald-500/30" },
  FIREWALL: { icon: BrickWall, gradient: "from-red-400 to-orange-600", shadow: "shadow-red-500/30" },
  RESOURCE_UPGRADE: { icon: Gauge, gradient: "from-blue-400 to-violet-600", shadow: "shadow-blue-500/30" },
  CLOUD_RESOURCE: { icon: Cloud, gradient: "from-sky-400 to-cyan-600", shadow: "shadow-sky-500/30" },
  API_CREDENTIAL: { icon: KeySquare, gradient: "from-amber-400 to-yellow-600", shadow: "shadow-amber-500/30" },
  SECURITY_REVIEW: { icon: ShieldCheck, gradient: "from-emerald-400 to-green-600", shadow: "shadow-emerald-500/30" },
  ONBOARDING: { icon: UserPlus, gradient: "from-lime-400 to-green-600", shadow: "shadow-lime-500/30" },
  OFFBOARDING: { icon: UserMinus, gradient: "from-rose-400 to-red-600", shadow: "shadow-rose-500/30" },
  AWS_SERVER: { icon: Server, gradient: "from-amber-400 to-orange-500", shadow: "shadow-orange-500/30" },
  DATABASE: { icon: Database, gradient: "from-emerald-400 to-teal-500", shadow: "shadow-teal-500/30" },
  PUBLIC_IP_DOMAIN: { icon: Globe, gradient: "from-sky-400 to-blue-500", shadow: "shadow-blue-500/30" },
  ACCESS_ACCOUNT: { icon: KeyRound, gradient: "from-violet-400 to-purple-600", shadow: "shadow-violet-500/30" },
  SOFTWARE: { icon: AppWindow, gradient: "from-pink-400 to-rose-500", shadow: "shadow-rose-500/30" },
  OTHER: { icon: LifeBuoy, gradient: "from-slate-400 to-slate-600", shadow: "shadow-slate-500/25" },
  HARDWARE: { icon: Laptop, gradient: "from-indigo-400 to-blue-600", shadow: "shadow-indigo-500/30" },
  NETWORK_WORKPLACE: { icon: Cable, gradient: "from-cyan-400 to-sky-600", shadow: "shadow-cyan-500/30" },
  CONSULTATION: { icon: MessagesSquare, gradient: "from-fuchsia-400 to-pink-600", shadow: "shadow-fuchsia-500/30" },
};

const SIZE = {
  xs: { box: "h-6 w-6 rounded-md", icon: "h-3.5 w-3.5" },
  sm: { box: "h-8 w-8 rounded-lg", icon: "h-4 w-4" },
  md: { box: "h-10 w-10 rounded-xl", icon: "h-5 w-5" },
  lg: { box: "h-12 w-12 rounded-2xl", icon: "h-6 w-6" },
} as const;

export function TypeIcon({ type, size = "md" }: { type: RequestType; size?: keyof typeof SIZE }) {
  const { icon: Icon, gradient, shadow } = CONFIG[type];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center bg-linear-to-br text-white shadow-md ${gradient} ${shadow} ${SIZE[size].box}`}
      aria-hidden
    >
      <Icon className={SIZE[size].icon} strokeWidth={2} />
    </span>
  );
}
