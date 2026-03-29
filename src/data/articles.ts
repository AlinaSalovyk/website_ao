import type { Locale } from "@/i18n";

export interface Article {
  slug: string;
  date: string;
  image: string;
  thumbnail?: string;
  title: Record<Locale, string>;
  summary: Record<Locale, string>;
  content: Record<Locale, string[]>;
}

export const articles: Article[] = [
  {
    slug: "itb-open-doors-day-2026",
    date: "2026-03-15",
    image: "linear-gradient(135deg, #0f172a 0%, #1e40af 50%, #7c3aed 100%)",
    title: {
      uk: "День відкритих дверей в Інституті ІТ та бізнесу",
      en: "Open Doors Day at the Institute of IT and Business",
    },
    summary: {
      uk: "Запрошуємо абітурієнтів та їхніх батьків на День відкритих дверей! Ви зможете дізнатися про наші освітні програми, відвідати лабораторії та поспілкуватися з викладачами.",
      en: "We invite prospective students and their parents to our Open Doors Day! You'll learn about our educational programs, visit laboratories, and meet our faculty.",
    },
    content: {
      uk: [
        "15 березня 2026 року Інститут інформаційних технологій та бізнесу Національного університету «Острозька академія» проводить День відкритих дверей для абітурієнтів та їхніх батьків.",
        "Під час заходу ви зможете дізнатися про освітні програми бакалаврату, магістратури та аспірантури, познайомитися з викладачами та студентами інституту, відвідати навчальні лабораторії робототехніки та VR-технологій.",
        "Ми підготували для вас цікаву програму: презентації кафедр, екскурсії лабораторіями, інтерактивні майстер-класи та індивідуальні консультації з питань вступу. Наші студенти поділяться власним досвідом навчання та розкажуть про можливості, які відкриває навчання в інституті.",
        "Захід відбудеться за адресою: м. Острог, вул. Семінарська, 2. Початок о 10:00. Реєстрація — на першому поверсі. Чекаємо на вас!",
      ],
      en: [
        "On March 15, 2026, the Institute of Information Technologies and Business at the National University of Ostroh Academy is hosting an Open Doors Day for prospective students and their parents.",
        "During the event, you'll learn about bachelor's, master's, and postgraduate educational programs, meet the institute's faculty and students, and visit the robotics and VR technology laboratories.",
        "We've prepared an exciting program: department presentations, laboratory tours, interactive workshops, and individual admission consultations. Our students will share their learning experience and tell you about the opportunities that studying at the institute opens up.",
        "The event will take place at: 2 Seminarska St., Ostroh. Starting at 10:00 AM. Registration is on the first floor. We look forward to seeing you!",
      ],
    },
  },
  {
    slug: "vr-lab-launch",
    date: "2026-02-20",
    image: "linear-gradient(135deg, #064e3b 0%, #059669 50%, #34d399 100%)",
    title: {
      uk: "Відкрито лабораторію інноваційних систем моделювання та цифрової візуалізації",
      en: "Laboratory of Innovative Simulation and Digital Visualization Systems Launched",
    },
    summary: {
      uk: "В інституті відкрито нову лабораторію для роботи з VR/AR, цифровими двійниками та ігровими технологіями. Студенти вже працюють над першими проєктами.",
      en: "A new laboratory for VR/AR, digital twins, and game technologies has been opened at the institute. Students are already working on their first projects.",
    },
    content: {
      uk: [
        "Інститут інформаційних технологій та бізнесу відкрив лабораторію інноваційних систем моделювання, симуляції та цифрової візуалізації — простір для створення прикладних VR/AR-рішень на перетині науки, технологій і креативу.",
        "Лабораторія оснащена сучасним обладнанням для віртуальної та доповненої реальності, комп'ютерами з потужними графічними станціями та програмним забезпеченням для 3D-моделювання та візуалізації.",
        "Студенти вже працюють над реальними проєктами у сфері архітектурної візуалізації, цифрових двійників, WebGL та ігрових технологій. Лабораторія відповідає на потребу у створенні прикладних цифрових рішень для бізнесу, університетів і державних структур.",
        "Керівник лабораторії Місай Володимир Віталійович зазначив: «Наша мета — створити середовище, де студенти навчаються на реальних комерційних кейсах, здобуваючи актуальний професійний досвід».",
      ],
      en: [
        "The Institute of Information Technologies and Business has launched the Laboratory of Innovative Modeling, Simulation, and Digital Visualization Systems — a space for creating applied VR/AR solutions at the intersection of science, technology, and creativity.",
        "The laboratory is equipped with modern virtual and augmented reality equipment, computers with powerful graphics workstations, and software for 3D modeling and visualization.",
        "Students are already working on real projects in architectural visualization, digital twins, WebGL, and game technologies. The laboratory meets the need for creating applied digital solutions for businesses, universities, and government agencies.",
        "Laboratory head Misai Volodymyr Vitaliiovych noted: 'Our goal is to create an environment where students learn from real commercial cases, gaining relevant professional experience.'",
      ],
    },
  },
  {
    slug: "robotics-competition-2026",
    date: "2026-01-28",
    image: "linear-gradient(135deg, #7c2d12 0%, #ea580c 50%, #fbbf24 100%)",
    title: {
      uk: "Студенти інституту здобули перемогу на змаганнях з робототехніки",
      en: "Institute Students Win Robotics Competition",
    },
    summary: {
      uk: "Команда студентів інституту зайняла перше місце на Всеукраїнських змаганнях з робототехніки, представивши інноваційний проєкт автономного навігаційного робота.",
      en: "A team of institute students took first place at the All-Ukrainian Robotics Competition, presenting an innovative autonomous navigation robot project.",
    },
    content: {
      uk: [
        "Команда студентів кафедри інформаційних технологій та аналітики даних Інституту ІТ та бізнесу здобула перше місце на Всеукраїнських змаганнях з робототехніки, що відбулися в Києві 28 січня 2026 року.",
        "Студенти представили інноваційний проєкт автономного навігаційного робота, розробленого в науково-дослідній лабораторії робототехніки та вбудованих систем з прикладним AI. Робот продемонстрував вражаючі результати у завданнях навігації, розпізнавання об'єктів та автономного прийняття рішень.",
        "Керівник лабораторії Мельничук Олександр Павлович відзначив високий рівень підготовки студентів та їхню здатність працювати з реальними R&D-проєктами. «Наші студенти проходять повний цикл розробки — від ідеї й прототипу до тестування», — зазначив він.",
        "Цей результат підтверджує високий рівень технологічної підготовки в інституті та практичну спрямованість навчальних програм.",
      ],
      en: [
        "A team of students from the Department of Information Technologies and Data Analytics at the Institute of IT and Business took first place at the All-Ukrainian Robotics Competition held in Kyiv on January 28, 2026.",
        "Students presented an innovative autonomous navigation robot project, developed in the Research Laboratory of Robotics and Embedded Systems with Applied AI. The robot demonstrated impressive results in navigation tasks, object recognition, and autonomous decision-making.",
        "Laboratory head Melnychuk Oleksandr Pavlovych noted the high level of student preparation and their ability to work with real R&D projects. 'Our students go through the full development cycle — from idea and prototype to testing,' he said.",
        "This result confirms the high level of technological training at the institute and the practical focus of educational programs.",
      ],
    },
  },
  {
    slug: "international-partnership-expansion",
    date: "2025-12-10",
    image: "linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #a78bfa 100%)",
    title: {
      uk: "Інститут розширює міжнародну співпрацю з університетами Європи",
      en: "Institute Expands International Cooperation with European Universities",
    },
    summary: {
      uk: "Підписано нові угоди про академічну мобільність та спільні освітні програми з університетами Польщі, Чехії та Литви.",
      en: "New agreements on academic mobility and joint educational programs have been signed with universities in Poland, Czech Republic, and Lithuania.",
    },
    content: {
      uk: [
        "Інститут інформаційних технологій та бізнесу продовжує активно розвивати міжнародну співпрацю. У грудні 2025 року підписано нові угоди про академічну мобільність та спільні освітні програми з провідними університетами Польщі, Чехії та Литви.",
        "Угоди передбачають обмін студентами та викладачами, спільні наукові дослідження, участь у міжнародних грантових програмах та розробку подвійних дипломних програм.",
        "За словами керівництва інституту, міжнародна співпраця є ключовим пріоритетом розвитку. «Ми прагнемо надати нашим студентам можливість отримати міжнародний досвід та розширити професійні горизонти. Навчання за кордоном допомагає сформувати глобальне бачення та конкурентні переваги на ринку праці», — зазначили в інституті.",
        "Студенти інституту вже мають можливість брати участь у програмах обміну та стажуваннях за кордоном, а нові угоди значно розширюють ці можливості.",
      ],
      en: [
        "The Institute of Information Technologies and Business continues to actively develop international cooperation. In December 2025, new agreements on academic mobility and joint educational programs were signed with leading universities in Poland, the Czech Republic, and Lithuania.",
        "The agreements provide for student and faculty exchanges, joint scientific research, participation in international grant programs, and the development of double diploma programs.",
        "According to the institute's leadership, international cooperation is a key development priority. 'We strive to provide our students with the opportunity to gain international experience and expand their professional horizons. Studying abroad helps develop a global perspective and competitive advantages in the job market,' the institute noted.",
        "Institute students already have the opportunity to participate in exchange programs and internships abroad, and the new agreements significantly expand these opportunities.",
      ],
    },
  },
];

function parseArticleDate(dateStr: string): Date {
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  return new Date(Date.UTC(year, month - 1, day));
}

export function getArticles(): Article[] {
  return articles;
}

export function getSortedArticles(): Article[] {
  return [...articles].sort(
    (a, b) =>
      parseArticleDate(b.date).getTime() - parseArticleDate(a.date).getTime(),
  );
}

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getLatestArticles(count: number): Article[] {
  return getSortedArticles().slice(0, count);
}

export function formatArticleDate(dateStr: string, locale: Locale): string {
  const date = parseArticleDate(dateStr);
  return date.toLocaleDateString(locale === "uk" ? "uk-UA" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
