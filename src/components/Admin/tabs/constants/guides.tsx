/**
 * Page guide configurations for Admin tab views (Overview, Queries, Prompts, Documents, Admins, Audit).
 */
import {
  BarChart2,
  CalendarDays,
  Star,
  ThumbsUp,
  MessageSquare,
  Zap,
  ThumbsDown,
  ShieldOff,
  FlaskConical,
  SlidersHorizontal,
  Shuffle,
  Trophy,
  Brain,
  FileType,
  SearchCheck,
  RefreshCcw,
  Shield,
  UserPlus,
  Ban,
  Trash2,
  Activity,
  Fingerprint,
  Filter,
  Tag,
} from "lucide-react";
import type { PageGuideProps } from "../../ui/PageGuide";

export interface PageGuideConfig extends PageGuideProps {}

export const OVERVIEW_GUIDE: PageGuideConfig = {
  title: "Як користуватися цією сторінкою",
  summary: "Загальна статистика роботи чат-бота, швидкість відповідей та оцінки користувачів",
  categories: [
    {
      id: "stats",
      label: "Аналітика",
      icon: <BarChart2 size={13} />,
      items: [
        {
          title: "Аналітика запитів",
          desc: "Перевірка кількості звернень, швидкості відповідей та загальної популярності чат-бота.",
          type: "info",
        },
        {
          title: "Гістограма по днях",
          desc: "Відображає динаміку звернень користувачів за вибраний період (7, 14 або 30 днів).",
          type: "info",
        },
      ],
    },
    {
      id: "top",
      label: "Рейтинги",
      icon: <Star size={13} />,
      items: [
        {
          title: "Топ запити",
          desc: "Лідерборд найчастіших питань для аналізу популярних тем серед абітурієнтів.",
          type: "tip",
        },
        {
          title: "Задоволеність (Лайки / Дизлайки)",
          desc: "Відсоток успішних відповідей бота на основі зворотного зв'язку читачів.",
          type: "info",
        },
      ],
    },
  ],
};

export const QUERIES_GUIDE: PageGuideConfig = {
  title: "Як користуватися цією сторінкою",
  summary: "Детальний журнал звернень до вашого бота, перевірка часу відповідей та дизлайків",
  categories: [
    {
      id: "log",
      label: "Журнал",
      icon: <MessageSquare size={13} />,
      items: [
        {
          title: "Журнал запитів",
          desc: "Кожен рядок — це окреме запитання користувача до чат-бота.",
          type: "info",
        },
        {
          title: "Швидкість та Джерела",
          desc: "Показує час формування відповіді (Час) та кількість використаних документів.",
          type: "tip",
        },
      ],
    },
    {
      id: "quality",
      label: "Якість відповідей",
      icon: <ThumbsDown size={13} />,
      items: [
        {
          title: "Аналіз дизлайків",
          desc: "Позначає відповіді, які не задовольнили користувача (сигнал додати нові документи).",
          type: "warning",
        },
        {
          title: "Заблоковано",
          desc: "Запити, відхилені фільтрами безпеки або офф-топік перевіркою.",
          type: "warning",
        },
      ],
    },
  ],
};

export const PROMPTS_GUIDE: PageGuideConfig = {
  title: "Як користуватися цією сторінкою",
  summary: "A/B тестування характеру та системних інструкцій для штучного інтелекту",
  categories: [
    {
      id: "ab",
      label: "A/B Тестування",
      icon: <FlaskConical size={13} />,
      items: [
        {
          title: "A/B Тестування",
          desc: "Створюйте та порівнюйте різні варіанти характеру й ролі бота.",
          type: "info",
        },
        {
          title: "Випадковий вибір",
          desc: "Увімкніть кілька варіантів одночасно для автоматичного розподілу між студентами.",
          type: "tip",
        },
      ],
    },
    {
      id: "config",
      label: "Налаштування",
      icon: <SlidersHorizontal size={13} />,
      items: [
        {
          title: "Системна інструкція",
          desc: "Визначає tone of voice, лаконічність та поведінкові правила штучного інтелекту.",
          type: "info",
        },
        {
          title: "Оцінка рейтингу",
          desc: "Аналізуйте середній бал (Avg Score) на основі лайків для вибору переможця.",
          type: "tip",
        },
      ],
    },
  ],
};

