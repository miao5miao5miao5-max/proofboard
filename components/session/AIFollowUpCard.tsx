"use client";

export interface AIFollowUpCardProps {
  question: string;
  hint?: string;
}

export function AIFollowUpCard({ question, hint }: AIFollowUpCardProps) {
  return (
    <div className="bg-primary-container p-6 rounded-2xl">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-on-primary-container text-xl">
            psychology
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-label-md uppercase text-on-primary-container/70 mb-2">
            AI Follow-up
          </p>
          <p className="text-title-lg text-on-primary-container">{question}</p>
          {hint && (
            <p className="text-body-md text-on-primary-container/80 mt-3 italic">
              Hint: {hint}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
