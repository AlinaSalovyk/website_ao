import { api, ADMIN_BASE, API_BASE, getToken } from "./client";
import type { DocumentRecord, ReindexAllResult } from "../types/api.types";

export const fetchDocuments = () => api<DocumentRecord[]>(`${ADMIN_BASE}/documents`);
export const deleteDocument = (id: string) => api<unknown>(`${ADMIN_BASE}/documents/${id}`, { method: "DELETE" });

const UPLOAD_POLL_TIMEOUT_MS = 5 * 60 * 1000; 

export const uploadDocument = async (file: File) => {
  const token = getToken();
  const fd = new FormData();
  fd.append("file", file);
  const h: Record<string, string> = {};
  if (token) h["Authorization"] = `Bearer ${token}`;
  
  const uploadRes = await fetch(`${API_BASE}${ADMIN_BASE}/documents/upload`, { method: "POST", headers: h, body: fd });
  if (!uploadRes.ok) throw new Error(await uploadRes.text());
  
  const { job_id } = await uploadRes.json() as { job_id: string };

  return new Promise<void>((resolve, reject) => {
    const startedAt = Date.now();

    const check = async () => {
      if (Date.now() - startedAt > UPLOAD_POLL_TIMEOUT_MS) {
        reject(new Error(
          "Час очікування закінчився (5 хв). Перевірте документи — файл міг завантажитися успішно."
        ));
        return;
      }

      try {
        const jobRes = await fetch(`${API_BASE}${ADMIN_BASE}/documents/jobs/${job_id}`, { headers: h });
        if (!jobRes.ok) throw new Error("Failed to check status");
        
        const job = await jobRes.json() as { status: string; error: string; progress: number };
        
        if (job.status === "completed") {
          resolve();
        } else if (job.status === "failed") {
          reject(new Error(job.error || "Upload failed during processing"));
        } else {
          setTimeout(check, 1500); 
        }
      } catch (err) {
        reject(err);
      }
    };
    setTimeout(check, 1000);
  });
};

export const renameDocument = (id: string, newName: string) => api<unknown>(`${ADMIN_BASE}/documents/${id}/rename`, {
  method: "PATCH",
  body: JSON.stringify({ filename: newName }),
});

export const getDocumentDownloadUrl = (id: string) => `${API_BASE}${ADMIN_BASE}/documents/${id}/download`;

export const reindexDocument = (documentId: string) =>
  api<{ status: string; document_id: string }>(`${ADMIN_BASE}/documents/${documentId}/reindex`, {
    method: "POST",
  });

export const reindexAll = () =>
  api<ReindexAllResult>(`${ADMIN_BASE}/documents/reindex-all`, {
    method: "POST",
  });

export const pollJobStatus = async (jobId: string, authHeaders: Record<string, string>) => {
  const res = await fetch(`${API_BASE}${ADMIN_BASE}/documents/jobs/${jobId}`, { headers: authHeaders });
  if (!res.ok) throw new Error("Failed to check status");
  return res.json() as Promise<{ status: string; error: string; progress: number; current_step: string }>;
};
