import { Ban, Check, Pause, X } from "lucide-react";
import { getT } from "@/lib/i18n-server";
import { NO_APPROVAL_STEP, PROGRESS_STEPS, getProgress, type RequestStatus } from "@/lib/status";

// Horizontal progress of a request: submitted → manager approval → IT working on it → done.
// `needsApproval` is false for requests that go straight to IT, which shows "No approval needed" on step 2.
export async function ProgressSteps({
  status,
  needsApproval,
  approved,
}: {
  status: RequestStatus;
  needsApproval: boolean;
  approved: boolean;
}) {
  const t = await getT();
  const progress = getProgress(status, !needsApproval || approved);

  return (
    <ol className="flex items-start" aria-label={t("ความคืบหน้าของคำขอ", "ຄວາມຄືບໜ້າຂອງຄຳຂໍ", "Request progress")}>
      {PROGRESS_STEPS.map((label, index) => {
        const done = index < progress.completed;
        const current = index === progress.current;
        const last = index === PROGRESS_STEPS.length - 1;
        const stepLabel = index === 1 && !needsApproval ? NO_APPROVAL_STEP : label;

        let node = "border-slate-200 bg-white text-slate-400";
        let icon = <span className="text-xs font-semibold">{index + 1}</span>;
        if (done) {
          node = "border-transparent bg-linear-to-br from-emerald-400 to-teal-500 text-white shadow-sm shadow-emerald-500/30";
          icon = <Check className="h-4 w-4" strokeWidth={3} aria-hidden />;
        }
        if (current) {
          if (progress.state === "failed") {
            node = "border-transparent bg-red-500 text-white shadow-sm shadow-red-500/30";
            icon = <X className="h-4 w-4" strokeWidth={3} aria-hidden />;
          } else if (progress.state === "cancelled") {
            node = "border-transparent bg-slate-400 text-white";
            icon = <Ban className="h-4 w-4" aria-hidden />;
          } else if (progress.state === "warning") {
            node = "border-transparent bg-amber-400 text-white shadow-sm shadow-amber-500/30";
            icon = <Pause className="h-4 w-4" aria-hidden />;
          } else {
            node = "border-transparent bg-linear-to-br from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/30 ring-4 ring-indigo-100";
            icon = <span className="text-xs font-semibold">{index + 1}</span>;
          }
        }

        const lineDone = index < progress.completed - 1;

        return (
          <li key={label.en} className={`relative flex flex-1 flex-col items-center text-center ${last ? "flex-none" : ""}`} aria-current={current ? "step" : undefined}>
            {!last && (
              <span
                className={`absolute top-4 left-1/2 h-0.5 w-full ${lineDone ? "bg-emerald-400" : "bg-slate-200"}`}
                aria-hidden
              />
            )}
            <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${node}`}>{icon}</span>
            <span className={`mt-2 px-1 text-[11px] leading-tight font-medium sm:text-xs ${done || current ? "text-slate-800" : "text-slate-400"}`}>
              {t(stepLabel)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
