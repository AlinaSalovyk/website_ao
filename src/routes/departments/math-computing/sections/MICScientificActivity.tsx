import type { JSX } from "react";

import { ScientificActivity } from "@/components/sections/ScientificActivity";
import type { ScientificActivityData } from "@/components/sections/scientific-activity.types";

const scientificActivityData: ScientificActivityData = {
  title: "Наукова діяльність",
  headingVariant: "compact",
  contentSpacing: "my",
  imageFit: "contain",
  image: {
    src: "/images/Departments/dmc-logo.png",
    alt: "Scientific activity",
    width: 684,
    height: 672,
  },
  description: (
    <>
      Реалізація проєкту{" "}
      <a
        href="https://eudemct.oa.edu.ua/uk/holovna/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-leadership-link transition-colors"
      >
        «Моделювання та аналіз процесів інформаційної війни як інструмент
        захисту демократії в ЄС і протидії загрозам» (101238591 — EUDemCT —
        ERASMUS-JMO-2025-HEI-TCH-RSCH) (2026 — 2028 рр.).
      </a>{" "}
      <br />
      <br />
      На кафедрі працює науковий семінар "Методи побудови та аналізу
      детермінованих та стохастичних моделей систем".
    </>
  ),
};

export const MICScientificActivity = (): JSX.Element => {
  return <ScientificActivity data={scientificActivityData} />;
};
