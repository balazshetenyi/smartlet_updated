import FaqAccordion from "./_components/FaqAccordion";

export default function SupportPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2C3E50]">Help & Support</h1>
        <p className="text-gray-500 text-sm mt-1">
          Answers to common questions and ways to get in touch
        </p>
      </div>
      <FaqAccordion />
    </div>
  );
}
