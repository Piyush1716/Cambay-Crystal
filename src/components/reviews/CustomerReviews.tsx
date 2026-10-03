import React, { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { Filter, MessageCircleQuestion, Sparkles, Loader2, PenLine, HelpCircle } from "lucide-react";
import { StarRating } from "./StarRating";
import { ReviewPhotoStrip } from "./ReviewPhotoStrip";
import { ReviewCard } from "./ReviewCard";
import { ReviewModal } from "./ReviewModal";
import { PhotoLightboxModal } from "./PhotoLightboxModal";
import { fetchReviews, type ApiReview } from "@/services/api";

interface CustomerReviewsProps {
  productId: number;
  productName: string;
  initialRating?: number;
  initialReviewsCount?: number;
}

export function CustomerReviews({
  productId,
  productName,
  initialRating = 5.0,
  initialReviewsCount = 0,
}: CustomerReviewsProps) {
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [totalCount, setTotalCount] = useState<number>(initialReviewsCount);
  const [avgRating, setAvgRating] = useState<number>(initialRating);
  const [allPhotos, setAllPhotos] = useState<string[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  // Tabs & filters
  const [activeTab, setActiveTab] = useState<"reviews" | "questions">("reviews");
  const [onlyPictures, setOnlyPictures] = useState<boolean>(false);

  // Modals
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);

  // Load reviews from API
  const loadReviewsData = useCallback(
    async (targetPage = 1, append = false, filterPictures = onlyPictures) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const res = await fetchReviews(productId, targetPage, 10, filterPictures);
        if (res.data) {
          const fetchedReviews = res.data.reviews || [];
          setReviews((prev) => (append ? [...prev, ...fetchedReviews] : fetchedReviews));
          setTotalCount(res.data.totalCount ?? 0);
          setAvgRating(res.data.totalCount > 0 ? (res.data.avgRating || 0) : 0);
          setAllPhotos(res.data.allPhotos || []);
          setPage(res.data.page || 1);
          setTotalPages(res.data.totalPages || 1);
        }
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [productId, onlyPictures]
  );

  useEffect(() => {
    loadReviewsData(1, false, onlyPictures);
  }, [productId, onlyPictures, loadReviewsData]);

  // Open Lightbox from strip or card
  const handlePhotoClick = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleStripPhotoClick = (index: number) => {
    handlePhotoClick(allPhotos, index);
  };

  return (
    <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 lg:px-6">
      {/* ─── Top Section: Title & Summary Header ───────────────────────── */}
      <div className="bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-xs mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-border/70">
          <div>
            <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-primary mb-1.5 font-medium">
              Customer Feedback
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
              Customer Reviews
            </h2>

            <div className="flex items-center gap-3 mt-3">
              <span className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                {totalCount > 0 ? avgRating.toFixed(1) : "0.0"}
              </span>
              <div className="flex flex-col">
                <StarRating rating={totalCount > 0 ? avgRating : 0} size="md" />
                <span className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-normal">
                  {totalCount} {totalCount === 1 ? "review" : "reviews"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons following site theme */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setReviewModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all shadow-sm active:scale-[0.98]"
            >
              <PenLine className="w-4 h-4" />
              Write a review
            </button>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground text-sm font-medium transition-all active:scale-[0.98]"
            >
              <HelpCircle className="w-4 h-4" />
              Ask a question
            </Link>
          </div>
        </div>

        {/* ─── Customer Photos Strip ────────────────────────────────────── */}
        {allPhotos.length > 0 && (
          <div className="pt-2">
            <ReviewPhotoStrip photos={allPhotos} onPhotoClick={handleStripPhotoClick} />
          </div>
        )}
      </div>

      {/* ─── Navigation Tabs & Filter Row ─────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border mb-6">
        {/* Tabs */}
        <div className="flex items-center gap-8">
          <button
            type="button"
            onClick={() => setActiveTab("reviews")}
            className={`py-3.5 text-sm sm:text-base whitespace-nowrap border-b-2 -mb-px transition-colors ${
              activeTab === "reviews"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground font-medium"
            }`}
          >
            Reviews ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("questions")}
            className={`py-3.5 text-sm sm:text-base whitespace-nowrap border-b-2 -mb-px transition-colors ${
              activeTab === "questions"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground font-medium"
            }`}
          >
            Questions (0)
          </button>
        </div>

        {/* Filters */}
        {activeTab === "reviews" && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOnlyPictures(!onlyPictures)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                onlyPictures
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-background text-foreground/80 border-border hover:border-primary/50 hover:bg-secondary/40"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Only Pictures</span>
            </button>
          </div>
        )}
      </div>

      {/* ─── Tab Content ──────────────────────────────────────────────── */}
      {activeTab === "reviews" ? (
        <div className="space-y-4">
          {loading && reviews.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-sm font-medium">Loading reviews…</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-card rounded-3xl p-10 sm:p-14 text-center border border-border space-y-4">
              <div className="w-14 h-14 rounded-full bg-secondary text-primary flex items-center justify-center mx-auto">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-foreground">No Reviews Yet</h4>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                  {onlyPictures
                    ? "No customer reviews with pictures found. Try switching off the picture filter."
                    : "Be the first verified customer to share your experience with this crystal!"}
                </p>
              </div>
              <div className="pt-2">
                {onlyPictures ? (
                  <button
                    type="button"
                    onClick={() => setOnlyPictures(false)}
                    className="px-6 py-2.5 rounded-full bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium transition shadow-xs"
                  >
                    Show all reviews
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(true)}
                    className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition shadow-sm"
                  >
                    Write the first review
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {reviews.map((rev) => (
                <ReviewCard
                  key={rev.id}
                  review={rev}
                  onImageClick={(imgs, idx) => handlePhotoClick(imgs, idx)}
                />
              ))}

              {/* Load More Button */}
              {page < totalPages && (
                <div className="py-8 text-center">
                  <button
                    type="button"
                    disabled={loadingMore}
                    onClick={() => loadReviewsData(page + 1, true, onlyPictures)}
                    className="px-8 py-3 rounded-full border border-border bg-card hover:bg-secondary text-sm font-medium text-foreground transition inline-flex items-center gap-2 shadow-xs"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span>Loading more…</span>
                      </>
                    ) : (
                      <span>Load more reviews</span>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* Questions tab */
        <div className="bg-card rounded-3xl p-10 sm:p-14 text-center border border-border space-y-4">
          <div className="w-14 h-14 rounded-full bg-secondary text-primary flex items-center justify-center mx-auto">
            <MessageCircleQuestion className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-foreground">Have a question about this item?</h4>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
              Have doubts about bead sizing, gemstone authenticity, or cleansing? Ask our crystal healing team directly.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/contact"
              className="inline-block px-7 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition shadow-sm"
            >
              Contact Support
            </Link>
          </div>
        </div>
      )}

      {/* ─── Modals ───────────────────────────────────────────────────── */}
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        productId={productId}
        productName={productName}
        onReviewSubmitted={() => loadReviewsData(1, false, onlyPictures)}
      />

      <PhotoLightboxModal
        isOpen={lightboxOpen}
        images={lightboxImages}
        currentIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={(newIndex) => setLightboxIndex(newIndex)}
      />
    </section>
  );
}
