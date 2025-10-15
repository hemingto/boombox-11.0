/**
 * @fileoverview Storage guidelines data for the storage guidelines page
 * @source boombox-10.0/src/app/components/storage-guidelines/storageguidelineslist.tsx (inline data)
 * @refactor Extracted storage guidelines data to centralized data folder for better maintainability
 */

import React from 'react';

/**
 * Storage guideline interface
 */
export interface StorageGuideline {
  number: number;
  title: string;
  description: React.ReactNode;
}

/**
 * Storage guidelines data for Boombox storage service
 * 
 * Contains all rules and best practices for using Boombox storage containers:
 * - Minimum storage terms
 * - Size and packing requirements
 * - Safety restrictions
 * - Driver responsibilities
 */
export const storageGuidelines: StorageGuideline[] = [
  {
    number: 1,
    title: 'Storage terms are a minimum of 2 months',
    description: (
      <p>All storage terms are a minimum of two months. You can access your items before the 2 month term, however you will be charged for a full two months of storage.</p>
    ),
  },
  {
    number: 2,
    title: 'All items must fit into your Boombox storage container',
    description: (
      <>
        <p className="mb-2">All items need to fit into our standard 5x8 Boombox storage container. The door to your unit must be able to close properly. If the door is unable to be properly closed you must remove the stored item that is preventing the door from closing.</p>
        <p>If you are unsure if one of your storage items will fit please reach out at our Help Center.</p>
      </>
    ),
  },
  {
    number: 3,
    title: 'Pack Smart',
    description: (
      <>
        <p className="mb-4">We&apos;ll always handle your stuff with care, but you&apos;re responsible for ensuring your Boombox is packed properly. Please keep in mind the following to ensure your Boombox is properly packed:</p>
        <p className="mb-2"><span className="font-bold">1. Organize Your Items into Tiers:</span> Think of each tier as a wall or stack within the container, starting with the heaviest items at the bottom and lighter items on top. This method helps maintain balance and stability during transit.</p>
        <p className="mb-2"><span className="font-bold">2. Strategize Your Loading Process:</span> Begin your loading at the back of the container and move forward. The base of each tier, composed of your sturdiest items like dressers or desks, should support the weight of the items above.</p>
        <p className="mb-2"><span className="font-bold">3. Distribute Weight Evenly:</span> Place heavy items around the base of the container to evenly distribute weight, ensuring a stable and secure load.</p>
        <p className="mb-4"><span className="font-bold">4. Fill Gaps and Protect Items:</span> Utilize soft materials like furniture pads, blankets, and pillows to fill spaces between items, preventing shifts and scratches. Disassemble furniture to save space and wrap each piece to protect from damage.</p>
        <p className="mb-2">Although not required, it is best practice that you disassemble furniture items (bed frames, tables) before loading them into your Boombox container. You&apos;ll ensure your items are transported safely while also freeing up space to pack more items.</p>
        <p className="mb-2">If you plan on storing a mattress, we strongly recommend you cover it in a mattress cover. We can take mattresses without a cover, but it is best practice to keep mattresses covered to prevent damage over time.</p>
      </>
    ),
  },
  {
    number: 4,
    title: 'Inform us about heavy items or difficult moving conditions',
    description: (
      <>
        <p className="mb-2">If you&apos;re storing items heavier than 50 pounds, give your moving crew a heads up to ensure they&apos;re ready for your larger pieces. For anything over 150lbs, please inform us. Each Boombox container can hold up to 2000lbs, and we can&apos;t transport containers exceeding this weight.</p>
        <p>Also, if you&apos;re moving from a hard-to-reach spot (like a 10th floor apartment), or if you&apos;re in a busy area with limited parking, let us know in advance so we can plan accordingly.</p>
      </>
    ),
  },
  {
    number: 5,
    title: "Don't store anything that's illegal and/or unsafe",
    description: (
      <>
        <p className="mb-2">The safety of our employees, our customers, and all of their belongings always comes first. The following items are banned from being stored in Boombox:</p>
        <p className="mb-2">Anything that goes boom, such as guns (or weapons of any kind), explosives, fireworks, and other flammables like gas, oil, kerosene, paint, and lighter fluid. Anything that is or was alive. This includes things like fruit, meats, cheeses, animals, insects, fungal or bacterial cultures, etc. Anything that is (or was) edible. This includes any perishable and non-perishable food items. Anything that&apos;s illegal, such as drugs, drug paraphernalia, stolen property, and anything else that you can get arrested for possessing. Anything that smells, oozes, leaks, or bursts, such as hazardous items, toxic materials, items that produce gas or odors, any container with liquids, items that produce loud or disruptive noises, and items that may increase in size or burst. Basically, anything that might get outside of your box or bin and harm others, our customers&apos; and employees&apos; belongings, or our storage facility.</p>
      </>
    ),
  },
  {
    number: 6,
    title: 'Your Boombox Driver is not allowed to help load your storage unit',
    description: (
      <>
        <p className="mb-2">Although we want to be as helpful as possible, Boombox drivers are not insured or licensed to help load your items into your storage unit.</p>
        <p className="mb-2">They should not be expected help load your items and are there only to transport your container once your unit is loaded. They&apos;ll make sure your unit is parked in a safe space for loading and give you access to moving supplies, however, they aren&apos;t allowed to assist in the loading process.</p>
        <p className="mb-2">If a Boombox Driver, assists with loading your items no damages to your items or building are covered under our insurance coverage.</p>
        <p>If you need moving help please add it to your order and you&apos;ll be matched with a local pro.</p>
      </>
    ),
  },
];

