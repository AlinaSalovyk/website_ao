export interface LeadershipMember {
  id: string | number;
  name: string;
  role: string;
  email: string;
  officeHours: string;
  image: string;
  imageAlt?: string;
}

export interface LeadershipData {
  sectionId?: string;
  title: string;
  members: LeadershipMember[];
  contactLabel?: string;
  officeHoursLabel?: string;
}
