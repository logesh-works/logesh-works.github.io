"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const images = [
  "/images/gal/1.JPG",
  "/images/gal/2.JPG",
  "/images/gal/3.JPG",
  "/images/gal/4.JPG",
  "/images/gal/5.jpg",
  "/images/gal/6.jpg",
  "/images/gal/7.jpg",
  "/images/gal/8.jpg",
];

const Gallery = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (selected !== null && !d.open) d.showModal();
    if (selected === null && d.open) d.close();
  }, [selected]);

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {images.map((src, i) => (
          <li key={src}>
            <button
              type="button"
              onClick={() => setSelected(i)}
              className="group relative block aspect-square w-full overflow-hidden rounded-xl border border-line/10 bg-panel"
            >
              <Image
                src={src}
                alt={`Memory ${i + 1}`}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                className="object-cover opacity-85 transition-[transform,opacity] duration-700 group-hover:scale-105 group-hover:opacity-100"
              />
              <span className="sr-only">Open image {i + 1}</span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        onClose={() => setSelected(null)}
        onClick={(e) => e.target === e.currentTarget && setSelected(null)}
        className="m-auto max-h-[90vh] max-w-[92vw] overflow-visible bg-transparent p-0 backdrop:bg-ink/90 backdrop:backdrop-blur-sm"
      >
        {selected !== null && (
          <div className="relative">
            <Image
              src={images[selected]}
              alt={`Memory ${selected + 1}`}
              width={1600}
              height={1200}
              sizes="92vw"
              className="h-auto max-h-[85vh] w-auto rounded-xl object-contain"
            />
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute right-3 top-3 rounded-full bg-ink/80 px-3 py-1.5 text-xs text-fg backdrop-blur"
            >
              Close
            </button>
          </div>
        )}
      </dialog>
    </>
  );
};

export default Gallery;
