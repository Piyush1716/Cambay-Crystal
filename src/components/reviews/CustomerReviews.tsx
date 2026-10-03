import React, { useState, useEffect, useCallback } from "react";
import { Filter, MessageCircleQuestion, Sparkles, Loader2, ChevronDown } from "lucide-react";
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
  initialRating = 4.8,
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
          setTotalCount(res.data.totalCount ?? initialReviewsCount);
          setAvgRating(res.data.avgRating || initialRating);
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
    [productId, initialRating, initialReviewsCount, onlyPictures]
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
    <section className="py-10 max-w-7xl mx-auto px-4 lg:px-6">
      {/* ─── Top Section: Title & Summary Header ───────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-border/80">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Customer Reviews
          </h2>

          <div className="flex items-center gap-3 mt-2.5">
            <span className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {avgRating.toFixed(1)}
            </span>
            <div className="flex flex-col">
              <StarRating rating={avgRating} size="md" />
              <span className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {totalCount} {totalCount === 1 ? "review" : "reviews"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setReviewModalOpen(true)}
            className="px-6 py-2.5 rounded-full bg-[#c53030] text-white text-sm font-semibold hover:bg-[#b02828] transition-all shadow-sm hover:shadow active:scale-[0.98]"
          >
            Write a review
          </button>
          <a
            href="/contact"
            className="px-6 py-2.5 rounded-full border border-border bg-background hover:bg-secondary text-foreground text-sm font-medium transition-all"
          >
            Ask a question
          </a>
        </div>
      </div>

      {/* ─── Customer Photos Strip ────────────────────────────────────── */}
      {allPhotos.length > 0 && (
        <div className="py-2">
          <ReviewPhotoStrip photos={allPhotos} onPhotoClick={handleStripPhotoClick} />
        </div>
      )}

      {/* ─── Navigation Tabs & Filter Row ─────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border/80 mt-4 mb-2">
        {/* Tabs */}
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("reviews")}
            className={`py-3 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
              activeTab === "reviews"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Reviews ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("questions")}
            className={`py-3 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
              activeTab === "questions"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
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
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                onlyPictures
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-foreground/80 border-border hover:bg-secondary"
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
        <div className="divide-y divide-border/60">
          {loading && reviews.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center">
              <Loader2 className="w-7 h-7 animate-spin text-primary mb-2" />
              <p className="text-sm">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Sparkles className="w-10 h-10 text-primary/40 mx-auto" />
              <h4 className="text-base font-semibold text-foreground">No Reviews Yet</h4>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {onlyPictures
                  ? "No customer reviews with pictures found. Try switching off the picture filter."
                  : "Be the first verified customer to share your thoughts on this crystal!"}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(true)}
                  className="px-6 py-2.5 rounded-full bg-[#c53030] text-white text-xs sm:text-sm font-semibold hover:bg-[#b02828] transition shadow-sm"
                >
                  Write the first review
                </button>
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
                <div className="py-6 text-center">
                  <button
                    type="button"
                    disabled={loadingMore}
                    onClick={() => loadReviewsData(page + 1, true, onlyPictures)}
                    className="px-6 py-2.5 rounded-full border border-border bg-card hover:bg-secondary text-sm font-medium text-foreground transition inline-flex items-center gap-2"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span>Loading more...</span>
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
        <div className="py-16 text-center space-y-3">
          <MessageCircleQuestion className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <h4 className="text-base font-semibold text-foreground">Have a question?</h4>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Got a doubt regarding wrist sizing, stone authenticity, or cleansing? Ask our crystal experts.
          </p>
          <div className="pt-2">
            <a
              href="/contact"
              className="inline-block px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:bg-primary/90 transition shadow-sm"
            >
              Ask a Question
            </a>
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
