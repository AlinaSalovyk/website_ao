import { Badge } from "../ui";
import type { JSX } from "react";

export const StatusBadge = ({ status, deleted }: { status: string; deleted?: boolean }): JSX.Element => {
  if (deleted) return <Badge color="red">Видалено</Badge>;
  if (status === "published") return <Badge color="green">Опубліковано</Badge>;
  return <Badge color="yellow">Чернетка</Badge>;
};
