import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { DataTable } from './DataTable';
import * as client from '../api/client';

vi.mock('../api/client', () => ({
  getFileRows: vi.fn(),
  getWordDownloadUrl: vi.fn((id: number) => `/api/rows/${id}/word`),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <MantineProvider>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </MantineProvider>,
  );
}

const mockRows: client.ExcelRow[] = [
  {
    id: 1,
    fileUploadId: 1,
    cardindexId: '1',
    clientId: 'C001',
    clientName: 'ООО Тест',
    documentNumber: '12345',
    status: 'Active',
    documentDate: '01.01.2025',
    documentAmount: '150000.00',
    paymentBalance: '50000.00',
    currency: 'RUB',
    operationType: '01',
    paymentPurpose: 'Оплата по договору №123',
    paymentPriority: '5',
    payerInn: '7701234567',
    payerName: 'ООО Плательщик',
    payerCorrAccount: '30101810400000000225',
    payerBankBik: '044525225',
    payerBank: 'ПАО Сбербанк',
    payerAccount: '40702810938000012345',
    recipientInn: '7709876543',
    recipientBank: 'АО Альфа-Банк',
    recipientCorrAccount: '30101810200000000593',
    recipientBik: '044525593',
    recipientBankName: 'АО Альфа-Банк',
    recipientAccount: '40702810100000054321',
    deliveryType: 'электронно',
  },
];

describe('DataTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state', () => {
    vi.mocked(client.getFileRows).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<DataTable fileId={1} fileName="test.xlsx" />);
    expect(screen.getByText('Загрузка данных...')).toBeInTheDocument();
  });

  it('should show empty state when no data', async () => {
    vi.mocked(client.getFileRows).mockResolvedValueOnce([]);
    renderWithProviders(<DataTable fileId={1} fileName="test.xlsx" />);
    await waitFor(() => {
      expect(screen.getByText('Нет данных')).toBeInTheDocument();
    });
  });

  it('should render data rows with key columns', async () => {
    vi.mocked(client.getFileRows).mockResolvedValueOnce(mockRows);
    renderWithProviders(<DataTable fileId={1} fileName="test.xlsx" />);

    await waitFor(() => {
      expect(screen.getByText('ООО Тест')).toBeInTheDocument();
      expect(screen.getByText('12345')).toBeInTheDocument();
      expect(screen.getByText('01.01.2025')).toBeInTheDocument();
      expect(screen.getByText('150000.00')).toBeInTheDocument();
      expect(screen.getByText('7701234567')).toBeInTheDocument();
      expect(screen.getByText('ООО Плательщик')).toBeInTheDocument();
    });
  });

  it('should have Word download button for each row', async () => {
    vi.mocked(client.getFileRows).mockResolvedValueOnce(mockRows);
    renderWithProviders(<DataTable fileId={1} fileName="test.xlsx" />);

    await waitFor(() => {
      const wordButton = screen.getByText('Word');
      expect(wordButton).toBeInTheDocument();
      const link = wordButton.closest('a');
      expect(link).toHaveAttribute('href', '/api/rows/1/word');
    });
  });

  it('should display file name and row count in header', async () => {
    vi.mocked(client.getFileRows).mockResolvedValueOnce(mockRows);
    renderWithProviders(<DataTable fileId={1} fileName="test.xlsx" />);

    await waitFor(() => {
      expect(screen.getByText(/test\.xlsx/)).toBeInTheDocument();
      expect(screen.getByText(/1 строк/)).toBeInTheDocument();
    });
  });
});
