/**
 * @fileoverview FAQ data for help center
 * @source boombox-10.0/src/app/data/faq.tsx
 * 
 * DATA STRUCTURE:
 * Contains all FAQ questions, answers, and categories for the help center.
 * Answers support React components for rich formatting.
 * 
 * @refactor Direct migration with no changes to preserve existing FAQ content
 */

import Link from "next/link";

export const faqs: { question: string; answer: React.ReactNode; category: string; image: string; }[] = [
    {
      question: "What is Boombox?",
      answer: (
        <>
          Boombox is a mobile storage company that manages the pick up, storage, and delivery of your extra things. Boombox comes to you so that you never have to deal with the frustration and inconvenience of using a self-storage facility again.
          <br />
          <br />
          With just a click of a button, you can have a storage unit delivered right to your door, saving you time, money, and stress.
          <br />
          <br />
          Boombox is the modern storage solution to fit your busy lifestyle.
        </>
      ),
      category: "General",
      image: "",
    },
    {
      question: "How do I prepare and pack my belongings for transit?",
      answer: (
        <>
            <p>
                When loading your Boombox storage container in the San Francisco Bay Area, keep these four crucial concepts in mind to ensure your belongings are organized and secure:
            </p>
          <br />
            <ol className="list-decimal list-inside ml-6" style={{ listStylePosition: 'outside'}}>
                <li className="mb-2">
                <span className="font-semibold">Organize Your Items into Tiers:</span> Think of each tier as a wall or stack within the container, starting with the heaviest items at the bottom and lighter items on top. This method helps maintain balance and stability during transit.
                </li>
                <li className="mb-2">
                <span className="font-semibold">Strategize Your Loading Process:</span> Begin your loading at the back of the container and move forward. The base of each tier, composed of your sturdiest items like dressers or desks, should support the weight of the items above.
                </li>
                <li className="mb-2">
                <span className="font-semibold">Distribute Weight Evenly:</span> Place heavy items around the base of the container to evenly distribute weight, ensuring a stable and secure load.
                </li>
                <li className="mb-2">
                <span className="font-semibold">Fill Gaps and Protect Items:</span> Utilize soft materials like furniture pads, blankets, and pillows to fill spaces between items, preventing shifts and scratches. Disassemble furniture to save space and wrap each piece to protect from damage.
                </li>
            </ol>
        </>
      ),
      category: "General",
      image: "",
    },
    {
        question: "What are some good packing tips and guidelines?",
        answer: (
        <>
            <p>
                Packing your belongings with care is equally important. Here are some tips and guidelines to protect your items during the move:
            </p>
            <br />
            <ul className="list-disc list-inside ml-6" style={{ listStylePosition: 'outside'}}>
                <li className="mb-2">
                <strong>Protect Your Electronics:</strong> For items like flat-screen TVs, using specialized moving boxes and padding them against cushioned surfaces can prevent damage.
                </li>
                <li className="mb-2">
                <strong>Prevent Items from Shifting:</strong> Inside boxes, use bubble wrap, packing peanuts, or packing paper to fill any voids, keeping your items stationary and safe.
                </li>
                <li className="mb-2">
                <strong>Choose the Right Box Sizes:</strong> Small boxes are ideal for heavy, compact items; medium boxes for larger appliances and lamp shades; and large boxes for bulky, lighter items like pillows and linens. These soft items can also be used to fill gaps in the container.
                </li>
                <li className="mb-2">
                <strong>Specialty Boxes:</strong> Utilize specialty boxes for fragile items such as lamps, mirrors, and framed artwork to ensure they travel safely. Dishes and kitchenware should be packed in sturdy boxes with additional wrapping for protection.
                </li>
                <li className="mb-2">
                <strong>Wardrobe Boxes for Clothing:</strong> To avoid wrinkles and damage, use wardrobe boxes for clothing that needs to remain hanging.
                </li>
            </ul>
            <br />
            <p>
                By following these guidelines, you can ensure your belongings are packed securely and arrive safely at your destination in the San Francisco Bay Area, making your move as smooth and stress-free as possible.
            </p>
        </>
        ),
        category: "General",
        image: "",
    },
    {
        question: "How does Boombox work?",
        answer: (
          <>
            Boombox arrives at your delivery location with a mobile storage unit. You can pack the unit yourself or get paired with local pros. If you want to remember the items you've stored, we recommend taking photos of your stored items, which you can then upload later to your account page.
            <br />
            <br />
            Once your storage unit is packed, our Boombox delivery driver will return your unit to our secure storage facility.
            <br />
            <br />
            Whenever you need access to your storage unit, simply log in to your Boombox account, select the unit you need delivered, and we'll deliver it right to your door. You'll never have to hassle with a San Francisco storage unit again! And best of all, our storage unit prices are better than most all San Francisco self-storage options.
          </>
        ),
        category: "General",
        image: "",
      },
    {
      question: "How much time do I have to load my unit?",
      answer: (
        <>
        <p>You can take as much time as you need! However, the less time you take packing your unit the less you'll pay.</p>
        <br />
        <p>The first 60 mins are free. The driver will arrive at your delivery address and once you have been contacted your first hour of free loading time will begin. If you pack your container within that first hour - GREAT! - you won't be charged for your delivery. If you need more time, no worries! The driver can wait at your location while you pack at a rate of $55/hr.</p>
        <br />
        <p>Before ordering a Boombox, we recommend going through our pre pickup checklist to make sure you are prepared and ready to go before your crew arrives. Typically, we can have a Boombox container delivered with as little as 1 days notice so make sure prepare before you order to have your move go as smoothy as possible.</p>
        <br />
        <strong>Initial 60 mins are Free</strong>
        <strong>$50/hr after first hour</strong>
        <br />
        <p>Our mobile storage solutions are designed to fit seamlessly into the urban landscape of the San Francisco Bay Area. Our storage units are engineered to be delivered directly to your location ensuring easy access and efficient use of space.</p>
        </>
      ),
      category: "Delivery",
      image: "",
    },
    {
      question: "How do I access my Boombox storage container?",
      answer: 
      <>
      <p>We try to make delivery as easy as possible!</p>
        <br />
      <p>You can access your storage unit Monday through Saturday, 8:30 am to 5:30 pm, by setting up a delivery request on your account page.</p>
        <br />
      <p>A Boombox delivery driver will bring your storage unit straight to your door, all with straightforward, flat-rate pricing.</p>
        <br />
      <p>Please be mindful of the driver's time to keep things moving smoothly, limiting the loading and unloading to just what's needed.</p>
        <br />
      <strong>Delivery is a $45 flat rate</strong>
      </>,
      category: "Storage Access",
      image: "",
    },
    {
        question: "Can I add more items to storage?",
        answer: (
          <>
            Sure thing! You can add additional items to your existing storage unit as needed by requesting a delivery of your unit from your account page.
            <br />
            <br />
            A Boombox delivery expert will bring your storage unit straight to your door, all with straightforward, flat-rate pricing. Please be mindful of the driver's time to keep things moving smoothly, limiting the loading and unloading to just what's needed.
            <br />
            <br />
            If you need to store additional items that won't fit in your existing Boombox, you can request to add an additional unit to your account by logging on to your user page and setting up an appointment.
            <br />
            <br />
            Delivery of an existing storage unit is a $45 flat rate.
          </>
        ),
        category: "Storage Access",
        image: "",
      },
      {
        question: "What's included in my Boombox quote?",
        answer: (
          <>
            Your Boombox quote includes the full amount you'll pay on the day of your initial delivery. Including:
            <br />
            <br />
            - Your first month's rent
            <br />
            - Loading Help (Optional)
            <br />
            - Insurance Coverage (Optional)
            <br />
            <br />
            All Boombox containers come with 5 complimentary moving blankets, and access to a floor dolly.
          </>
        ),
        category: "Pricing",
        image: "",
      },
      {
        question: "When do I pay for my initial Boombox delivery?",
        answer: (
          <>
            You won't be charged until the day of your delivery.
            <br />
            <br />
            We ask for credit card information in order to hold your reservation to ensure our operation runs smoothly.
            <br />
            <br />
            We charge a reversible $10 charge to make sure the card is valid.
            <br />
            <br />
            Every month or 30 days after your initial storage delivery we will charge your credit card on file for your monthly storage payment.
          </>
        ),
        category: "Pricing",
        image: "",
      },
      {
        question: "How much does Boombox cost?",
        answer: (
          <>
            The cost of your Boombox varies based on your needs. Typically, our costs are below the average self-storage rate for your area. With all the added convenience, we think that's a pretty awesome deal!
            <br />
            <br />
            To get an accurate quote for your Boombox, click <a href="/quote">here</a>.
            <br />
            <br />
            Or you can check out our pricing page to get a general idea of the overall costs by clicking <a href="/pricing">here</a>.
          </>
        ),
        category: "Pricing",
        image: "",
      },
      {
        question: "How big are Boombox containers?",
        answer: (
          <>
            Boombox containers are 5 feet wide by 8 feet long by 8 feet tall. The precise outside dimensions are 5' (60") wide x 8' (96") long x 8' (90") high.
            <br />
            <br />
            The internal dimensions of our moving containers are approximately 56" wide x 90" long x 90" high. Capacity is 257 cubic feet, holding up to 1,000lbs.
            <br />
            <br />
            Each portable storage container has a large door for easy access and will typically accommodate an average room to a room and a half of household goods and furniture. Boombox containers rest about 6 inches off the ground to ensure that your belongings are safe and dry. A King size mattress will fit standing up. A California King mattress will fit standing up as well.
            <br />
            <br />
            Please make sure to measure your larger items to ensure they will fit.
          </>
        ),
        category: "Storage Unit Sizes",
        image: "",
      },
      {
        question: "How do I know how many Boombox containers I will need?",
        answer: (
          <>
            The best way to estimate the exact amount of containers you'll need is by checking out our space calculator tool. Just enter in the items you plan on storing, and you'll know exactly how many containers you will need.
            <br />
            <br />
            If you end up needing more containers, no problem! We can typically send out another container the next day.
            <br />
            <br />
            Please be mindful of the amount of containers you request. Our quick delivery turnaround times give you flexibility, so you don't need to over-order upfront. We prefer you order as you go to prevent delivering containers that go unused.
          </>
        ),
        category: "Storage Unit Sizes",
        image: "",
      },
      {
        question: "What time can I expect my Boombox to be delivered?",
        answer: (
          <>
            When you are booking your delivery appointment, you can specify a 1-hour delivery window that works best for you.
            <br />
            <br />
            We know you are busy, and we always want to be respectful of your time. That's why, with real-time tracking, you'll always know exactly when your Boombox is set to arrive within the 1-hour delivery window you requested.
          </>
        ),
        category: "Delivery",
        image: "",
      },
      {
        question: "If I choose to have multiple Boombox containers delivered, will all of them arrive at the same time?",
        answer: (
          <>
            We will send a max of two Boombox containers at the same time to ensure there is enough space at your delivery address for your move to go smoothly.
            <br />
            <br />
            The remaining container deliveries will be staggered an hour after the first two containers have been delivered.
          </>
        ),
        category: "Scheduling",
        image: "",
      },
      {
        question: "Will Boombox load the container for me?",
        answer: (
          <>
            We partner with local moving pros for all moving labor needs. You can add labor help to your order when booking your initial delivery.
            <br />
            <br />
            Our delivery drivers will bring your Boombox to your delivery address but are not expected or insured to help with moving your belongings into the container.
            <br />
            <br />
            We can let you use a floor dolly to help move your items, but if you don't add moving help to your order, you are expected to load the container yourself.
          </>
        ),
        category: "Labor",
        image: "",
      },
      {
        question: "What should I do to prepare my belongings for storage or transport inside the Boombox containers?",
        answer: (
          <>
            Before you begin loading, make sure to follow these simple steps:
            <br />
            <br />
            - Disassemble furniture as much as you can, especially bedframes and table legs.
            <br />
            - Drain water connections from appliances (mini-fridges, washing machines, etc.).
            <br />
            - Make sure you aren't storing anything flammable (gasoline, fireworks, etc.).
            <br />
            - Label boxes to quickly identify them during unpacking.
            <br />
            - Wrap your furniture items in moving blankets and plastic to prevent them from being scratched.
            <br />
            <br />
            You can check out our full pre-delivery checklist <a href="#">here</a>.
          </>
        ),
        category: "Best Practices",
        image: "",
      },      
      {
        question: "How do I keep my belongings from shifting during transit?",
        answer: (
          <>
            The best way to avoid shifting is to make sure your Boombox container is packed properly. Your heaviest items should be loaded towards the bottom center of the container and distributed evenly.
            <br />
            <br />
            Please remember that each container can hold up to 1,000lbs. If you have a lot of heavy furniture, it is best to split it between multiple containers.
            <br />
            <br />
            Another key is to fill any gaps with furniture pads or soft items to make sure there is no room for contents to shift.
            <br />
            <br />
            If you are nervous that you won't be able to pack your container properly, no problem! Our network of local pros are more than capable of packing your container correctly.
          </>
        ),
        category: "Best Practices",
        image: "",
      },
      {
        question: "How do I end my Boombox storage plan?",
        answer: (
          <>
            To end your storage term, simply log on to your account and book a delivery on your account page. In the delivery form, please make sure to note that this is your final delivery.
            <br />
            <br />
            To end the account, you'll need to make sure your container is completely free of items at the end of your delivery appointment.
            <br />
            <br />
            Once your container is returned empty, your monthly storage bill will end, and you will no longer be charged moving forward.
          </>
        ),
        category: "Pricing",
        image: "",
      },
      {
        question: "What items cannot be placed in my Boombox?",
        answer: (
          <>
            Don't store anything that's illegal and/or unsafe.
            <br />
            <br />
            We don't store anything that goes boom, such as guns (or weapons of any kind), explosives, fireworks, and other flammables like gas, oil, kerosene, paint, and lighter fluid.
            <br />
            <br />
            Anything that is or was alive. This includes things like fruit, meats, cheeses, animals, insects, fungal or bacterial cultures, etc.
            <br />
            <br />
            Anything that is (or was) edible. This includes any perishable and non-perishable food items. Anything that's illegal, such as drugs, drug paraphernalia, stolen property, and anything else that you can get arrested for possessing.
            <br />
            <br />
            Anything that smells, oozes, leaks, or bursts, such as hazardous items, toxic materials, items that produce gas or odors, any container with liquids, items that produce loud or disruptive noises, and items that may increase in size or burst. Basically, anything that might get outside of your box or bin and harm others, our customers' and employees' belongings, or our storage facility.
          </>
        ),
        category: "Best Practices",
        image: "",
      },
      {
        question: "How do I make changes to my existing reservation?",
        answer: (
          <>
            You can edit existing reservations as well as cancel reservations by logging on to your account page.
            <br />
            <br />
            On your account page, you will see all your upcoming appointments. From there you'll be able to make edits to all your existing appointments.
          </>
        ),
        category: "Scheduling",
        image: "",
      },
      {
        question: "How do I cancel my reservation? Is there a cancellation fee?",
        answer: (
          <>
            You can edit existing reservations as well as cancel reservations by logging on to your account page.
            <br />
            <br />
            On your account page, you will see all your upcoming appointments. Locate the upcoming appointment you would like to cancel and hit the "cancel reservation" button.
            <br />
            <br />
            We ask for at least 12 hours notice for cancellations. If we don't receive 24 hours notice, you'll be subject to a $65 fee.
          </>
        ),
        category: "Scheduling",
        image: "",
      },
      {
        question: "Are my items stored in a secure location?",
        answer: (
          <>
            Of course. Security is one of our top priorities. Boombox storage locations are 24/7 monitored, and only authorized personnel are allowed on premises.
            <br />
            <br />
            Each storage unit is made of sturdy, steel construction and padlocked to ensure only you have access to your items.
          </>
        ),
        category: "Security",
        image: "",
      },
      {
        question: "What happens if one of my items gets damaged?",
        answer: (
          <>
            We always handle your storage unit with care; however, it is up to you to make sure your unit is packed properly to ensure no items shift during transit.
            <br />
            <br />
            We don't insure items that are damaged due to being improperly packed, but our comprehensive insurance coverage protects against any potential hazards in the unlikely event that they occur.
            <br />
            <br />
            You can find our full insurance coverage details <a href="#">here</a>.
          </>
        ),
        category: "Insurance",
        image: "",
      },
      {
        question: "How do I upload photos I took of my stored items?",
        answer: (
          <>
            To help ensure you remember the items you have in storage, you can upload your own photos of the contents you stored on your account page.
            <br />
            <br />
            You'll find a picture of your storage unit on your account page and a link to upload your stored photos. Simply click on the link to upload your stored item photos.
          </>
        ),
        category: "Delivery",
        image: "",
      },
      {
        question: "I moved outside the service area, how do I get my stored belongings back?",
        answer: (
          <>
            We don't offer shipping services outside our service area. To have your items moved out of our service area, please contact us at <span className="font-semibold">help@boomboxstorage.com</span> and we can help facilitate a move with a moving company of your choosing.
          </>
        ),
        category: "Locations",
        image: "",
      },

      {
        question: "Can I visit my stuff in storage?",
        answer: (
          <>
            For security purposes, our storage facilities are closed to the public. With Boombox you can always view your storage units online by logging in to your Boombox account.
            <br />
            <br />
            Whenever you need a storage unit returned, just go online and schedule a drop-off. Or, if you need to add more stuff to your storage plan, you can book another unit delivery online as well.
          </>
        ),
        category: "Storage Access",
        image: "",
      },
      {
        question: "Where does Boombox deliver to?",
        answer: (
          <>
            Boombox proudly serves the San Francisco Bay Area. For a complete map of our storage service area, visit our <Link href="/locations" className="font-semibold">Locations page</Link>.
          </>
        ),
        category: "Locations",
        image: "",
      },
      {
        question: "Is there a minimum payment term?",
        answer: (
          <>
            Yes, the minimum payment term is 2 months. You can receive your items back before the two-month period has ended, but you'll still be charged for the minimum term of 2 months.
            <br />
            <br />
            If you have a clear idea of how long you'll be storing your items, please let us know as it helps us make sure our operation runs smoothly.
          </>
        ),
        category: "Pricing",
        image: "",
      },
      {
        question: "When is my first bill?",
        answer: (
          <>
            Your first month's storage bill is charged on the day your storage unit is delivered. Then your next bill is recurring every 30 days after your initial delivery.
            <br />
            <br />
            You can check all your past invoices on your account page as well as update your payment information.
          </>
        ),
        category: "Pricing",
        image: "",
      },
      {
        question: "How does Boombox handle billing?",
        answer: (
          <>
            Billing is automatic so you don't have to worry about putting in your credit card information every month.
            <br />
            <br />
            Due to banking fees associated with automatic payments, we charge a payment processing fee of 3.5% of your total storage bill.
          </>
        ),
        category: "Pricing",
        image: "",
      },
      {
        question: "How do I update my billing information?",
        answer: (
          <>
            If you need to update your payment method on file you can do so on your account page.
            <br />
            <br />
            Please do not email, text, or call in your credit card details. The most secure way to update your payment method is through your account page.
          </>
        ),
        category: "Pricing",
        image: "",
      },
      {
        question: "Can I store furniture?",
        answer: (
          <>
            Of course! All we ask is that you protect the furniture appropriately and that you let us know if your furniture item is over 100 lbs.
            <br />
            <br />
            To ensure your furniture is safe in transit, we recommend disassembling larger items such as bed frames and dining tables.
          </>
        ),
        category: "General",
        image: "",
      },
      {
        question: "What is the weight limit of each Boombox container?",
        answer: (
          <>
            Each unit has a strict weight limit of 1000lbs. Our mobile storage trailers are not designed
            to carry any weight over 1000lbs, and any additional weight can be dangerous for our drivers 
            or cause damage to your unit or trailer.
            <br />
            <br />
            Please let us know if you plan on storing a lot of heavy items (pallets of books, large furniture items, etc.).
          </>
        ),
        category: "Storage unit sizes",
        image: "",
      },
      {
        question: "How much does labor cost?",
        answer: (
          <>
            Labor costs depend on a couple of factors: the location of your delivery, the duration of 
            your move, and the date scheduled.
            <br />
            <br />
            If you need help during peak hours (weekends), labor will cost more.
            <br />
            <br />
            We will give as accurate an estimate as we can when you go through the website to get a quote.
          </>
        ),
        category: "Labor",
        image: "",
      },
      {
        question: "What happens if my hired movers damage an item?",
        answer: (
          <>
            We pair you with local moving pros who are licensed and insured. Any damage or disputes 
            during your pickup should be handled directly with the moving company that helped load 
            your storage unit.
            <br />
            <br />
            Our insurance covers your items in transit as well as during storage, but not during 
            the moving process.
          </>
        ),
        category: "Labor",
        image: "",
      },

  ];

