import {
  Download,
  Eye,
  LogIn,
  LogOut,
  PencilLine,
  RotateCw,
  Shield,
  Trash2,
  Upload,
  UserMinus,
  UserPlus,
} from "lucide-react";
import type { ReactNode } from "react";

export interface ActionMetaInfo {
  icon: ReactNode;
  color: string;
  label: string;
}

export function getActionMeta(action: string): ActionMetaInfo {
  switch (action) {
    case "login":
      return { icon: <LogIn size={13} />, color: "green", label: "Вхід" };
    case "logout":
      return { icon: <LogOut size={13} />, color: "zinc", label: "Вихід" };
    case "upload_document":
      return { icon: <Upload size={13} />, color: "blue", label: "Завантаження" };
    case "delete_document":
      return { icon: <Trash2 size={13} />, color: "red", label: "Видалення" };
    case "rename_document":
      return { icon: <PencilLine size={13} />, color: "amber", label: "Перейменування" };
    case "reindex_document":
      return { icon: <RotateCw size={13} />, color: "purple", label: "Реіндексація" };
    case "reindex_all":
      return { icon: <RotateCw size={13} />, color: "purple", label: "Реіндексація всього" };
    case "export_csv":
      return { icon: <Download size={13} />, color: "cyan", label: "CSV Export" };
    case "view_analytics":
      return { icon: <Eye size={13} />, color: "blue", label: "Перегляд аналітики" };
    case "view_audit_log":
      return { icon: <Shield size={13} />, color: "zinc", label: "Перегляд audit" };
    case "add_admin":
      return { icon: <UserPlus size={13} />, color: "green", label: "Додано адміна" };
    case "remove_admin":
      return { icon: <UserMinus size={13} />, color: "red", label: "Видалено адміна" };
    default:
      return { icon: <Shield size={13} />, color: "zinc", label: action };
  }
}
