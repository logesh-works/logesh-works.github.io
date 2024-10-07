// pages/index.tsx
"use client";
import React, { useState } from 'react';

const ImageView = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const images = [
    '/images/gal/1.jpg',
    '/images/gal/2.jpg',
    '/images/gal/3.jpg',
    '/images/gal/4.jpg',
    '/images/gal/5.jpg',
    '/images/gal/6.jpg',
    '/images/gal/7.jpg',
  ];

  const openImage = (image: string) => {
    setSelectedImage(image);
  };

  const closeImage = () => {
    setSelectedImage(null);
  };

  return (
    <div>
      <div className="gallery">
        {images.map((image, index) => (
          <div key={index} className="gallery-item" onClick={() => openImage(image)}>
            <img src={image} alt={`Gallery Image ${index + 1}`} />
          </div>
        ))}
      </div>

      {selectedImage && (
        <div className="modal" onClick={closeImage}>
          <img src={selectedImage} alt="Selected" className="modal-image" />
        </div>
      )}

      <style jsx>{`
        .gallery {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 10px;
          padding: 10px;
          margin-left:40px;
        }
        .gallery-item {
          cursor: pointer;
          overflow: hidden;
        }
        .gallery-item img {
          width: 100%;
          height: auto;
          border-radius: 8px;
          transition: transform 0.3s;
        }
        .gallery-item img:hover {
          transform: scale(1.05);
        }
        .modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal-image {
          max-width: 90%;
          max-height: 90%;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
};

export default ImageView;
