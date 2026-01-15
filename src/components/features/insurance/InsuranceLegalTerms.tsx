/**
 * @fileoverview Insurance policy legal terms and conditions
 * @source boombox-10.0/src/app/components/insurance-coverage/insurancelegalterms.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays comprehensive legal terms for Boombox's Limited Security Warranty Policy.
 * Includes coverage limits, exclusions, claim requirements, and conditions.
 * Critical information for customers understanding their insurance coverage.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with design system tokens
 *   - border-slate-100 → border-border
 * - Applied semantic text colors for hierarchy
 * - Used card component pattern for consistent styling
 * - Improved typography hierarchy for legal content
 * - Added proper semantic HTML structure
 * 
 * @refactor Migrated to features/insurance domain with design system compliance
 */

export function InsuranceLegalTerms() {
  return (
    <section className="lg:px-16 px-6 rounded-md">
      <div className="p-6 border border-border rounded-md mb-8"> 
        <h2 className="mb-4">Legal terms</h2>
        
        <div className="space-y-4 text-text-primary">
          <p>
            Capitalized terms not defined in this Limited Security Warranty Policy have the meaning given to them in Boombox&apos;s Terms of Use, (the &quot;Agreement&quot;), which are incorporated herein by reference.
          </p>

          <p>
            Subject to the terms, limitations, exclusions, and conditions of this Limited Security Warranty Policy and the Agreement, and solely to the extent covered by Boombox&apos;s insurance policy, Boombox will reimburse you for loss of or damage to your Stored Items properly packed in Storage Boxes that have been tampered with, lost or stolen while in Boombox&apos;s possession, up to a total maximum of US $0.60 per pound in aggregate per User (the &quot;Limited Security Warranty&quot;). Notwithstanding anything to the contrary, Boombox shall have the right, in its sole discretion, to determine if damage to a Stored Item, the value of a Lost Stored Item, and whether a damaged Stored Item is capable of being repaired. You may also purchase additional protection, such that your protection is in the aggregate of the legal minimum price per pound or the amount of additional protection purchased. You may purchase additional protection of either $1,000 or $2,500, in each case in aggregate per User. Please visit contact us at (415) 322-3135 for more details, including current rates for additional protection, and/or to purchase additional protection. You are free to cancel your protection plan. However, cancellation or failure to make payments each month means that your protection will revert to the default total maximum of US $0.60 per pound in aggregate per User. Once you have selected your protection level, you cannot upgrade or change your protection level, except you may cancel your additional protection at any time.
          </p>

          <p>
            Notwithstanding the foregoing, but subject to the terms, limitations, exclusions, and conditions of this Limited Security Warranty Policy and the Agreement, and solely to the extent covered by Boombox&apos;s insurance policy, if you created a Boombox account prior to January 10, 2017, then Boombox will reimburse you for loss of or damage to your Stored Items properly packed in Storage Boxes that have been tampered with, lost or stolen while in Boombox&apos;s possession, up to a total maximum of US $1,000.00 in aggregate per User (the &quot;Prior Limited Security Warranty&quot;). Customers who created Boombox accounts prior to January 10, 2017 are not eligible to purchase additional protection.
          </p>

          <p>
            If you purchase additional coverage and then at any point reach your maximum total claim amount, Boombox will immediately cancel any later scheduled monthly protection plan payments from you and default your Limited Security Warranty coverage down to a total maximum of US $0.60 per pound in aggregate.
          </p>

          <p>
            In order to be eligible for either Limited Security Warranty, you must: (i) have photographs of your Stored Items (in order to allow us to confirm the pre-packing condition of the Stored Items); (ii) pack your Stored Items into boxes (&quot;Storage Boxes&quot;); (iii) promptly examine your Storage Box and Stored Items when Boombox returns your Storage Boxes to you, and (iv) immediately notify the Boombox representative who return-delivered your Storage Box in writing of any loss of or damage to your Stored Items at the time of delivery within five (5) days of delivery.
          </p>

          <p>
            Upon receiving notice of lost or damaged Stored Items, Boombox will investigate the cause of loss or damage. If Boombox determines, in its sole discretion, that the loss or damage was due to unauthorized tampering with or access to the Stored Items contained within your Storage Box, Boombox will pay to you either (i) the cost of repair of the damaged Stored Items (up to the aggregate per-user limit expressly set forth herein and selected by you), or (ii) the current replacement fair market value of the lost or damaged Stored Items (up to the aggregate per-user limit expressly set forth herein and selected by you), whichever is less. Boombox shall be entitled to require proof of the initial purchase price, repair cost, and/or replacement value, and/or fair market value of any damaged or stolen Stored Items.
          </p>

          <p>
            You agree that Boombox shall have no liability for any loss of or damage to any Stored Items if you breach or have breached any provision of the Agreement, or if you fail or have failed to comply with any of the Warranty Requirements above, including without limitation, any failure to have photographs taken of any missing or damaged Stored Items prior to packing the Stored Items or failure to notify Boombox of any or lost or damaged Stored Items immediately upon delivery. The Limited Security Warranty is not insurance and should not be considered a replacement or stand-in for any kind of insurance. We strongly encourage you to purchase insurance for all of your Stored Items.
          </p>

          <p>
            The Limited Security Warranty does not apply to, and Boombox shall not in any event be liable for, any loss or damage that falls into the following categories: (i) loss or damage to the Stored Items which does not arise as a direct consequence of any breach of this Agreement by Boombox or any deliberate or grossly negligent act or omission on the part of Boombox or its contractors; (ii) loss of or damage to any Prohibited Stored Items (as defined in the Agreement); (iii) loss or damage to composite wood items, such as pressboard, particle board or ready-to-assemble furniture; (iv) loss or damage to the internal workings of electronic items; (v) missing hardware for items Boombox did not disassemble; (vi) loss or damage to items that were previously damaged or repaired; (vii) loss of business, sales, revenue, profits or anticipated savings; (viii) loss or damage which was not reasonably foreseeable at the date of entering into this Agreement, regardless as to how such loss or damage was caused; (ix) loss or damage due to emotional distress; or (x) consequential damages of any character; or (xi) loss of or damage to Stored Items in connection with any Force Majeure Event (as defined in the Agreement).
          </p>

          <p>
            You acknowledge and agree that the Limited Security Warranty set forth herein shall be your sole and exclusive remedy and Boombox&apos;s total liability to you in connection with any lost, stolen, or damaged Stored Items.
          </p>
        </div>
      </div>
    </section>
  );
}

export default InsuranceLegalTerms;