export const DOCUMENTS_GUIDE: PageGuideConfig = {
  title: "Як користуватися цією сторінкою",
  summary: "Управління знаннями чат-бота (завантаження офіційних документів, положень та довідників)",
  categories: [
    {
      id: "upload",
      label: "Завантаження",
      icon: <Brain size={13} />,
      items: [
        {
          title: "Мозок бота",
          desc: "Завантажуйте офіційні документи, положення, накази та розклади.",
          type: "info",
        },
        {
          title: "Формати файлів",
          desc: "Підтримуються формати PDF, DOCX, XLSX, TXT для автоматичної індексації.",
          type: "tip",
        },
      ],
    },
    {
      id: "quality",
      label: "Якість даних",
      icon: <SearchCheck size={13} />,
      items: [
        {
          title: "Шукач відповідей",
          desc: "Бот аналізує вміст цих файлів і відповідає студентам точними фактами.",
          type: "info",
        },
        {
          title: "Актуальність",
          desc: "Оновлюйте застарілі документи, щоб бот завжди надавав точну інформацію.",
          type: "warning",
        },
      ],
    },
  ],
};

export const ADMINS_GUIDE: PageGuideConfig = {
  title: "Як користуватися сторінкою та відмінності дій",
  summary: "Правила керування доступом, ролями та різниця між деактивацією й видаленням",
  categories: [
    {
      id: "roles",
      label: "Ролі та Запрошення",
      icon: <Shield size={13} />,
      items: [
        {
          title: "Ролі та привілеї",
          desc: "Обирайте відповідну роль: Головний адмін (повний доступ), Редактор новин (CMS новин) або Адмін чат-бота (аналітика та знання).",
          type: "info",
        },
        {
          title: "Запрошення (OAuth)",
          desc: "Натисніть «Додати адміністратора», щоб надіслати лист із посиланням. Користувач активується після першого входу через Google.",
          type: "tip",
        },
      ],
    },
    {
      id: "actions",
      label: "Деактивація vs Видалення",
      icon: <Ban size={13} />,
      items: [
        {
          title: "Деактивувати (Disable)",
          desc: "Тимчасово блокує вхід, але зберігає запис у базі. У будь-який момент відновлюється в 1 клік кнопкою «Активувати».",
          type: "tip",
        },
        {
          title: "Видалити (Delete)",
          desc: "Остаточно вилучає запис з бази даних й анулює запрошення. Для повернення доступу доведеться надсилати нове запрошення.",
          type: "warning",
        },
      ],
    },
  ],
};

export const AUDIT_GUIDE: PageGuideConfig = {
  title: "Як користуватися Audit Log",
  summary: "Журнал безпеки та моніторинг операцій адміністраторів сайту",
  categories: [
    {
      id: "monitoring",
      label: "Моніторинг",
      icon: <Activity size={13} />,
      items: [
        {
          title: "Моніторинг дій",
          desc: "Фіксуються входи, виходи, завантаження документів, зміни ролей та масові реіндексації.",
          type: "info",
        },
        {
          title: "Ідентифікація",
          desc: "Кожен запис містить email адміністратора, IP-адресу та точний timestamp події.",
          type: "info",
        },
      ],
    },
    {
      id: "navigation",
      label: "Навігація",
      icon: <Filter size={13} />,
      items: [
        {
          title: "Фільтрація та Навігація",
          desc: "Перегляд записів по 20 на сторінку з можливістю миттєвого оновлення через кнопку «Оновити».",
          type: "tip",
        },
        {
          title: "Статуси дій",
          desc: "Кольорові бейджі підказують тип операції (зелений — вхід/додавання, червоний — видалення, синій — перегляд/завантаження).",
          type: "info",
        },
      ],
    },
  ],
};
