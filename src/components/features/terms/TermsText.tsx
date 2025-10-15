/**
 * @fileoverview Terms of Service text content component
 * @source boombox-10.0/src/app/components/terms/termstext.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays the complete Terms of Service legal text including:
 * - Definitions and eligibility requirements
 * - Site usage rules and account management
 * - Storage service terms and conditions
 * - Payment terms and liability clauses
 * - Privacy, security, and dispute resolution
 * - All legal sections with proper heading hierarchy
 * 
 * API ROUTES UPDATED:
 * - None (this is a static content presentational component)
 * 
 * DESIGN SYSTEM UPDATES:
 * - No color changes needed (inherits text colors from parent)
 * - Maintained semantic heading hierarchy (h2 for sections)
 * - Maintained spacing classes (mb-4, mb-6, mb-10, mt-6, mt-10)
 * - Preserved all legal text content exactly as-is
 * 
 * @refactor
 * - Renamed file from termstext.tsx to TermsText.tsx (PascalCase)
 * - Changed from const with React.FC to function declaration
 * - Preserved all legal text content and formatting
 * - Added comprehensive documentation header
 * - No business logic to extract (static content only)
 */

'use client';

export function TermsText() {
  return (
    <div className="w-full">
      <div>
        <p className="mb-4">
          Welcome to Boomboxstorage.com, the website and online service of
          Boombox Inc. (&quot;Boombox,&quot; &quot;we,&quot; or &quot;us&quot;).
          Boombox provides you with a service that aims to make storage easy.
          This page explains the terms by which you may use our online and/or
          mobile services, web sites, and software provided on or in connection
          with boomboxstorage.com and any services provided by us (collectively
          the &quot;Site&quot;), as well as our offline storage services. By
          accessing or using the Site and/or using the Storage Services (as
          defined below), you signify that you have read, understood, and agree
          to be bound by this Terms of Use Agreement (&quot;Agreement&quot;)
          and to the collection, use, and disclosure of your information as set
          forth in the Boombox Privacy Policy, whether or not you are a
          registered user of our Site. This Agreement applies to all visitors,
          users, and others who access the Site or use the Storage Services
          (&quot;Users&quot;, &quot;you&quot;, or &quot;your&quot;).
        </p>
        <p className="mb-4">
          PLEASE READ THIS AGREEMENT CAREFULLY TO ENSURE THAT YOU UNDERSTAND
          EACH PROVISION. THIS AGREEMENT CONTAINS A MANDATORY INDIVIDUAL
          ARBITRATION AND CLASS ACTION/JURY TRIAL WAIVER PROVISION THAT
          REQUIRES THE USE OF ARBITRATION ON AN INDIVIDUAL BASIS TO RESOLVE
          DISPUTES, RATHER THAN JURY TRIALS OR CLASS ACTIONS.
        </p>
        <p className="mb-4">
          DEFINITIONS In this agreement &quot;Stored Item(s)&quot; means the
          items packed by you, Boombox, or on behalf of Boombox for storage by
          Boombox. &quot;Storage Service(s)&quot; means the storage services
          provided by or on behalf of Boombox as described in Section 3 below.
        </p>
        <h2 className="font-bold mb-10 mt-10">USER OF OUR SITE</h2>
        <h2 className="mb-4">Eligibility</h2>
        <p className="mb-4">
          You may use the Site only if you can form a binding contract with
          Boombox, and only in compliance with this Agreement and all applicable
          local, state, national, and international laws, rules and regulations.
          You must be at least 18 years old to use the Site and Storage
          Services. By registering to use the Site and Storage Services, you
          represent and warrant that you are 18 years of age or older. Any use
          or access to the Site or Storage Services by anyone under 18 is
          strictly prohibited and in violation of this Agreement. The Site and
          Storage Services not available to any Users previously removed from
          the Site by Boombox.
        </p>
        <h2 className="mb-6 mt-6">Boombox Site</h2>
        <p className="mb-4">
          Subject to the terms and conditions of this Agreement, you are hereby
          granted a non-exclusive, limited, non-transferable, freely revocable
          license to use the Site for your personal, noncommercial use only and
          as permitted by the features of the Site. Boombox reserves all rights
          not expressly granted herein in the Site and the Boombox Content (as
          defined below). Boombox may terminate this license at any time for any
          reason or no reason.
        </p>
        <h2 className="mb-6 mt-6">Boombox Accounts</h2>
        <p className="mb-4">
          Your Boombox account gives you access to the services and
          functionality that we may establish and maintain from time to time and
          in our sole discretion. If you open a Boombox account on behalf of a
          company, organization, or other entity, then (a) &quot;you&quot;
          includes you and that entity, and (b) you represent and warrant that
          you are an authorized representative of the entity with the authority
          to bind the entity to this Agreement, and that you agree to this
          Agreement on the entity&apos;s behalf. By connecting to Boombox with a
          third-party service, you give us permission to access and use your
          information from that service as permitted by that service, and to
          store your log-in credentials for that service. You may never use
          another User&apos;s account without permission. When creating your
          account, you must provide accurate and complete information. You are
          solely responsible for the activity that occurs on your account, and
          you must keep your account password secure. We encourage you to use
          &quot;strong&quot; passwords (passwords that use a combination of
          upper and lower case letters, numbers and symbols) with your account.
          You must notify Boombox immediately of any breach of security or
          unauthorized use of your account. Boombox will not be liable for any
          losses caused by any unauthorized use of your account. You may control
          your User profile and account settings by emailing us at
          help@boomboxstorage.com, updating your profile online at
          www.Boombox.com, or calling us at (415) 322-3135. By providing
          Boombox your email address, you consent to our using the email address
          to send you Site- and Storage Service - related notices, including any
          notices required by law, in lieu of communication by postal mail. We
          may also use your email address to send you other messages, such as
          changes to features of the Site and Storage Services and special
          offers. If you do not want to receive such email messages, you may opt
          out or change your preferences by emailing us at
          help@boomboxstorage.com. Opting out may prevent you from receiving
          email messages regarding updates, improvements, or offers.
        </p>
        <h2 className="mb-6 mt-6">Site Rules</h2>
        <p className="mb-4">
          You agree not to engage in any of the following prohibited activities:
          (i) copying, distributing, or disclosing any part of the Site in any
          medium, including without limitation by any automated or non-automated
          &quot;scraping&quot;; (ii) using any automated system, including
          without limitation &quot;robots,&quot; &quot;spiders,&quot;
          &quot;offline readers,&quot; etc., to access the Site in a manner that
          sends more request messages to the Boombox servers than a human can
          reasonably produce in the same period of time by using a conventional
          on-line web browser; (iii) transmitting spam, chain letters, or other
          unsolicited email; (iv) attempting to interfere with, compromise the
          system integrity or security or decipher any transmissions to or from
          the servers running the Site; (v) taking any action that imposes, or
          may impose at our sole discretion an unreasonable or disproportionately
          large load on our infrastructure; (vi) uploading invalid data, viruses,
          worms, or other software agents through the Site; (vii) collecting or
          harvesting any personally identifiable information, including account
          names, from the Site; (viii) using the Site for any commercial
          solicitation purposes; (ix) impersonating another person or otherwise
          misrepresenting your affiliation with a person or entity, conducting
          fraud, hiding or attempting to hide your identity; (x) interfering with
          the proper working of the Site; (xi) accessing any content on the Site
          through any technology or means other than those provided or authorized
          by the Site; or (xii) bypassing the measures we may use to prevent or
          restrict access to the Site, including without limitation features that
          prevent or restrict use or copying of any content or enforce
          limitations on use of the Site or the content therein. User&apos;s
          account without permission. When creating your account, you must
          provide accurate and complete information. You are solely responsible
          for the activity that occurs on your account, and you must keep your
          account password secure. We encourage you to use &quot;strong&quot;
          passwords (passwords that use a combination of upper and lower case
          letters, numbers and symbols) with your account. You must notify
          Boombox immediately of any breach of security or unauthorized use of
          your account. Boombox will not be liable for any losses caused by any
          unauthorized use of your account. You may control your User profile and
          account settings by emailing us at help@boomboxstorage.com, updating
          your profile online at www.Boombox.com, or calling us at (415)
          322-3135. By providing Boombox your email address, you consent to our
          using the email address to send you Site - and Storage Service -
          related notices, including any notices required by law, in lieu of
          communication by postal mail. We may also use your email address to
          send you other messages, such as changes to features of the Site and
          Storage Services and special offers. If you do not want to receive such
          email messages, you may opt out or change your preferences by emailing
          us at help@boomboxstorage.com. Opting out may prevent you from
          receiving email messages regarding updates, improvements, or offers.
        </p>
        <h2 className="font-bold mb-10 mt-10">THE STORAGE SERVICE</h2>
        <h2 className="mb-6 mt-6">Boombox</h2>
        <p className="mb-4">
          Subject to the terms and conditions of this Agreement, including
          without limitation the payment of all fees under this Agreement,
          Boombox shall, upon request: (i) arrive at the address you designate
          as the delivery address (the &quot;Delivery Address&quot;); (ii) pack
          your Stored Items into one or more boxes, prepare furniture and other
          large items for safe transport using moving blankets and other required
          packing materials; (iii) photograph the packed Stored Items from above,
          prior to packing or wrapping, to document their condition prior to
          transport and storage; (iv) pick up the Stored Items that you or
          Boombox have packed from your Delivery Address; (v) transport the
          Stored Items packed with your Stored Items to a storage facility
          (chosen at our discretion) for storage; and (vi) return the Stored
          Items packed with your Stored Items to the Delivery Address. The
          foregoing storage services shall be referred to under this Agreement as
          &quot;Storage Services.&quot; Further, you acknowledge and agree that
          Boombox shall have no responsibility for any Stored Items shipped
          directly by you or on your behalf to Boombox, and neither shall the
          Boombox Limited Security Warranty Policy apply to any Stored Items
          shipped in this way, except for the default minimum coverage of US
          $0.60 per pound in aggregate per User. Upon your request, Boombox will
          unbox, photograph, and catalog the contents of the boxes at
          Boombox&apos;s standard labor charges. You acknowledge and agree that
          Boombox shall have no responsibility or liability for any charges
          incurred by you in the event that Boombox cannot accept delivery of any
          such Stored Items shipped directly by tyou or on your behalf to Boombox
          (other than those Stored Items shipped by Boombox itself or a Boombox
          agent or subcontractor pursuant to the first paragraph of this Section
          3.A.); and you hereby waive and release Boombox from responsibility for
          any damage to such Stored Items. Boombox will not deliver or return
          Stored Items to an address that is not in an active Boombox delivery
          zone listed on our current Delivery Zone List (a &quot;Delivery
          Zone&quot;), unless we otherwise agree to do so in writing. Times given
          for delivery, collection, and return are only estimates and Boombox
          shall not be liable for any delay in delivery, collection, or return.
          Boombox, at its sole discretion, will facilitate the transport of your
          items from the Delivery Zone from your initial pick-up to a Delivery
          Zone in a new city at pricing to be determined by Boombox and approved
          by you. Boombox may cancel, postpone, or otherwise reschedule any
          delivery, collection, or return of Stored Items for any reason or no
          reason, including without limitation in the event that Boombox believes,
          in its sole discretion, that it may endanger any Boombox employee,
          agent, contractor or other individual due to (including but not limited
          to) severe weather conditions or by reason of Boombox having limited
          access to the Delivery Address.
        </p>
        <p className="mb-4">
          Boombox may use subcontractors and/or third parties to help perform any
          Boombox obligations or services under this Agreement or any other
          agreements that incorporate this Agreement, including without limitation
          for pick-ups, return deliveries, and other logistics with respect to
          Stored Items. You acknowledge and agree that Boombox will not be
          responsible for: (i) dismantling or assembling any unit, system, or
          furniture (including flat pack); or (ii) disconnecting, reconnecting,
          dismantling or reassembling appliances, fixtures, fittings or
          equipment. While Boombox makes a good faith effort to place all Stored
          Items in suitable environments and/or means of storage, Boombox stores a
          large variety of items, some of which require specific environments or
          means of storage. Boombox does not warrant that any storage facility
          used by Boombox is a suitable place or means of storage for any
          particular Stored Items.
        </p>
        <p className="mb-4">
          Your Responsibilities; Waiver of Non-Photographed and Improperly Packed
          Items
        </p>
        <p className="mb-4">
          You will be solely responsible for: (i) obtaining and ensuring that
          Boombox or its carrier has such access to any parking as may be
          reasonably required to carry out the Storage Services; (ii) being
          present, or ensuring that someone authorized by you is present, during
          the delivery, collection, and return of the Stored Items; (iii)
          providing Boombox with your contact details and ensuring that such
          contact details are accurate and up-to-date; (iv) ensuring that the
          Stored Items you pack have been securely packed into the appropriate
          boxes so as not to cause damage or injury or the likelihood of damage
          or injury to your Stored Items, Boombox&apos;s property, employees,
          agents, contractors, business partners, other goods, or other
          individuals, whether by spreading of dampness, infestation, leakage or
          the escape of fumes or substances or otherwise; (v) informing Boombox
          immediately upon delivery of any damage to the Stored Items or your
          property that occurred during a delivery, collection or return service;
          and (vi) reimbursing Boombox in full an amount equal to all damages,
          liabilities, costs, claims and expenses that Boombox may incur as a
          result of your use of the Storage Service or any breach by you of this
          Agreement.
        </p>
        <p className="mb-4">
          You understand that Boombox is only responsible for those Stored Items
          that have been visually inspected and photographed by Boombox. You
          acknowledge that you are solely responsible for verifying that Boombox
          has photographed and inventoried all the Stored Items and that the
          inventory Boombox provides you is a true and complete inventory of the
          personal property tendered. You hereby waive and release Boombox from
          responsibility for any damage to items that were not packed, sealed,
          inspected and photographed by Boombox. Boombox uses packing blankets
          and packing supplies to ensure safe transport. If any items are not
          packed into boxes or protected with moving blankets you are solely
          responsible for damage to those items. the Site; (v) taking any action
          that imposes, or may impose at our sole discretion an unreasonable or
          disproportionately large load on our infrastructure; (vi) uploading
          invalid data, viruses, worms, or other software agents through the
          Site; (vii) collecting or harvesting any personally identifiable
          information, including account names, from the Site; (viii) using the
          Site for any commercial solicitation purposes; (ix) impersonating
          another person or otherwise misrepresenting your affiliation with a
          person or entity, conducting fraud, hiding or attempting to hide your
          identity; (x) interfering with the proper working of the Site; (xi)
          accessing any content on the Site through any technology or means other
          than those provided or authorized by the Site; or (xii) bypassing the
          measures we may use to prevent or restrict access to the Site,
          including without limitation features that prevent or restrict use or
          copying of any content or enforce limitations on use of the Site or the
          content therein. User&apos;s account without permission. When creating
          your account, you must provide accurate and complete information. You
          are solely responsible for the activity that occurs on your account,
          and you must keep your account password secure. We encourage you to use
          &quot;strong&quot; passwords (passwords that use a combination of upper
          and lower case letters, numbers and symbols) with your account. You
          must notify Boombox immediately of any breach of security or
          unauthorized use of your account. Boombox will not be liable for any
          losses caused by any unauthorized use of your account. You may control
          your User profile and account settings by emailing us at
          help@boomboxstorage.com, updating your profile online at
          www.Boombox.com, or calling us at (415) 322-3135. By providing Boombox
          your email address, you consent to our using the email address to send
          you Site- and Storage Service - related notices, including any notices
          required by law, in lieu of communication by postal mail. We may also
          use your email address to send you other messages, such as changes to
          features of the Site and Storage Services and special offers. If you do
          not want to receive such email messages, you may opt out or change your
          preferences by emailing us at help@boomboxstorage.com. Opting out may
          prevent you from receiving email messages regarding updates,
          improvements, or offers.
        </p>
        <h2 className="mb-6 mt-6">Stored Items</h2>
        <p className="mb-4">
          You represent and warrant that you own the Stored Items or that you
          otherwise have the right and authority to store and use the Stored
          Items in accordance with this Agreement. The Stored Items must not
          include and you must not store any of the following in connection with
          the Storage Services: antiques (whether or not breakable and fragile),
          perishable goods, firearms, explosives, used tires, plants, birds,
          fish, other animals, or any other living thing, arms or ammunition, any
          item which emits fumes, smells or odors, bullion (e.g., gold-silver),
          jewelry, currency, ivory, precious metals or stones, any drugs, illegal
          substances or goods, or goods or substances illegally obtained,
          combustible or flammable materials, liquids or compressed gases, diesel,
          petrol, oil, gas, artificial fertilizer or cleaning solvents,
          chemicals, radioactive materials or biological agents, toxic waste,
          asbestos or other materials of a dangerous or harmful nature, any other
          toxic, flammable or hazardous goods, or any other items, the
          possession, usage, or storage of which may detrimentally affect any of
          your other Stored Items or violate in any way the laws of the United
          States or any other applicable laws, rules, or regulations
          (collectively, &quot;Prohibited Stored Items&quot;). According to
          Boombox&apos;s sole discretion, Boombox shall regularly conduct, or
          have its subcontractors conduct, pest control inspections and
          operations at the storage facilities containing Stored Items. Boombox or
          its contractors may at any time without notifying you open any Stored
          Items to inspect the Stored Items if Boombox: (i) believes, in its sole
          discretion, that the Stored Items may include any Prohibited Stored
          Items; (ii) is required to do so by the police, fire services, local
          authorities or by court order; (iii) determines, in its sole discretion,
          it necessary for account or warehouse maintenance; or (iv) considers it
          necessary, in its sole discretion, in an emergency or to prevent injury
          or damage to persons or property. Boombox may refuse to store any
          Stored Items, or may return to you any Stored Items, at your cost, at
          any time, if, in Boombox&apos;s sole discretion, the storage, or
          continued storage, of the Stored Items would represent a risk to the
          safety of any person, the security of the storage site, or any other
          goods stored at the storage site.
        </p>
        <h2 className="mb-6 mt-6">Payment</h2>
        <p className="mb-4">
          By using the Storage Services or other paid services or products
          provided by Boombox, you agree to the pricing and payment terms, as we
          may update them from time to time. Boombox may add new services for
          additional fees and charges, or amend fees and charges for existing
          services, at any time in its sole discretion. Any change to our pricing
          or payment terms can effect exisiting customers. All information that
          you provide in connection with a purchase or transaction or other
          monetary transaction interaction with the Site or Storage Services must
          be accurate, complete, and current. You agree to pay all charges
          incurred by users of your credit card, debit card, or other payment
          method used in connection with a purchase or transaction or other
          monetary transaction interaction with Boombox at the prices in effect
          when such charges are incurred. You will pay any applicable taxes
          (including without limitation any applicable sales tax), if any,
          relating to any such purchases, transactions or other monetary
          transaction interactions. Any amounts not paid when due shall bear
          interest at the rate of 1.5% per month or the maximum rate allowed by
          law, whichever is less. You may cancel your Boombox account at any
          time; however, there are no refunds for cancellation. In addition,
          Boombox requires minimum payment commitments, and you remain obligated
          to pay the full amount of any such minimum payment commitment you have
          made to Boombox, regardless of whether and at what point you cancel
          your Boombox account. In the event that Boombox suspends or terminates
          your account or this Agreement for your breach of this Agreement, you
          understand and agree that you shall receive no refund or exchange for
          any unused storage time, any license or subscription fees for any
          portion of the Site or Storage Services, any content or data associated
          with your account, or for anything else. Boombox&apos;s Right to
          Withhold or Dispose of Stored Items Boombox shall have the right to
          withhold and ultimately dispose of some or all of the Stored Items in
          accordance with this clause if either: (i) you do not pay any
          applicable fees or any other payments due under this Agreement or (ii)
          you abandon your Stored Items, which will occur in the event your
          Boombox subscription terminates or expires and you fail to take
          possession of your Stored Items within 45 days from the termination or
          expiration date, despite Boombox&apos;s or an applicable
          courier&apos;s good faith attempts to return your Stored Items. You
          will be responsible for all storage charges and other associated costs
          reasonably incurred by Boombox while withholding or disposing of the
          Stored Items. Boombox will provide you with 45 days&apos; written
          notice requiring you to pay all amounts due and contact Boombox to
          arrange for re-delivery of the Stored Items. If upon the expiration of
          the 45-day notice period you have failed to pay all of the amounts due,
          Boombox may dispose of some or all of the Stored Items by sale or
          otherwise. If in Boombox&apos;s opinion the Stored Items cannot be sold
          for a reasonable price or at all (for any reason), or despite
          Boombox&apos;s reasonable efforts they remain unsold, you authorize
          Boombox to treat them as abandoned and to destroy or otherwise dispose
          of them at your cost. You shall be responsible for all costs reasonably
          incurred by Boombox in relation to the disposal of the Stored Items. If
          Boombox receives money on disposal of the Stored Items, the net
          proceeds of sale will be credited to your account and Boombox will pay
          any excess amounts to you without interest, less Boombox&apos;s
          administrative charge of $250.00. If, after having made reasonable
          efforts to do so, Boombox is unable to return any excess amounts
          received by Boombox from the disposal of your Stored Items to you,
          including having given not less than 45 days&apos; written notice to
          you, Boombox may retain any such excess amounts for its own account. If
          the proceeds of sale (if any) are insufficient to discharge the
          outstanding charges or any other payments due to Boombox under this
          Agreement and the costs of sale, you must pay any balance outstanding
          to Boombox within 7 days of a written demand from Boombox. Interest
          will accrue on the balance in accordance with the Payment Section above
          until the balance is paid in full. Boombox&apos;s Limited Security
          Warranty Boombox agrees to provide you with a limited security warranty
          regarding your Stored Items as set forth in the terms and conditions of
          our Limited Security Warranty Policy. This Limited Security Warranty
          Policy is expressly incorporated by reference herein. Termination You
          may terminate this Agreement at any time by requesting the return of
          your Stored Items and by paying any outstanding fees due to Boombox. We
          may, without prior notice, change the Site or Storage Services; stop
          providing the Site or Storage Services or features of the Site or
          Storage Services, to you or to Users generally; or create usage limits
          for the Site or Storage Services. We may permanently or temporarily
          terminate or suspend your access to the Site or Storage Services
          without notice and liability for any reason, including if in our sole
          determination you violate any provision of this Agreement, or for no
          reason. Upon termination for any reason or no reason, you continue to
          be bound by this Agreement. Upon termination of this Agreement for any
          reason you must contact Boombox promptly to arrange for delivery of
          your Stored Items. If within 45 days following termination of this
          Agreement for any reason you fail to arrange for delivery of all of
          your Stored Items, then Boombox may process the Stored Items in
          accordance with the provisions of the section titled
          &quot;Boombox&apos;s Right to Withhold or Dispose of Stored Items&quot;
          above.
        </p>
        <h2 className="mb-6 mt-6">Our Proprietary Rights</h2>
        <p className="mb-4">
          Except for your User Content, the Site and all materials therein or
          transferred thereby, including, without limitation, software, images,
          text, graphics, illustrations, logos, patents, trademarks, Site marks,
          copyrights, photographs, audio, videos, music, and User Content
          belonging to other Users (the &quot;Boombox Content&quot;), and all
          Intellectual Property Rights related thereto, are the exclusive
          property of Boombox and its licensors (including other Users who post
          User Content to the Site). Except as explicitly provided herein,
          nothing in this Agreement shall be deemed to create a license in or
          under any such Intellectual Property Rights, and you agree not to sell,
          license, rent, modify, distribute, copy, reproduce, transmit, publicly
          display, publicly perform, publish, adapt, edit or create derivative
          works from any Boombox Content. Use of the Boombox Content for any
          purpose not expressly permitted by this Agreement is strictly
          prohibited. You may choose to or we may invite you to submit feedback,
          comments, suggestions, error identifications, or ideas about the Site
          or Storage Services, including without limitation about how to improve
          the Site, the Storage Services, or our other services or products
          (&quot;Idea(s)&quot;). By submitting any Idea, you agree that your
          disclosure is gratuitous, unsolicited and without restriction and will
          not place Boombox under any fiduciary or other obligation, and that we
          are free to use the Idea without any additional compensation to you,
          and/or to disclose the Idea on a non-confidential basis or otherwise to
          anyone. You further acknowledge that, by acceptance of your submission,
          Boombox does not waive any rights to use similar or related ideas
          previously known to Boombox, or developed by its employees, or obtained
          from sources other than you.
        </p>
        <h2 className="mb-6 mt-6">Privacy</h2>
        <p className="mb-4">
          We care about the privacy of our Users. You understand that by using
          the Site you consent to the collection, use and disclosure of your
          personally identifiable information and aggregate data as set forth in
          our Privacy Policy, and to have your personally identifiable
          information collected, used, transferred to and processed in the United
          States.
        </p>
        <h2 className="mb-6 mt-6">Security</h2>
        <p className="mb-4">
          Boombox cares about the integrity and security of your personal
          information. However, we cannot guarantee that unauthorized third
          parties will never be able to defeat our security measures or use your
          personal information for improper purposes. You acknowledge that you
          provide your personal information at your own risk.
        </p>
        <h2 className="mb-6 mt-6">Third Party Links</h2>
        <p className="mb-4">
          The Site may contain links to third-party websites, advertisers,
          services, special offers, or other events or activities that are not
          owned or controlled by Boombox. Boombox does not endorse or assume any
          responsibility for any such third-party sites, information, materials,
          products, or services. If you access a third party website from the
          Site, you do so at your own risk, and you understand that this
          Agreement and Boombox&apos;s Privacy Policy do not apply to your use of
          such sites and services. You expressly relieve Boombox from any and all
          liability arising from your use of any third-party website, service, or
          content. Additionally, your dealings with or participation in promotions
          of advertisers found on the Site or in connection with the Storage
          Services, including payment and delivery of goods, and any other terms
          (such as warranties) are solely between you and such advertisers. You
          agree that Boombox shall not be responsible for any loss or damage of
          any sort relating to your dealings with such advertisers.
        </p>
        <h2 className="mb-6 mt-6">Indemnity</h2>
        <p className="mb-4">
          You agree to defend, indemnify and hold harmless Boombox and its
          subsidiaries, agents, licensors, managers, and other affiliated
          companies, and their employees, contractors, agents, officers and
          directors, from and against any and all claims, damages, obligations,
          losses, liabilities, costs or debt, and expenses (including but not
          limited to attorney&apos;s fees) arising from: (i) your use of and
          access to the Site, including any data or content transmitted or
          received by you; (ii) your use of the Storage Services; (iii) your
          violation of any term of this Agreement, including without limitation
          your breach of any of the representations and warranties above; (iv)
          your violation of any third-party right, including without limitation
          any right of privacy or Intellectual Property Rights; (v) your violation
          of any applicable law, rule, or regulation; (vi) any of your User
          Content or Stored Items, or any that is submitted via your account; or
          (vii) any other party&apos;s access and use of the Site or Storage
          Services with your unique username, password or other appropriate
          security code
        </p>
        <h2 className="mb-6 mt-6">No Warranty</h2>
        <p className="mb-4">
          EXCEPT AS EXPRESSLY PROVIDED IN THE LIMITED SECURITY WARRANTY POLICY,
          THE SITE AND STORAGE SERVICES ARE PROVIDED ON AN &quot;AS IS&quot; AND
          &quot;AS AVAILABLE&quot; BASIS. USE OF THE SITE AND STORAGE SERVICES IS
          AT YOUR OWN RISK. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW,
          THE SITE AND STORAGE SERVICES ARE PROVIDED WITHOUT WARRANTIES OF ANY
          KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO,
          IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
          OR NON-INFRINGEMENT. NO ADVICE OR INFORMATION, WHETHER ORAL OR WRITTEN,
          OBTAINED BY YOU FROM Boombox OR THROUGH THE SITE OR IN CONNECTION WITH
          THE STORAGE SERVICES WILL CREATE ANY WARRANTY NOT EXPRESSLY STATED
          HEREIN. WITHOUT LIMITING THE FOREGOING, Boombox, ITS SUBSIDIARIES, ITS
          AFFILIATES, AND ITS LICENSORS DO NOT WARRANT THAT THE CONTENT IS
          ACCURATE, RELIABLE OR CORRECT; THAT THE SITE OR STORAGE SERVICES WILL
          MEET YOUR REQUIREMENTS; THAT THE SITE OR STORAGE SERVICES WILL BE
          AVAILABLE AT ANY PARTICULAR TIME OR LOCATION, UNINTERRUPTED OR SECURE;
          THAT ANY DEFECTS OR ERRORS WILL BE CORRECTED; OR THAT THE SITE IS FREE
          OF VIRUSES OR OTHER HARMFUL COMPONENTS. ANY CONTENT DOWNLOADED OR
          OTHERWISE OBTAINED THROUGH THE USE OF THE SITE IS DOWNLOADED AT YOUR
          OWN RISK AND YOU WILL BE SOLELY RESPONSIBLE FOR ANY DAMAGE TO YOUR
          COMPUTER SYSTEM OR MOBILE DEVICE OR LOSS OF DATA THAT RESULTS FROM SUCH
          DOWNLOAD OR YOUR USE OF THE SITE. Boombox DOES NOT WARRANT, ENDORSE,
          GUARANTEE, OR ASSUME RESPONSIBILITY FOR ANY PRODUCT OR SERVICE
          ADVERTISED OR OFFERED BY A THIRD PARTY THROUGH THE Boombox SITE OR
          STORAGE SERVICES OR ANY WEBSITE OR SERVICE HYPERLINKED TO THE SITE, AND
          Boombox WILL NOT BE A PARTY TO OR IN ANY WAY MONITOR ANY TRANSACTION
          BETWEEN YOU AND THIRD-PARTY PROVIDERS OF PRODUCTS OR SERVICES. FEDERAL
          LAW, SOME STATES, PROVINCES AND OTHER JURISDICTIONS DO NOT ALLOW
          EXCLUSIONS AND LIMITATIONS OF CERTAIN IMPLIED WARRANTIES, SO SOME OF
          THE ABOVE LIMITATIONS MAY NOT APPLY TO YOU. LIMITATION OF LIABILITY TO
          THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL
          Boombox, ITS AFFILIATES, AGENTS, DIRECTORS, EMPLOYEES, SUPPLIERS OR
          LICENSORS BE LIABLE FOR ANY INDIRECT, PUNITIVE, INCIDENTAL, SPECIAL,
          CONSEQUENTIAL OR EXEMPLARY DAMAGES, INCLUDING WITHOUT LIMITATION
          DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA OR OTHER INTANGIBLE
          LOSSES, THAT RESULT FROM THE USE OF, OR INABILITY TO USE, THIS SITE OR
          STORAGE SERVICES. UNDER NO CIRCUMSTANCES WILL Boombox BE RESPONSIBLE
          FOR ANY DAMAGE, LOSS OR INJURY RESULTING FROM HACKING, TAMPERING OR
          OTHER UNAUTHORIZED ACCESS OR USE OF THE SITE OR YOUR ACCOUNT OR THE
          INFORMATION CONTAINED THEREIN. TO THE MAXIMUM EXTENT PERMITTED BY
          APPLICABLE LAW, Boombox ASSUMES NO LIABILITY OR RESPONSIBILITY FOR ANY
          (I) ERRORS, MISTAKES, OR INACCURACIES OF CONTENT; (II) PERSONAL INJURY
          OR PROPERTY DAMAGE, OF ANY NATURE WHATSOEVER, RESULTING FROM YOUR
          ACCESS TO OR USE OF OUR SITE OR STORAGE SERVICES (EXCEPT AS EXPRESSLY
          PROVIDED IN THE LIMITED SECURITY WARRANTY POLICY); (III) ANY
          UNAUTHORIZED ACCESS TO OR USE OF OUR SECURE SERVERS AND/OR ANY AND ALL
          PERSONAL INFORMATION STORED THEREIN; (IV) ANY INTERRUPTION OR CESSATION
          OF TRANSMISSION TO OR FROM THE SITE; (V) ANY BUGS, VIRUSES, TROJAN
          HORSES, OR THE LIKE THAT MAY BE TRANSMITTED TO OR THROUGH OUR SITE BY
          ANY THIRD PARTY; (VI) ANY ERRORS OR OMISSIONS IN ANY CONTENT OR FOR ANY
          LOSS OR DAMAGE INCURRED AS A RESULT OF THE USE OF ANY CONTENT POSTED,
          EMAILED, TRANSMITTED, OR OTHERWISE MADE AVAILABLE THROUGH THE SITE;
          AND/OR (VII) USER CONTENT OR THE DEFAMATORY, OFFENSIVE, OR ILLEGAL
          CONDUCT OF ANY THIRD PARTY. EXCEPT AS EXPRESSLY PROVIDED IN THE LIMITED
          SECURITY WARRANTY POLICY, IN NO EVENT SHALL Boombox, ITS AFFILIATES,
          AGENTS, DIRECTORS, EMPLOYEES, SUPPLIERS, OR LICENSORS BE LIABLE TO YOU
          FOR ANY CLAIMS, PROCEEDINGS, LIABILITIES, OBLIGATIONS, DAMAGES, LOSSES
          OR COSTS IN AN AMOUNT EXCEEDING THE AMOUNT YOU PAID TO Boombox
          HEREUNDER IN THE TWELVE (12) MONTHS PRIOR TO THE DATE THE LAST CAUSE OF
          ACTION AROSE OR $100.00, WHICHEVER IS GREATER. THIS LIMITATION OF
          LIABILITY SECTION APPLIES WHETHER THE ALLEGED LIABILITY IS BASED ON
          CONTRACT, TORT, NEGLIGENCE, STRICT LIABILITY, OR ANY OTHER BASIS, EVEN
          IF Boombox HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. THE
          FOREGOING LIMITATION OF LIABILITY SHALL APPLY TO THE FULLEST EXTENT
          PERMITTED BY LAW IN THE APPLICABLE JURISDICTION. SOME STATES DO NOT
          ALLOW THE EXCLUSION OR LIMITATION OF INCIDENTAL OR CONSEQUENTIAL
          DAMAGES, SO THE ABOVE LIMITATIONS OR EXCLUSIONS MAY NOT APPLY TO YOU.
          THIS AGREEMENT GIVES YOU SPECIFIC LEGAL RIGHTS, AND YOU MAY ALSO HAVE
          OTHER RIGHTS WHICH VARY FROM STATE TO STATE. THE DISCLAIMERS,
          EXCLUSIONS, AND LIMITATIONS OF LIABILITY UNDER THIS AGREEMENT WILL NOT
          APPLY TO THE EXTENT PROHIBITED BY APPLICABLE LAW. The Site is
          controlled and operated from facilities in the United States. Boombox
          makes no representations that the Site is appropriate or available for
          use in other locations. Those who access or use the Site from other
          jurisdictions do so at their own volition and are entirely responsible
          for compliance with all applicable United States and local laws and
          regulations, including but not limited to export and import regulations.
          You may not use the Site if you are a resident of a country embargoed
          by the United States, or are a foreign person or entity blocked or
          denied by the United States government. Unless otherwise explicitly
          stated, all materials found on the Site are solely directed to
          individuals, companies, or other entities located in the United States.
        </p>
        <h2 className="mb-6 mt-6">Business Failure</h2>
        <p className="mb-4">
          This Agreement shall be governed by the internal substantive laws of
          the State of California, without respect to its conflict of laws
          principles. The parties acknowledge that this Agreement evidences a
          transaction involving interstate commerce. Notwithstanding the preceding
          sentences with respect to the substantive law, any arbitration
          conducted pursuant to the terms of this Agreement shall be governed by
          the Federal Arbitration Act (9 U.S.C. &quot;&quot; 1-16). The
          application of the United Nations Convention on Contracts for the
          International Sale of Stored Items is expressly excluded. You agree to
          submit to the personal jurisdiction of the federal and state courts
          located in Santa Clara County, California for any actions for which we
          retain the right to seek injunctive or other equitable relief in a
          court of competent jurisdiction to prevent the actual or threatened
          infringement, misappropriation or violation of our copyrights,
          trademarks, trade secrets, patents, or other intellectual property or
          proprietary rights, as set forth in the Arbitration provision below.
        </p>
        <h2 className="mb-6 mt-6">Arbitration</h2>
        <p className="mb-4">
          READ THIS SECTION CAREFULLY BECAUSE IT REQUIRES THE PARTIES TO
          ARBITRATE THEIR DISPUTES AND LIMITS THE MANNER IN WHICH YOU CAN SEEK
          RELIEF FROM Boombox. For any dispute with Boombox, you agree to first
          contact us at help@boomboxstorage.com and attempt to resolve the
          dispute with us informally. In the unlikely event that Boombox has not
          been able to resolve a dispute it has with you after sixty (60) days,
          we each agree to resolve any claim, dispute, or controversy (excluding
          any Boombox claims for injunctive or other equitable relief) arising
          out of or in connection with or relating to this Agreement, or the
          breach or alleged breach thereof (collectively, &quot;Claims&quot;), by
          binding arbitration by JAMS, Inc. (&quot;JAMS&quot;), under the
          Optional Expedited Arbitration Procedures then in effect for JAMS,
          except as provided herein.
        </p>
        <p className="mb-4">
          If you are using the Site or obtaining the Storage Services for
          commercial purposes, the following applies: The arbitration will be
          conducted in Santa Clara County, California, unless you and Boombox
          agree otherwise. Each party will be responsible for paying any JAMS
          filing, administrative and arbitrator fees in accordance with JAMS
          rules. The award rendered by the arbitrator shall include costs of
          arbitration, reasonable attorneys&apos; fees and reasonable costs for
          expert and other witnesses, and any judgment on the award rendered by
          the arbitrator may be entered in any court of competent jurisdiction.
          Nothing in this Section shall be deemed as preventing Boombox from
          seeking injunctive or other equitable relief from the courts as
          necessary to protect any of Boombox&apos;s proprietary interests. If
          you are using the Site or obtaining the Storage Services for
          noncommercial purposes, the following applies: JAMS may be contacted at
          www.jamsadr.com and may require you to pay a fee for the initiation of
          your case unless you apply for and successfully obtain a fee waiver
          from JAMS. The arbitration will be conducted in Santa Clara County,
          California (or the nearest JAMS office), unless you request an in-
          person hearing in your hometown or you and Boombox agree otherwise. The
          award rendered by the arbitrator may include your costs of arbitration,
          your reasonable attorney&apos;s fees and your reasonable costs for
          expert and other witnesses, and any judgment on the award rendered by
          the arbitrator may be entered in any court of competent jurisdiction.
          Nothing in this Section shall prevent either party from seeking
          injunctive or other equitable relief from the court as necessary to
          prevent the actual or threatened infringement, misappropriation, or
          violation of such party's data security, Intellectual Property Rights
          or other proprietary rights. You may sue in a small claims court of
          competent jurisdiction without first engaging in arbitration, but this
          does not absolve you of your commitment to engage in the informal
          dispute resolution process. WITH RESPECT TO ALL PERSONS AND ENTITIES,
          REGARDLESS OF WHETHER THEY HAVE OBTAINED THE SITE OR STORAGE SERVICES
          FOR PERSONAL, COMMERCIAL OR OTHER PURPOSES, ALL CLAIMS MUST BE BROUGHT
          IN THE PARTIES' INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS
          MEMBER IN ANY PURPORTED CLASS ACTION, COLLECTIVE ACTION, PRIVATE
          ATTORNEY GENERAL ACTION OR OTHER REPRESENTATIVE PROCEEDING. THIS WAIVER
          APPLIES TO CLASS ARBITRATION, AND, UNLESS WE AGREE OTHERWISE, THE
          ARBITRATOR MAY NOT CONSOLIDATE MORE THAN ONE PERSON's CLAIMS. YOU AGREE
          THAT, BY ENTERING INTO THIS AGREEMENT, YOU AND Boombox ARE EACH WAIVING
          THE RIGHT TO A TRIAL BY JURY OR TO PARTICIPATE IN A CLASS ACTION,
          COLLECTIVE ACTION, PRIVATE ATTORNEY GENERAL ACTION, OR OTHER
          REPRESENTATIVE PROCEEDING OF ANY KIND.
        </p>
        <h2 className="font-bold mb-10 mt-10">GENERAL</h2>
        <h2 className="mb-6 mt-6">Liability</h2>
        <p className="mb-4">
          If during the moving process you help or assist the moving team with
          moving any items Boombox is not liable for damage done to said items.
          Boombox is not liable for any injuries to customers who voluntarily
          help during the moving process.
        </p>
        <p className="mb-4">
          Boombox can not insure the contents of any box not packed by Boombox
          employees. Since Boombox is not aware of the initial condition of any
          items placed in boxes, we can not insure the contents of said boxes.
        </p>
        <h2 className="mb-6 mt-6">Assignment</h2>
        <p className="mb-4">
          This Agreement, and any rights and licenses granted hereunder, may not
          be transferred or assigned by you, but may be assigned by Boombox
          without restriction. Any attempted transfer or assignment in violation
          hereof shall be null and void.
        </p>
        <h2 className="mb-6 mt-6">Force Majeure</h2>
        <p className="mb-4">
          Notwithstanding anything to the contrary, Boombox will not be liable or
          responsible for any damage to or loss of any Stored Items, or failure
          to perform, or delay in performance of, any of its obligations under
          this Agreement, including without limitation any Storage Services, that
          is caused by events outside its reasonable control (including but not
          limited to) acts of God, flood, earthquake, windstorm or other natural
          disaster; war, armed conflict, terrorist attack, civil war, civil
          commotion or riots; nuclear, chemical or biological contamination or
          sonic boom; any law or government order, rule, regulation or direction,
          or any action taken by a government or public authority; fire,
          explosion or accidental damage; adverse weather conditions; interruption
          or failure of utility service, including but not limited to electric
          power, gas or water; any labor dispute, including but not limited to
          strikes, industrial action or lockouts; non-performance or delay by
          suppliers or subcontractors; and failure of plant machinery, machinery,
          vehicles, computers, the Internet or telecommunications (each, a
          &quot;Force Majeure Event&quot;).
        </p>
        <h2 className="mb-6 mt-6">
          Notification Procedures and Changes to the Agreement
        </h2>
        <p className="mb-4">
          Boombox may provide notifications, whether such notifications are
          required by law or are for marketing or other business related
          purposes, to you via email notice, written or hard copy notice, or
          through posting of such notice on our website, as determined by Boombox
          in our sole discretion. Boombox reserves the right to determine the
          form and means of providing notifications to our Users, provided that
          you may opt out of certain means of notification as described in this
          Agreement. Boombox is not responsible for any automatic filtering you
          or your network provider may apply to email notifications we send to
          the email address you provide us. Boombox may, in its sole discretion,
          modify or update this Agreement from time to time, and so you should
          review this page periodically. When we change the Agreement in a
          material manner, we will update the &quot;last modified&quot; date at
          the bottom of this page. Your continued use of the Site or Storage
          Services after any such change constitutes your acceptance of the new
          Terms of Use. If you do not agree to any of these terms or any future
          Terms of Use, do not use or access (or continue to use or access) the
          Site or Storage Services.
        </p>
        <h2 className="mb-6 mt-6">Entire Agreement/Severability</h2>
        <p className="mb-4">
          This Agreement, together with the Privacy Policy, Limited Warranty
          Policy, Pricing and Payment Terms, Delivery Zone List any amendments to
          any of the foregoing, and any additional agreements you may enter into
          with Boombox in connection with the Site or Storage Services, shall
          constitute the entire agreement between you and Boombox concerning the
          Site and Storage Services. If any provision of this Agreement is deemed
          invalid by a court of competent jurisdiction, the invalidity of such
          provision shall not affect the validity of the remaining provisions of
          this Agreement, which shall remain in full force and effect, except
          that in the event of the unenforceability of the universal Class
          Action/Jury Trial Waiver, the entire arbitration agreement shall be
          unenforceable.
        </p>
        <h2 className="mb-6 mt-6">No Waiver</h2>
        <p className="mb-4">
          No waiver of any term of this Agreement shall be deemed a further or
          continuing waiver of such term or any other term, and Boombox&apos;s
          failure to assert any right or provision under this Agreement shall not
          constitute a waiver of such right or provision.
        </p>
        <h2 className="mb-6 mt-6">Contact</h2>
        <p className="mb-4">
          Please contact us at help@boomboxstorage.com with any questions
          regarding this Agreement.
        </p>
        <p className="mb-4">This Agreement was last modified on 1/7/2017.</p>
      </div>
    </div>
  );
}

