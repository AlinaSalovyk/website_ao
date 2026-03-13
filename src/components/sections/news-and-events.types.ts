export interface NewsEventItem {
  id: string | number;
  badge: string;
  date: string;
  title: string;
  readTime: string;
  backgroundImage: string;
  linkLabel: string;
  linkHref?: string;
}

export interface NewsAndEventsData {
  sectionId?: string;
  title: string;
  moreNewsLabel: string;
  moreNewsHref: string;
  items: NewsEventItem[];
}
