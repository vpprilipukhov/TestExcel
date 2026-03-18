import { useState } from 'react';
import { Container, Title, Stack, Paper, Divider } from '@mantine/core';
import { UploadForm } from './components/UploadForm';
import { FilesTable } from './components/FilesTable';
import { DataTable } from './components/DataTable';
import { FileUpload } from './api/client';

export default function App() {
  const [selectedFile, setSelectedFile] = useState<FileUpload | null>(null);

  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="lg">
        Excel Pilot
      </Title>

      <Stack gap="lg">
        <Paper shadow="xs" p="md" withBorder>
          <Title order={3} mb="sm">Загрузка файла</Title>
          <UploadForm />
        </Paper>

        <Paper shadow="xs" p="md" withBorder>
          <Title order={3} mb="sm">Загруженные файлы</Title>
          <FilesTable
            onSelectFile={setSelectedFile}
            selectedFileId={selectedFile?.id ?? null}
          />
        </Paper>

        {selectedFile && (
          <>
            <Divider />
            <Paper shadow="xs" p="md" withBorder>
              <DataTable fileId={selectedFile.id} fileName={selectedFile.originalName} />
            </Paper>
          </>
        )}
      </Stack>
    </Container>
  );
}
