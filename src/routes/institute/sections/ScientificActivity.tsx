import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";
import { cn } from "@/lib/utils";
import type { JSX } from "react";
import React, { useState } from "react";

interface ScientificItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

export const ScientificActivity = ({
  locale,
}: {
  locale?: Locale;
}): JSX.Element => {
  const t = getTranslations(locale);

  const scientificData: ScientificItem[] = [
    {
      id: "01",
      title: t.instituteScientificActivity.researchDirections,
      content: (
        <ul className="space-y-4">
          {t.instituteScientificActivity.departments.map((dept, index) => (
            <li
              key={index}
              className="text-gray-300 text-sm md:text-base leading-relaxed"
            >
              <strong className="text-white block mb-1">{dept.heading}</strong>
              {dept.text}
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: "02",
      title: t.instituteScientificActivity.publications,
      content: (
        <div className="space-y-4 text-gray-300 text-sm md:text-base leading-relaxed">
          {t.instituteScientificActivity.publicationsContent.map(
            (text, index) => (
              <p key={index}>{text}</p>
            ),
          )}
        </div>
      ),
    },
    {
      id: "03",
      title: t.instituteScientificActivity.conferences,
      content: (
        <ul className="space-y-2 text-gray-300 text-sm md:text-base leading-relaxed list-decimal pl-5">
          {t.instituteScientificActivity.conferencesContent.map(
            (text, index) => (
              <li key={index}>{text}</li>
            ),
          )}
        </ul>
      ),
    },
  ];
  const [openItems, setOpenItems] = useState<string[]>(["01"]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  return (
    <section
      id="scientific-activity"
      className="w-full bg-footer-bg py-24 text-white"
    >
      <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-9">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-16 lg:gap-24">
          {/* Title Section */}
          <div>
            <h2 className="font-bold text-4xl md:text-5xl lg:text-6xl leading-[1.1] text-white">
              {t.institute.scientificActivity.title}
            </h2>
          </div>

          {/* Accordion List */}
          <div className="flex flex-col">
            {scientificData.map((item) => (
              <div
                key={item.id}
                className="border-b border-white/20 last:border-0"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full flex items-center justify-between py-6 group text-left cursor-pointer"
                >
                  <div className="flex items-start gap-1 md:gap-2">
                    <span className="text-sm md:text-base font-medium text-accent-number mt-1">
                      {item.id}
                    </span>
                    <span className="text-lg md:text-xl font-medium transition-colors group-hover:text-blue-400 text-left">
                      {item.title}
                    </span>
                  </div>
                  <div className="grid place-items-center w-6 h-6">
                    <div className="w-4 h-[1px] bg-white transition-transform duration-300 [grid-area:1/1]" />
                    <div
                      className={cn(
                        "w-4 h-[1px] bg-white transition-transform duration-300 [grid-area:1/1]",
                        openItems.includes(item.id) ? "rotate-0" : "-rotate-90",
                      )}
                    />
                  </div>
                </button>

                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    openItems.includes(item.id)
                      ? "max-h-[800px] opacity-100 pb-8"
                      : "max-h-0 opacity-0",
                  )}
                >
                  <div className="pl-12 md:pl-10">{item.content}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
