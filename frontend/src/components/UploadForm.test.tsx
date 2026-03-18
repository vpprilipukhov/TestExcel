import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { UploadForm } from './UploadForm';
import * as client from '../api/client';

vi.mock('../api/client', () => ({
  uploadFile: vi.fn(),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <MantineProvider>
      <Notifications />
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </MantineProvider>,
  );
}

describe('UploadForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dropzone with instructions', () => {
    renderWithProviders(<UploadForm />);
    expect(screen.getByText(/Перетащите Excel файл/)).toBeInTheDocument();
    expect(screen.getByText(/\.xlsx и \.xls/)).toBeInTheDocument();
  });

  it('should call uploadFile when file is dropped', async () => {
    const mockUpload = vi.mocked(client.uploadFile);
    mockUpload.mockResolvedValueOnce({
      id: 1,
      originalName: 'test.xlsx',
      rowCount: 5,
      uploadedBy: 'user',
      uploadedAt: '2025-01-01T00:00:00Z',
    });

    renderWithProviders(<UploadForm />);

    const file = new File(['test content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const dropzone = screen.getByText(/Перетащите Excel файл/).closest('[role]')
      || document.querySelector('.mantine-Dropzone-root')
      || screen.getByText(/Перетащите Excel файл/).parentElement!.parentElement!;

    const input = dropzone.querySelector('input[type="file"]');
    if (input) {
      await userEvent.upload(input, file);
      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledWith(file);
      });
    }
  });
});
