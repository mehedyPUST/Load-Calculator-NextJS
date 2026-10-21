import MaxLoadView from "@/components/MaxLoadView";

export const metadata = {
  title: "Max Load | WZPDCL Bottail",
  description: "Monthly maximum load per feeder",
};

export default function MaxLoadPage() {
  return (
    <div className="flex-1 flex justify-center items-stretch p-0 md:p-3 min-h-0">
      <div className="w-full max-w-xl h-[100dvh] md:h-[calc(100dvh-5rem)]">
        <MaxLoadView />
      </div>
    </div>
  );
}
