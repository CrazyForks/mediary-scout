"use client";

import { Layers, LoaderCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { requestSeriesAction, type RequestTrackingActionResult } from "../app/actions";

export function RequestSeriesButton({ candidateId }: { candidateId: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<RequestTrackingActionResult | null>(null);
  const isLocked =
    result?.status === "requested" ||
    result?.status === "already_tracked" ||
    result?.status === "active_workflow";

  return (
    <button
      className="primary-button series-button"
      type="button"
      title={result?.message ?? "获取全部季"}
      disabled={isPending || isLocked}
      onClick={() => {
        startTransition(async () => {
          setResult(await requestSeriesAction({ candidateId }));
        });
      }}
    >
      {isPending || isLocked ? (
        <LoaderCircle size={14} className="spin" aria-hidden />
      ) : (
        <Layers size={14} aria-hidden />
      )}
      {isLocked ? "已请求" : "获取全剧"}
    </button>
  );
}
