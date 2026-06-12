"use client";

import { FAQ_CATEGORIES, SUPPORT_EMAIL } from "@kiado/shared/content/faq";
import { ChevronDown, Mail } from "lucide-react";
import { useState } from "react";

export default function FaqAccordion() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (key: string) =>
    setExpanded((prev) => (prev === key ? null : key));

  return (
    <div className="space-y-8">
      {FAQ_CATEGORIES.map((category) => (
        <section key={category.title}>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {category.title}
          </h2>
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
            {category.items.map((item, i) => {
              const key = `${category.title}-${i}`;
              const isOpen = expanded === key;
              return (
                <div key={key}>
                  <button
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => toggle(key)}
                  >
                    <span className="text-sm font-semibold text-[#2C3E50]">
                      {item.question}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-gray-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <p className="px-5 pb-4 text-sm text-gray-500 leading-relaxed">
                      {item.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* Contact section */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Still need help?
        </h2>
        <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#7C6CFF]/10 flex items-center justify-center">
            <Mail size={22} className="text-[#7C6CFF]" />
          </div>
          <p className="font-semibold text-[#2C3E50]">Contact Support</p>
          <p className="text-sm text-gray-500 max-w-sm">
            Our team is happy to help. We aim to respond within one business day.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="inline-flex items-center gap-2 bg-[#7C6CFF] hover:bg-[#6B5CE7] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors mt-1"
          >
            <Mail size={14} />
            Send us an email
          </a>
          <p className="text-xs text-gray-400">{SUPPORT_EMAIL}</p>
        </div>
      </section>
    </div>
  );
}
