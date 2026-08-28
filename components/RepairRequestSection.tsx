import RepairRequestSlot from "@/components/RepairRequestSlot";

// The "book a repair" band that every landing page carries under its hero.
// Only the heading changes between pages: the brand hubs name the page, the
// model pages name the device family.
export default function RepairRequestSection({ heading }: { heading: string }) {
  return (
    <section id="repair-request" className="border-y border-line bg-white">
      <div className="mx-auto max-w-[1240px] px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto mb-8 max-w-[640px] text-center">
          <div className="mb-3 text-sm font-extrabold tracking-wide text-accent">
            درخواست تعمیر
          </div>
          <h2 className="text-[26px] font-extrabold tracking-tight text-ink-900 sm:text-[32px]">
            {heading}
          </h2>
          <p className="mt-3 text-base leading-8 text-ink-500">
            فرم زیر را پر کنید تا کارشناسان ما در ساعات کاری با شما تماس بگیرند
            و پیش از هر اقدامی بازه هزینه را اعلام کنند. ثبت درخواست رایگان است.
          </p>
        </div>
        <RepairRequestSlot />
      </div>
    </section>
  );
}
