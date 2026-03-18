import type { JSX } from "react";

import { ScientificActivity } from "@/components/sections/ScientificActivity";
import type { ScientificActivityData } from "@/components/sections/scientific-activity.types";

const scientificActivityData: ScientificActivityData = {
  title: "Наукова діяльність",
  headingVariant: "compact",
  contentSpacing: "my",
  image: {
    src: "/images/logo-compact.jpg",
    alt: "Scientific activity",
    width: 684,
    height: 672,
  },
  description:
    "Викладачі кафедри працюють над науково-дослідною темою «Математичні методи, моделі та інформаційні технології в освіті, науці, бізнесі», 0123U103522, доктор фізико-математичних наук, професор Нікітін Анатолій Володимирович.",
};

export const ITScientificActivity = (): JSX.Element => {
  return <ScientificActivity data={scientificActivityData} />;
};
