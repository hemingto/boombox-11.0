/**
 * @fileoverview PaymentInvoices component - Payment history with filtering and pagination
 * @source boombox-10.0/src/app/components/user-page/paymentinvoices.tsx
 * @refactored Following REFACTOR_PRD.md and component-migration-checklist.md
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays payment history with invoice/receipt viewing
 * - Filtering by status (all, outstanding, paid) and date (newest, oldest)
 * - Pagination for large payment lists
 * - Integration with Stripe invoice/receipt PDFs
 * 
 * API ROUTES UPDATED:
 * - Old: /api/stripe/get-payment-history → New: /api/payments/payment-history
 * - Old: /api/stripe/get-invoice-pdf → New: /api/payments/invoice-pdf
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with semantic tokens
 * - Used skeleton primitives for loading states
 * - Applied design system badge classes
 */

'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { SkeletonCard, SkeletonText } from '@/components/ui/primitives/Skeleton';
import { BanknotesIcon } from '@heroicons/react/24/outline';

interface Invoice {
 id: string;
 status: 'Paid' | 'Outstanding';
 dueDate: string;
 last4: string;
 cardBrand: string;
 title: string;
 amount: string;
 hasInvoice: boolean;
 invoiceId: string | null;
 type: 'invoice' | 'payment';
}

export interface PaymentInvoicesProps {
 userId: string;
}

const filterOptions = [
 { value: 'all', label: 'All' },
 { value: 'outstanding', label: 'Outstanding' },
 { value: 'paid', label: 'Paid' },
 { value: 'newest', label: 'Most Recent' },
 { value: 'oldest', label: 'Oldest' },
];

// Helper function to format card brand names
const formatCardBrand = (brand: string): string => {
 const brandMap: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  american_express: 'Amex',
  discover: 'Discover',
  diners: 'Diners',
  diners_club: 'Diners',
  jcb: 'JCB',
  unionpay: 'UnionPay',
 };
 
 return brandMap[brand.toLowerCase()] || 'Card';
};

/**
 * PaymentInvoices - Payment history with filtering and pagination
 * 
 * Features:
 * - Payment history display
 * - Status filtering (paid/outstanding)
 * - Date sorting (newest/oldest)
 * - Pagination
 * - Invoice/receipt viewing
 */
