/**
 * @fileoverview Training video constants for service providers
 * @source boombox-10.0/src/app/components/mover-account/bestpracticesvideogallery.tsx
 * @refactor Extracted video data into centralized constants file
 */

export type VideoCategory = 'Packing' | 'Transportation' | 'Onfleet';

export interface TrainingVideo {
  title: string;
  link: string;
  category: VideoCategory;
}

export const TRAINING_VIDEOS: TrainingVideo[] = [
  {
    title: 'How to Load a Boombox',
    link: 'https://www.youtube.com/watch?v=ydIu9mavAKA',
    category: 'Packing',
  },
  {
    title: 'How to Connect and Disconnect a U-Box Trailer',
    link: 'https://www.youtube.com/watch?v=0-KsDh2yrJU',
    category: 'Transportation',
  },
  {
    title: 'How to properly wrap a couch',
    link: 'https://www.youtube.com/watch?v=qZJ6lYbfVKo',
    category: 'Packing',
  },
  {
    title: 'Backing Up a Trailer',
    link: 'https://www.youtube.com/watch?v=9YkatTz_Qnw',
    category: 'Transportation',
  },
  {
    title: 'Best Practices Driving a Trailer',
    link: 'https://www.youtube.com/watch?v=_7pXQSuV_BE',
    category: 'Transportation',
  },
  {
    title: 'Getting Started With The Onfleet Driver App',
    link: 'https://www.youtube.com/watch?v=zeqNJ3GC3g0',
    category: 'Onfleet',
  },
];

export interface VideoFilterOption {
  value: 'all' | VideoCategory;
  label: string;
}

export const VIDEO_FILTER_OPTIONS: VideoFilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'Packing', label: 'Packing' },
  { value: 'Transportation', label: 'Transportation' },
  { value: 'Onfleet', label: 'Onfleet' },
];
