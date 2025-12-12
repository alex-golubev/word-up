import Image from 'next/image';

import { Button } from '~/presentation/components/ui';

import { Header } from './Header';

export function HeroSection() {
  return (
    <section className="min-h-screen bg-white px-8 py-6 lg:px-16">
      <div className="mx-auto max-w-7xl rounded-[2.5rem] bg-[#FFF5F1]">
        <Header />

        <div className="grid gap-8 px-8 pb-16 pt-8 lg:grid-cols-2 lg:px-16 lg:pb-24 lg:pt-12">
          <div className="flex flex-col justify-center">
            <h1 className="text-[2.75rem] font-light leading-tight text-zinc-900 lg:text-[3.25rem]">
              A <span className="font-semibold text-indigo-500">unique</span> approach
              <br />
              to learning foreign
              <br />
              languages online
            </h1>

            <p className="mt-6 max-w-md text-zinc-600">
              Learn at your own pace, with lifetime access on mobile and desktop
            </p>

            <Button href="/auth" size="large" className="mt-8 w-fit">
              Get started
            </Button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="relative">
              {/* Orange square container with clipped image */}
              <div className="relative z-10 h-[500px] w-[500px] rotate-12 overflow-hidden rounded-[3rem] bg-[#FFD6B0]">
                <Image
                  src="/hero-image.png"
                  alt="Student with notebooks"
                  width={600}
                  height={670}
                  className="-rotate-12 translate-y-8 scale-125 object-cover"
                  priority
                  fetchPriority="high"
                  loading="eager"
                />
              </div>
              {/* Transparent square behind */}
              <div className="absolute inset-0 z-0 h-[500px] w-[500px] -rotate-6 rounded-[3rem] bg-[#FFD6B0]/30" />

              <TestimonialCard />
              <CoursesCard />
              {/*<StudentsCard />*/}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard() {
  return (
    <div className="absolute -top-4 left-1/2 z-20 flex items-center gap-3 rounded-full bg-white px-4 py-2 shadow-lg">
      <div className="h-10 w-10 overflow-hidden rounded-full bg-amber-200">
        <div className="flex h-full w-full items-center justify-center text-xs font-medium text-amber-800">JC</div>
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-900">Jane Cooper</p>
        <p className="text-xs text-zinc-500">I loved the Italian course!</p>
      </div>
    </div>
  );
}

function CoursesCard() {
  return (
    <div className="absolute -right-8 top-1/4 z-20 rounded-2xl bg-white px-4 py-3 shadow-lg lg:-right-16">
      <p className="text-lg font-bold text-zinc-900">10+ Courses</p>
      <p className="text-xs text-zinc-500">Multiple Categories</p>
    </div>
  );
}
