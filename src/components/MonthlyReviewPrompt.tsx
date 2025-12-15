import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMonthlyReview } from "@/hooks/useMonthlyReview";
import { useLanguage } from "@/hooks/useLanguage";
import { Star } from "lucide-react";

type Props = {
  appVersion?: string;
};

export const MonthlyReviewPrompt: React.FC<Props> = ({ appVersion }) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { loading, shouldShow, reason, markPromptShown, snooze, optOut, submitReview } =
    useMonthlyReview();

  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!loading && shouldShow) {
      setOpen(true);
      markPromptShown();
    }
  }, [loading, shouldShow, markPromptShown]);

  const onSubmit = async () => {
    if (rating < 1) {
      toast({
        title: t("review.toast_need_rating_title"),
        description: t("review.toast_need_rating_desc"),
      });
      return;
    }
    await submitReview(rating, comment, appVersion);
    toast({
      title: t("review.toast_thanks_title"),
      description: t("review.toast_thanks_desc"),
    });
    setOpen(false);
  };

  const onSnooze = async () => {
    await snooze();
    toast({
      title: t("review.toast_snooze_title"),
      description: t("review.toast_snooze_desc"),
    });
    setOpen(false);
  };

  const onNever = async () => {
    await optOut();
    toast({
      title: t("review.toast_never_title"),
      description: t("review.toast_never_desc"),
    });
    setOpen(false);
  };

  if (loading || (!open && !shouldShow)) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{t("review.title")}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {reason === "first" ? t("review.subtitle_first") : t("review.subtitle_monthly")}
          </p>
        </DialogHeader>

        <div className="flex items-center gap-2 justify-center py-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(i)}
              className="p-1"
              aria-label={`${i} star`}
            >
              <Star
                className={`w-7 h-7 ${(hover || rating) >= i ? "fill-current" : "stroke-current"}`}
              />
            </button>
          ))}
        </div>

        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("review.placeholder")}
          className="min-h-[100px]"
        />

        <div className="flex flex-col sm:flex-row gap-2 justify-between pt-1">
          <div className="flex gap-2">
            <Button onClick={onSubmit}>{t("review.send")}</Button>
            <Button variant="secondary" onClick={onSnooze}>
              {t("review.remind_later")}
            </Button>
          </div>
          <button
            onClick={onNever}
            className="text-xs text-muted-foreground underline underline-offset-4"
          >
            {t("review.never")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
