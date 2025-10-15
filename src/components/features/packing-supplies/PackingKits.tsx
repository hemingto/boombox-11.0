/**
 * @fileoverview Packing supplies kit selector component with horizontal scroll
 * @source boombox-10.0/src/app/components/packing-supplies/packingkits.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays horizontal scrollable gallery of packing supply kits (Apartment, 1-2 Bedroom, 3-4 Bedroom).
 * Each kit shows pricing, description, and includes a modal for detailed item breakdown.
 * Allows users to add entire kit to cart with a single click.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced InformationalPopup with Modal component (per user preference)
 * - Replaced emerald-500/emerald-100 with status-success/status-bg-success for free delivery badge
 * - Replaced slate-100/slate-200 with surface-tertiary/surface-disabled for navigation buttons
 * - Replaced zinc-950/zinc-800/zinc-700 with primary/primary-hover/primary-active for Add to Cart button
 * - Replaced slate-100 with surface-tertiary for card background
 * - Maintained gradient overlays for image cards (black with opacity)
 * 
 * @refactor Replaced InformationalPopup with Modal, applied design system colors, preserved scroll functionality
 */

'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/20/solid';
import { Modal } from '@/components/ui/primitives/Modal/Modal';

interface PackingKit {
  title: string;
  price: string;
  description: string;
  detailedDescription: string;
  imageSrc: string;
  items: CartItem[];
}

interface CartItem {
  name: string;
  quantity: number;
  price: number;
}

interface PackingKitsProps {
  /** Function to add items to cart */
  onAddToCart: (items: CartItem[]) => void;
}

