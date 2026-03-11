import Image from 'next/image';
import Link from 'next/link';
import { MinimalNavbar } from '@/components/ui/navigation/MinimalNavbar';
import { Button } from '@/components/ui/primitives';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MinimalNavbar theme="light" />

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16 max-w-3xl w-full">
          <Image
            src="/404.png"
            alt="Boombox with tangled tape"
            width={420}
            height={420}
            priority
            className="w-64 sm:w-80 md:w-[420px] h-auto flex-shrink-0"
          />

          <div className="text-center md:text-left">
            <h1 className="font-poppins text-5xl sm:text-6xl font-bold text-text-primary mb-3">
              Oops!
            </h1>
            <p className="text-lg text-text-tertiary mb-8">
              Looks like you&apos;ve lost
              <br />
              the beat
            </p>
            <Link href="/">
              <Button variant="primary" size="sm" borderRadius="full">
                Homepage
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
