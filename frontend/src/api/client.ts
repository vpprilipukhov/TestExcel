import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export interface FileUpload {
  id: number;
  originalName: string;
  rowCount: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ExcelRow {
  id: number;
  fileUploadId: number;
  cardindexId: string;
  clientId: string;
  clientName: string;
  documentNumber: string;
  status: string;
  documentDate: string;
  documentAmount: string;
  paymentBalance: string;
  currency: string;
  operationType: string;
  paymentPurpose: string;
  paymentPriority: string;
  payerInn: string;
  payerName: string;
  payerCorrAccount: string;
  payerBankBik: string;
  payerBank: string;
  payerAccount: string;
  recipientInn: string;
  recipientBank: string;
  recipientCorrAccount: string;
  recipientBik: string;
  recipientBankName: string;
  recipientAccount: string;
  deliveryType: string;
}

export async function uploadFile(file: File): Promise<FileUpload> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<FileUpload>('/upload', formData);
  return data;
}

export async function getFiles(): Promise<FileUpload[]> {
  const { data } = await api.get<FileUpload[]>('/files');
  return data;
}

export async function getFileRows(fileId: number): Promise<ExcelRow[]> {
  const { data } = await api.get<ExcelRow[]>(`/files/${fileId}/rows`);
  return data;
}

export function getWordDownloadUrl(rowId: number): string {
  return `/api/rows/${rowId}/word`;
}
