import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { FilesTable } from './FilesTable';
import * as client from '../api/client';

vi.mock('../api/client', () => ({
  getFiles: vi.fn(),
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

const mockFiles: client.FileUpload[] = [
  {
    id: 1,
    originalName: 'file1.xlsx',
    rowCount: 10,
    uploadedBy: 'user',
    uploadedAt: '2025-01-01T10:00:00Z',
  },
  {
    id: 2,
    originalName: 'file2.xlsx',
    rowCount: 5,
    uploadedBy: 'admin',
    uploadedAt: '2025-01-02T12:00:00Z',
  },
];

describe('FilesTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state', () => {
    vi.mocked(client.getFiles).mockReturnValue(new Promise(() => {})); // never resolves
    renderWithProviders(<FilesTable onSelectFile={() => {}} selectedFileId={null} />);
    expect(screen.getByText('Загрузка...')).toBeInTheDocument();
  });

  it('should show empty state when no files', async () => {
    vi.mocked(client.getFiles).mockResolvedValueOnce([]);
    renderWithProviders(<FilesTable onSelectFile={() => {}} selectedFileId={null} />);
    await waitFor(() => {
      expect(screen.getByText('Нет загруженных файлов')).toBeInTheDocument();
    });
  });

  it('should render files in table', async () => {
    vi.mocked(client.getFiles).mockResolvedValueOnce(mockFiles);
    renderWithProviders(<FilesTable onSelectFile={() => {}} selectedFileId={null} />);

    await waitFor(() => {
      expect(screen.getByText('file1.xlsx')).toBeInTheDocument();
      expect(screen.getByText('file2.xlsx')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('should call onSelectFile when row is clicked', async () => {
    vi.mocked(client.getFiles).mockResolvedValueOnce(mockFiles);
    const onSelect = vi.fn();
    renderWithProviders(<FilesTable onSelectFile={onSelect} selectedFileId={null} />);

    await waitFor(() => {
      expect(screen.getByText('file1.xlsx')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('file1.xlsx'));
    expect(onSelect).toHaveBeenCalledWith(mockFiles[0]);
  });
});
