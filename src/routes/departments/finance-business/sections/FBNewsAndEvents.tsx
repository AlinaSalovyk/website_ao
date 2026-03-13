import type { JSX } from "react";
import { NewsAndEvents } from "@/components/sections/NewsAndEvents";
import type { NewsAndEventsData } from "@/components/sections/news-and-events.types";

const newsAndEventsData: NewsAndEventsData = {
  title: "Новини та події",
  moreNewsLabel: "Більше новин",
  moreNewsHref: "/#news",
  items: [
    {
      id: 1,
      badge: "НОВИНА ТИЖНЯ",
      date: "Feb 19",
      title: "When an Award-Winning\nWebsite Pays for Itself\n(Twice)",
      readTime: "MIN READ",
      backgroundImage: "/images/Home/news-background.png",
      linkLabel: "Дізнатися більше",
      linkHref: "/#news",
    },
    {
      id: 2,
      badge: "НОВИНА ТИЖНЯ",
      date: "Feb 19",
      title: "When an Award-Winning\nWebsite Pays for Itself\n(Twice)",
      readTime: "MIN READ",
      backgroundImage: "/images/Home/news-background-1.png",
      linkLabel: "Дізнатися більше",
      linkHref: "/#news",
    },
    {
      id: 3,
      badge: "НОВИНА ТИЖНЯ",
      date: "Feb 19",
      title: "When an Award-Winning\nWebsite Pays for Itself\n(Twice)",
      readTime: "MIN READ",
      backgroundImage: "/images/Home/news-background-2.png",
      linkLabel: "Дізнатися більше",
      linkHref: "/#news",
    },
    {
      id: 4,
      badge: "НОВИНА ТИЖНЯ",
      date: "Feb 19",
      title: "When an Award-Winning\nWebsite Pays for Itself\n(Twice)",
      readTime: "MIN READ",
      backgroundImage: "/images/Home/news-background-3.png",
      linkLabel: "Дізнатися більше",
      linkHref: "/#news",
    },
  ],
};

export const FBNewsAndEvents = (): JSX.Element => {
  return <NewsAndEvents data={newsAndEventsData} />;
};
