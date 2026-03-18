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
      На кафедрі виконується комплексна науково-дослідна тема
      «Теоретико-методологічні та практичні аспекти підвищення якості системи
      управління підприємствами та організаціями», науковий керівник – доктор
      економічних наук, доцент Козак Л. В. Кафедрою щорічно проводиться
      Всеукраїнська науково-практична онлайн-конференція молодих учених та
      студентів{" "}
      <a
        href="https://ecj.oa.edu.ua/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-leadership-link transition-colors"
      >
        «Проблеми та перспективи розвитку національної економіки в умовах
        глобалізації».
      </a>
    </>
  ),
};

export const MMScientificActivity = (): JSX.Element => {
  return <ScientificActivity data={scientificActivityData} />;
};
