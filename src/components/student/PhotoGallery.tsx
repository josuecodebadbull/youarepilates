"use client";

import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

interface PhotoGalleryProps {
  photos: string[];
  alt: string;
  /** Class for the outer scroll strip — override to bleed edge-to-edge on a page
   * (e.g. "no-scrollbar -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4"). */
  className?: string;
  /** Class for each thumbnail button, controlling its size. */
  thumbClassName?: string;
}

const DEFAULT_STRIP_CLASSNAME = "no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto";
const DEFAULT_THUMB_CLASSNAME = "aspect-[4/3] w-[70%] shrink-0 snap-start overflow-hidden rounded-xl sm:w-[45%]";

/** A horizontal scroll-snap strip of thumbnails that opens a full-screen, swipeable
 * lightbox (with a thumbnail strip and photo counter) when tapped. */
export function PhotoGallery({ photos, alt, className, thumbClassName }: PhotoGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;

  return (
    <>
      <div className={className ?? DEFAULT_STRIP_CLASSNAME}>
        {photos.map((url, index) => (
          <button
            key={url}
            type="button"
            onClick={() => setOpenIndex(index)}
            className={thumbClassName ?? DEFAULT_THUMB_CLASSNAME}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={alt} className="h-full w-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>

      <PhotoLightbox
        photos={photos}
        alt={alt}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
      />
    </>
  );
}

/** Full-screen swipeable viewer. `index` is the open photo, or null when closed. */
export function PhotoLightbox({
  photos,
  alt,
  index,
  onClose,
}: {
  photos: string[];
  alt: string;
  index: number | null;
  onClose: () => void;
}) {
  return (
    <Lightbox
      open={index !== null}
      close={onClose}
      index={index ?? 0}
      slides={photos.map((src) => ({ src, alt }))}
      plugins={[Thumbnails, Counter]}
      counter={{ container: { style: { top: 0, bottom: "unset" } } }}
    />
  );
}
