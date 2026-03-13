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
  description: (
    <>
      Кафедра виконує науково-дослідну роботу на тему «Фінансове забезпечення
      сталого розвитку територіальних громад України» (номер державної
      реєстрації: 0125U003922). Видає Науковий журнал{" "}
      <a
        href="https://ecj.oa.edu.ua/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-leadership-link transition-colors"
      >
        «Наукові записки Національного університету «Острозька академія» серія
        «Економіка»
      </a>
      .
    </>
  ),
};

export const FBScientificActivity = (): JSX.Element => {
  return <ScientificActivity data={scientificActivityData} />;
};
