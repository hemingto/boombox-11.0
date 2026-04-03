'use client';

import React from 'react';
import { AccordionContainer } from '@/components/ui/primitives/Accordion/AccordionContainer';
import { cn } from '@/lib/utils/cn';
import type { CategoryFaq } from '@/data/categoryPages';

export interface CategoryFaqSectionProps {
  faqs: CategoryFaq[];
  className?: string;
}

export function CategoryFaqSection({
  faqs,
  className,
}: CategoryFaqSectionProps) {
  const accordionData = faqs.map(faq => ({
    question: faq.question,
    answer: faq.answer,
    category: '',
    image: '',
  }));

  return (
    <section
      className={cn(
        'md:flex bg-surface-tertiary mt-14 lg:px-16 px-6 py-24',
        className
      )}
      aria-labelledby="category-faq-title"
    >
      <div className="basis-2/5 pt-6">
        <h2
          id="category-faq-title"
          className="mb-10 py-4 mr-6 text-4xl sm:text-5xl font-semibold"
        >
          Frequently asked questions
        </h2>
      </div>

      <div className="flex place-content-end basis-3/5">
        <div className="w-full">
          <AccordionContainer
            data={accordionData}
            onAccordionChange={() => {}}
            defaultOpenIndex={null}
            ariaLabel="Frequently asked questions about this storage service"
          />
        </div>
      </div>
    </section>
  );
}
