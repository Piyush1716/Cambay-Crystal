import React, { useState, useEffect } from "react";
import { X, Upload, CheckCircle2, AlertCircle, Loader2, ImagePlus } from "lucide-react";
import { StarRating } from "./StarRating";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { checkReviewEligibility, submitReview } from "@/services/api";
import { toast } from "sonner";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
  productName: string;
  onReviewSubmitted: () => void;
}

export function ReviewModal({
  isOpen,
  onClose,
  productId,
  productName,
  onReviewSubmitted,
}: ReviewModalProps) {
  const { user, session, isLoggedIn, showLoginModal } = useAuth();

  const [checking, setChecking] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [eligibilityMessage, setEligibilityMessage] = useState("");

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Check eligibility whenever modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (!isLoggedIn) {
      setChecking(false);
      setCanReview(false);
      setEligibilityMessage("Please sign in to your account to write a review.");
      return;
    }

    let isMounted = true;
    setChecking(true);

    checkReviewEligibility(productId, session?.access_token)
      .then((res) => {
        if (!isMounted) return;
        setChecking(false);
        if (res.data) {
          setCanReview(res.data.canReview);
          setAlreadyReviewed(res.data.alreadyReviewed);
          setEligibilityMessage(res.data.message);
        } else {
          // If endpoint is unreachable or table not migrated yet, allow submission attempt
          setCanReview(true);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setChecking(false);
        setCanReview(true);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, isLoggedIn, productId, session?.access_token]);

  if (!isOpen) return null;

  // Handle image upload to Supabase Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 4) {
      toast.error("You can upload a maximum of 4 photos");
      return;
    }

    setUploadingImage(true);
    const newUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds the 5MB size limit`);
        continue;
      }

      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `review-${productId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from("review-images")
          .upload(fileName, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          toast.error("Could not upload image. Please try again.");
          continue;
        }

        const { data: publicUrlData } = supabase.storage
          .from("review-images")
          .getPublicUrl(fileName);

        if (publicUrlData?.publicUrl) {
          newUrls.push(publicUrlData.publicUrl);
        }
      } catch (err) {
        console.error("Upload error:", err);
      }
    }

    setImages((prev) => [...prev, ...newUrls].slice(0, 4));
    setUploadingImage(false);
    // Reset file input
    e.target.value = "";
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token) {
      toast.error("Please sign in to submit your review");
      return;
    }

    if (!rating) {
      toast.error("Please select a star rating");
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitReview(
        {
          productId,
          rating,
          title: title.trim() || undefined,
          body: body.trim() || undefined,
          imageUrls: images,
        },
        session.access_token
      );

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Thank you! Your verified review has been published.");
        onReviewSubmitted();
        onClose();
        // Reset form
        setTitle("");
        setBody("");
        setImages([]);
        setRating(5);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80">
          <div>
            <h3 className="text-lg font-bold text-foreground">Write a Review</h3>
            <p className="text-xs text-muted-foreground line-clamp-1">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {checking ? (
            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-sm">Checking order verification...</p>
            </div>
          ) : !isLoggedIn ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-base">Sign In Required</h4>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                  Please log in with the account you used to order this product so we can verify your purchase.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    showLoginModal();
                  }}
                  className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition shadow-sm"
                >
                  Sign In
                </button>
              </div>
            </div>
          ) : alreadyReviewed ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-base">Already Reviewed</h4>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                  You have already submitted a review for this product. Thank you for your authentic feedback!
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 rounded-full border border-border text-foreground font-medium text-sm hover:bg-secondary transition"
                >
                  Close
                </button>
              </div>
            </div>
          ) : !canReview ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-base">Verified Buyers Only</h4>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
                  {eligibilityMessage ||
                    "Only customers who have ordered and received this product can write a review. This guarantees 100% genuine customer reviews on Cambay Crystal."}
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 rounded-full bg-secondary hover:bg-secondary/80 text-foreground font-medium text-sm transition"
                >
                  Understood
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Star Rating Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Overall Rating <span className="text-destructive">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <StarRating
                    rating={rating}
                    size="lg"
                    interactive
                    onRatingChange={(r) => setRating(r)}
                  />
                  <span className="text-sm font-medium text-foreground/80">
                    {rating === 5 && "Excellent"}
                    {rating === 4 && "Very Good"}
                    {rating === 3 && "Average"}
                    {rating === 2 && "Poor"}
                    {rating === 1 && "Terrible"}
                  </span>
                </div>
              </div>

              {/* Review Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Review Headline
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Packing was soo good, genuine crystals!"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  maxLength={100}
                />
              </div>

              {/* Review Body */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Your Review
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="What did you like or dislike? How does the energy of the crystal feel?"
                  rows={4}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition resize-none"
                  maxLength={1000}
                />
              </div>

              {/* Photos */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Add Photos (up to 4)
                  </label>
                  <span className="text-[11px] text-muted-foreground">{images.length}/4</span>
                </div>

                <div className="flex flex-wrap gap-2.5 items-center">
                  {images.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-border group"
                    >
                      <img src={url} alt="Upload preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-90 hover:opacity-100 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {images.length < 4 && (
                    <label className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-dashed border-border/80 hover:border-primary flex flex-col items-center justify-center cursor-pointer transition bg-secondary/30 hover:bg-secondary/60">
                      {uploadingImage ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      ) : (
                        <>
                          <ImagePlus className="w-5 h-5 text-muted-foreground mb-1" />
                          <span className="text-[10px] text-muted-foreground font-medium">Upload</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={uploadingImage}
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-full border border-border text-sm font-medium hover:bg-secondary transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="px-6 py-2.5 rounded-full bg-[#c53030] text-white text-sm font-semibold hover:bg-[#b02828] transition disabled:opacity-50 flex items-center gap-2 shadow-md shadow-red-900/10"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit Review
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