export const PaymentInvoices: React.FC<PaymentInvoicesProps> = ({ userId }) => {
 const [invoices, setInvoices] = useState<Invoice[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [currentPage, setCurrentPage] = useState(1);
 const [selectedFilter, setSelectedFilter] = useState('all');
 const [isFilterOpen, setIsFilterOpen] = useState(false);
 const itemsPerPage = 5;
 const filterRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
  const fetchPaymentHistory = async () => {
   try {
    setIsLoading(true);
    const response = await fetch(`/api/payments/payment-history?userId=${userId}`);
    
    if (!response.ok) {
     throw new Error('Failed to fetch payment history');
    }
  
    const data = await response.json();
  
    const formattedInvoices = data.map((payment: any) => ({
     id: payment.id,
     status: payment.status,
     dueDate: payment.dueDate,
     last4: payment.last4 || '4242',
     cardBrand: payment.cardBrand || 'card',
     title: payment.title || 'Payment',
     amount: typeof payment.amount === 'number' ? `$${payment.amount}` : payment.amount,
     hasInvoice: payment.hasInvoice || false,
     invoiceId: payment.invoiceId || null,
     type: payment.type || 'payment'
    }));
  
    setInvoices(formattedInvoices);
   } catch (error) {
    console.error('Error:', error);
    setError('Failed to load payment history');
   } finally {
    setIsLoading(false);
   }
  };
 
  if (userId) {
   fetchPaymentHistory();
  }
 }, [userId]);

 const filteredInvoices = useMemo(() => {
  let filtered = [...invoices];
 
  switch (selectedFilter) {
   case 'outstanding':
    filtered = filtered.filter((invoice) => invoice.status === 'Outstanding');
    break;
   case 'paid':
    filtered = filtered.filter((invoice) => invoice.status === 'Paid');
    break;
   case 'newest':
    filtered.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
    break;
   case 'oldest':
    filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    break;
   case 'all':
   default:
    break;
  }
 
  return filtered;
 }, [invoices, selectedFilter]);

 const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
 const startIndex = (currentPage - 1) * itemsPerPage;
 const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + itemsPerPage);

 const handlePreviousPage = () => {
  if (currentPage > 1) setCurrentPage(currentPage - 1);
 };

 const handleNextPage = () => {
  if (currentPage < totalPages) setCurrentPage(currentPage + 1);
 };

 const handleFilterChange = (option: string) => {
  setSelectedFilter(option);
  setCurrentPage(1);
  setIsFilterOpen(false);
 };

 const handleViewInvoice = async (invoice: Invoice) => {
  try {
   const type = invoice.hasInvoice ? 'invoice' : 'payment';
   const response = await fetch(`/api/payments/invoice-pdf?paymentIntentId=${invoice.id}&type=${type}`);
   
   if (!response.ok) {
    throw new Error(`Failed to fetch ${type === 'invoice' ? 'invoice PDF' : 'payment receipt'}`);
   }

   const data = await response.json();
   
   if (data.url) {
    window.open(data.url, '_blank');
   }
  } catch (error) {
   console.error('Error viewing invoice/receipt:', error);
  }
 };

 useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
   if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
    setIsFilterOpen(false);
   }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => {
   document.removeEventListener('mousedown', handleClickOutside);
  };
 }, []);

 if (isLoading) {
  return (
   <div className="max-w-5xl lg:px-16 px-6 mx-auto">
    <h2 className="text-2xl mb-4 text-text-primary">Payment history</h2>
    <div className="space-y-4">
     {[1, 2, 3].map((i) => (
      <SkeletonCard key={i} className="p-4">
       <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
         <div className="w-14 h-14 bg-surface-tertiary rounded-md animate-pulse" />
         <div className="space-y-2">
          <SkeletonText className="w-40" />
          <SkeletonText className="w-24" />
         </div>
        </div>
        <div className="flex items-center space-x-4">
         <div className="h-8 w-20 bg-surface-tertiary rounded-md animate-pulse" />
         <SkeletonText className="w-16" />
        </div>
       </div>
      </SkeletonCard>
     ))}
    </div>
   </div>
  );
 }

 if (error) {
  return (
   <div className="max-w-5xl lg:px-16 px-6 mx-auto">
    <h2 className="text-2xl mb-4 text-text-primary">Payment history</h2>
    <div className="bg-status-bg-error p-3 mb-4 border border-border-error rounded-md max-w-fit">
     <p className="text-sm text-status-error">{error}</p>
    </div>
   </div>
  );
 }

 if (!isLoading && invoices.length === 0) {
  return (
   <div className="max-w-5xl lg:px-16 px-6 mx-auto">
    <h2 className="text-2xl mb-4 text-text-primary">Payment history</h2>
    <div
          className="bg-white rounded-md p-8 text-center"
          role="status"
          aria-live="polite"
        >
          <BanknotesIcon
            className="w-12 h-12 mx-auto text-text-secondary mb-4"
            aria-hidden="true"
          />
     <p className="text-text-tertiary">No payment history available</p>
    </div>

   </div>
  );
 }

 return (
  <div className="max-w-5xl lg:px-16 px-6 mx-auto">
   <h2 className="text-2xl mb-4 text-text-primary">Payment history</h2>

   {/* Filter Controls */}
   <div className="mb-4" ref={filterRef}>
    <div className="relative">
     <div
      className={`relative w-fit rounded-full px-3 py-2 cursor-pointer ${
       isFilterOpen ? 'ring-2 ring-border bg-surface-primary' : 'ring-1 ring-border bg-surface-tertiary'
      }`}
      onClick={() => setIsFilterOpen(!isFilterOpen)}
     >
      <div className="flex justify-between items-center">
       <span className="text-sm text-text-primary">
        {filterOptions.find(option => option.value === selectedFilter)?.label || 'Filter by'}
       </span>
       <svg
        className="shrink-0 w-3 h-3 text-text-primary ml-1"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
       >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
       </svg>
      </div>
     </div>

     {isFilterOpen && (
      <div className="absolute w-fit min-w-36 left-0 z-10 mt-2 border border-border rounded-md bg-surface-primary shadow-custom-shadow">
       {filterOptions.map((option) => (
        <div
         key={option.value}
         className="flex justify-between items-center p-3 cursor-pointer hover:bg-surface-tertiary"
         onClick={() => handleFilterChange(option.value)}
        >
         <span className="text-sm text-text-primary">{option.label}</span>
        </div>
       ))}
      </div>
     )}
    </div>
   </div>

   <div className="bg-white rounded-md shadow-custom-shadow">
    {paginatedInvoices.map((invoice) => (
     <div key={invoice.id} className="flex items-center justify-between py-4 border-b border-border last:border-none px-4">
      <div className="flex items-center space-x-4">
       <div className="relative w-14 h-14 rounded-md overflow-hidden">
        <Image src="/img/palo-alto.png" alt="Invoice Thumbnail" fill className="object-cover" />
       </div>
       <div>
        <p className="font-medium mb-1 text-text-primary">{invoice.title}</p>
        <p className="text-xs text-text-secondary">Due: {invoice.dueDate}</p>
        <p className="text-xs text-text-secondary">{formatCardBrand(invoice.cardBrand)} **** {invoice.last4}</p>
       </div>
      </div>
      <div className="flex items-center text-right gap-2">
       <div className="flex items-center space-x-2">
        {invoice.status === 'Outstanding' ? (
         <div className="px-3 py-2 badge-error rounded-md">
          Outstanding
         </div>
        ) : (
         <div className="px-3 py-2 badge-success rounded-md">Paid</div>
        )}
       </div>
       <p className="text-sm font-semibold w-16 text-center text-text-primary">{invoice.amount}</p>
       <button
        onClick={() => handleViewInvoice(invoice)}
        aria-label="View invoice"
        className="hover:text-text-secondary"
       >
        <ChevronRightIcon className="cursor-pointer w-4 h-4 text-text-primary" />
       </button>
      </div>
     </div>
    ))}
   </div>

   {/* Pagination Controls */}
   {totalPages > 1 && (
    <div className="relative flex justify-center items-center mt-8">
     <button
      onClick={handlePreviousPage}
      disabled={currentPage === 1}
      aria-label="Previous page"
      className={`absolute left-0 rounded-full bg-surface-tertiary active:bg-surface-disabled p-2 ${
       currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
     >
      <ChevronLeftIcon className="w-4 h-4 text-text-secondary" />
     </button>

     <span className="text-sm text-text-primary">    
      Page {currentPage} of {totalPages}
     </span>

     <button
      onClick={handleNextPage}
      disabled={currentPage === totalPages}
      aria-label="Next page"
      className={`absolute right-0 rounded-full bg-surface-tertiary active:bg-surface-disabled p-2 ${
       currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
     >
      <ChevronRightIcon className="w-4 h-4 text-text-secondary" />
     </button>
    </div>
   )}
  </div>
 );
};

