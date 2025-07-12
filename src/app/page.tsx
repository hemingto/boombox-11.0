/**
 * @fileoverview Homepage component
 * @description Main landing page for boombox-11.0
 */

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold text-center sm:text-left">
          Boombox 11.0
        </h1>
        <p className="text-lg text-center sm:text-left">
          Clean slate refactoring project
        </p>
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="text-sm text-gray-600">
            Directory structure initialized ✅
          </p>
        </div>
      </main>
    </div>
  );
}
