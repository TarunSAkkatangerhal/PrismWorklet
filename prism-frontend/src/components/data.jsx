import { 
  ListTodo, 
  CheckCircle2, 
  PauseCircle, 
  XCircle, 
  Trash2 
} from "lucide-react";

export const STATUS_OPTIONS = ["Ongoing", "Completed", "On Hold", "Dropped", "Terminated"];

export const statusIcons = {
  Ongoing: <ListTodo size={24} />,
  Completed: <CheckCircle2 size={24} />,
  "On Hold": <PauseCircle size={24} />,
  Dropped: <XCircle size={24} />,
  Terminated: <Trash2 size={24} />,
};