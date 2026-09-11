import { AlertTriangle, Clock, CheckCircle } from "lucide-react";
import type { Role } from "../../types/api.types";

export interface RoleBadgeInfo {
  label: string;
  color: string;
}

export function getRoleBadge(role: Role): RoleBadgeInfo {
  switch (role) {
    case "super_admin":
      return { label: "Головний адмін", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" };
    case "news_editor":
      return { label: "Редактор новин", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
    case "chatbot_admin":
      return { label: "Адмін чат-бота", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
  }
}

export interface DeliveryBadgeInfo {
  label: string;
  color: string;
  icon: typeof AlertTriangle;
}

export function getDeliveryBadge(status?: string): DeliveryBadgeInfo {
  if (status === "delivery_failed") {
    return { label: "Помилка доставки", color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertTriangle };
  }
  if (status === "pending") {
    return { label: "В обробці", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Clock };
  }
  return { label: "Надіслано", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle };
}