export const PackingKits: React.FC<PackingKitsProps> = ({ onAddToCart }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [itemWidth, setItemWidth] = useState(300 + 16); // width + gap
  const [activeModalKit, setActiveModalKit] = useState<PackingKit | null>(null);

  // Calculate item width for scroll functionality
  useEffect(() => {
    const updateItemWidth = () => {
      if (scrollContainerRef.current) {
        const firstItem = scrollContainerRef.current.querySelector('#item-container > div');
        if (firstItem) {
          const width = firstItem.getBoundingClientRect().width;
          setItemWidth(width + 16); // width + gap
        }
      }
    };

    updateItemWidth();
    window.addEventListener('resize', updateItemWidth);
    return () => window.removeEventListener('resize', updateItemWidth);
  }, []);

  const scrollToItem = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const offset = direction === 'left' ? -itemWidth : itemWidth;
      const nearestIndex = Math.round(scrollLeft / itemWidth);
      const newScrollPosition = nearestIndex * itemWidth + offset;
      scrollContainerRef.current.scrollTo({ left: newScrollPosition, behavior: 'smooth' });
    }
  };

  const handleScrollLeft = () => scrollToItem('left');
  const handleScrollRight = () => scrollToItem('right');

  const openModal = (kit: PackingKit) => {
    setActiveModalKit(kit);
  };

  const closeModal = () => {
    setActiveModalKit(null);
  };

  const handleAddToCartFromModal = (kit: PackingKit) => {
    onAddToCart(kit.items);
    closeModal();
  };

  // Sample packing kits with their respective items
  const packingKits: PackingKit[] = [
    {
      title: 'Apartment Kit',
      price: '$197',
      description: 'studio or small moving project',
      detailedDescription:
        'This kit is perfect for a studio or small moving project. It includes a variety of boxes, packing materials, and moving supplies to help you pack and move your belongings safely and efficiently.',
      imageSrc: '/img/golden-gate.png',
      items: [
        { name: 'Medium Box', quantity: 5, price: 3.15 },
        { name: 'Large Box', quantity: 10, price: 4.15 },
        { name: 'Packing Paper', quantity: 1, price: 25 },
        { name: 'Mattress Cover', quantity: 1, price: 15 },
        { name: 'Bubble Wrap', quantity: 1, price: 20.25 },
        { name: 'Moving Blanket', quantity: 1, price: 40 },
        { name: 'Packing Tape', quantity: 1, price: 15 },
        { name: 'Stretch Wrap', quantity: 1, price: 24.23 },
      ],
    },
    {
      title: '1-2 Bedroom Kit',
      price: '$348',
      description: 'one to two bedroom house/apt',
      detailedDescription:
        'This kit is perfect for a one to two bedroom house or apartment. It includes a variety of boxes, packing materials, and moving supplies to help you pack and move your belongings safely and efficiently.',
      imageSrc: '/img/mountain-view.png',
      items: [
        { name: 'Small Box', quantity: 2, price: 2.15 },
        { name: 'Medium Box', quantity: 5, price: 3.15 },
        { name: 'Large Box', quantity: 10, price: 4.15 },
        { name: 'Wardrobe Box', quantity: 1, price: 22.25 },
        { name: 'Bubble Wrap', quantity: 2, price: 20.25 },
        { name: 'Packing Tape', quantity: 1, price: 15 },
        { name: 'Moving Blanket', quantity: 3, price: 40 },
        { name: 'Packing Paper', quantity: 1, price: 25 },
        { name: 'Mattress Cover', quantity: 1, price: 15 },
        { name: 'Stretch Wrap', quantity: 2, price: 24.23 },
      ],
    },
    {
      title: '3-4 Bedroom Kit',
      price: '$521',
      description: 'three to four bedroom household',
      detailedDescription:
        'This kit is perfect for a three to four bedroom household. It includes a variety of boxes, packing materials, and moving supplies to help you pack and move your belongings safely and efficiently.',
      imageSrc: '/img/palo-alto.png',
      items: [
        { name: 'Small Box', quantity: 5, price: 2.15 },
        { name: 'Medium Box', quantity: 10, price: 3.15 },
        { name: 'Large Box', quantity: 20, price: 4.15 },
        { name: 'Wardrobe Box', quantity: 1, price: 22.25 },
        { name: 'Moving Blanket', quantity: 4, price: 40 },
        { name: 'Bubble Wrap', quantity: 2, price: 20.25 },
        { name: 'Packing Tape', quantity: 2, price: 15 },
        { name: 'Packing Paper', quantity: 1, price: 25 },
        { name: 'Mattress Cover', quantity: 3, price: 15 },
        { name: 'Stretch Wrap', quantity: 3, price: 24.23 },
      ],
    },
  ];

  return (
    <div className="mb-12">
      <div className="flex flex-col sm:flex-row w-full lg:px-16 px-6 justify-between items-left sm:items-center mb-4">
        <div className="flex items-center">
          <h2 className="text-left text-4xl font-semibold">Packing Supplies</h2>
          <div
            className="flex text-status-text-success font-semibold bg-status-bg-success rounded-full px-3 py-2 ml-2 text-nowrap shrink-0"
            role="status"
            aria-label="Free delivery available"
          >
            <p className="text-xs text-status-text-success">Free delivery</p>
          </div>
        </div>
        <div className="flex mt-4 sm:mt-0">
          <button
            onClick={handleScrollLeft}
            className="rounded-full bg-surface-tertiary active:bg-surface-disabled cursor-pointer p-2 mr-1"
            aria-label="Scroll left to view previous packing kits"
          >
            <ArrowLeftIcon className="w-6" aria-hidden="true" />
          </button>
          <button
            onClick={handleScrollRight}
            className="rounded-full bg-surface-tertiary active:bg-surface-disabled cursor-pointer p-2"
            aria-label="Scroll right to view next packing kits"
          >
            <ArrowRightIcon className="w-6" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        id="scroll-container"
        className="w-full overflow-x-auto hide-scrollbar"
        ref={scrollContainerRef}
        tabIndex={0}
        role="region"
        aria-label="Packing kits gallery"
      >
        <div id="item-container" className="lg:px-16 px-6 py-4 flex gap-4 flex-nowrap">
          {packingKits.map((kit, index) => (
            <article
              key={index}
              className="relative bg-surface-tertiary w-[300px] h-[300px] sm:w-[550px] sm:h-[350px] rounded-md flex-none transform transition-transform duration-300 sm:hover:scale-[102%] cursor-pointer"
            >
              <Image
                src={kit.imageSrc}
                alt={`${kit.title} packing supplies kit`}
                layout="fill"
                objectFit="cover"
                className="rounded-md"
              />
              <div className="absolute w-full p-4">
                <div
                  className="absolute inset-0 bg-gradient-to-b from-black to-transparent rounded-md opacity-60 top-0 rounded-md z-10"
                  aria-hidden="true"
                ></div>
                <p className="relative font-semibold text-lg text-white -mb-1 z-20">
                  {kit.price}
                </p>
                <h3 className="relative text-white z-20">{kit.title}</h3>
                <p className="relative text-white text-xs z-20">{kit.description}</p>
              </div>
              <div className="absolute z-10 bottom-0 p-4 w-full">
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black to-transparent rounded-md opacity-60 top-0 rounded-md z-10"
                  aria-hidden="true"
                ></div>
                <div className="relative flex gap-2 items-center mt-4 z-20">
                  <button
                    onClick={() => onAddToCart(kit.items)}
                    className="py-2 px-4 font-semibold bg-white text-primary text-sm rounded-md hover:bg-surface-tertiary active:bg-surface-disabled font-inter"
                    aria-label={`Add ${kit.title} to cart for ${kit.price}`}
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={() => openModal(kit)}
                    className="text-sm text-white underline decoration-dotted underline-offset-4"
                    aria-label={`View more details about ${kit.title}`}
                  >
                    More Details
                  </button>
                </div>
              </div>
            </article>
          ))}
          <div
            className="bg-transparent lg:w-[48px] w-[8px] h-[300px] sm:h-[350px] flex-none"
            aria-hidden="true"
          ></div>
        </div>
      </div>

      {/* Modal for kit details */}
      {activeModalKit && (
        <Modal
          open={!!activeModalKit}
          onClose={closeModal}
          title={activeModalKit.title}
          size="xl"
          showCloseButton={true}
          closeOnOverlayClick={true}
        >
          <div className="flex gap-4">
            {/* Image */}
            <div className="hidden sm:block relative shrink-0 w-44 h-44 aspect-square bg-surface-tertiary rounded-md">
              <Image
                src={activeModalKit.imageSrc}
                alt={`${activeModalKit.title} packing supplies kit`}
                layout="fill"
                objectFit="cover"
                className="rounded-md"
              />
            </div>

            {/* Description */}
            <div>
              <div className="mb-4 leading-5">{activeModalKit.detailedDescription}</div>
            </div>
          </div>

          {/* Items Included Section */}
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-2">Items Included</h3>
            <ul className="list-disc pl-5">
              {activeModalKit.items.map((item, index) => (
                <li key={index}>
                  {item.quantity}x {item.name}
                </li>
              ))}
            </ul>
          </div>

          {/* Total and Add to Cart */}
          <div className="mt-8 flex justify-between items-center">
            <h2 className="font-semibold text-lg">Total</h2>
            <div className="flex gap-4 items-center">
              <h2 className="font-semibold text-lg">{activeModalKit.price}</h2>
              <button
                onClick={() => handleAddToCartFromModal(activeModalKit)}
                className="py-2.5 px-6 font-semibold bg-primary text-text-inverse text-sm rounded-md hover:bg-primary-hover active:bg-primary-active font-inter"
                aria-label={`Add ${activeModalKit.title} to cart for ${activeModalKit.price}`}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </Modal>
      )}

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};


