/**
 * @fileoverview Training video constants for service providers
 * @source boombox-10.0/src/app/components/mover-account/bestpracticesvideogallery.tsx
 * @refactor Extracted video data into centralized constants file
 */

export interface TrainingVideo {
  title: string;
  link: string;
  category: 'Packing' | 'Transportation';
}

export const TRAINING_VIDEOS: TrainingVideo[] = [
  {
    title: 'How to Load a Boombox',
    link: 'https://www.youtube.com/watch?v=ydIu9mavAKA&t=79s',
    category: 'Packing',
  },
  {
    title: 'How to Connect and Disconnect a U-Box Trailer',
    link: 'https://www.youtube.com/watch?v=0-KsDh2yrJU&t=47s',
    category: 'Transportation',
  },
  {
    title: 'How to properly wrap a couch',
    link: 'https://www.youtube.com/watch?v=qZJ6lYbfVKo',
    category: 'Packing',
  },
  {
    title: 'Best Practices for Moving Furniture',
    link: 'https://www.youtube.com/watch?v=example4',
    category: 'Packing',
  },
  {
    title: 'How to Use Moving Blankets Effectively',
    link: 'https://www.youtube.com/watch?v=example5',
    category: 'Packing',
  },
  {
    title: 'Backing Up a Trailer',
    link: 'https://www.youtube.com/watch?v=9YkatTz_Qnw',
    category: 'Packing',
  },
  {
    title: 'Best Practices Driving a Trailer',
    link: 'https://www.youtube.com/watch?v=_7pXQSuV_BE',
    category: 'Transportation',
  },
];

export interface VideoFilterOption {
  value: 'all' | 'Packing' | 'Transportation';
  label: string;
}

export const VIDEO_FILTER_OPTIONS: VideoFilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'Packing', label: 'Packing' },
  { value: 'Transportation', label: 'Transportation' },
];

