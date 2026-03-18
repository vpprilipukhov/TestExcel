import { Table, Text, UnstyledButton } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getFiles, FileUpload } from '../api/client';
import dayjs from 'dayjs';

interface Props {
  onSelectFile: (file: FileUpload) => void;
  selectedFileId: number | null;
}

export function FilesTable({ onSelectFile, selectedFileId }: Props) {
  const { data: files, isLoading } = useQuery({
    queryKey: ['files'],
    queryFn: getFiles,
  });

  if (isLoading) return <Text>Загрузка...</Text>;
  if (!files || files.length === 0) return <Text c="dimmed">Нет загруженных файлов</Text>;

  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>ID</Table.Th>
          <Table.Th>Имя файла</Table.Th>
          <Table.Th>Кол-во строк</Table.Th>
          <Table.Th>Пользователь</Table.Th>
          <Table.Th>Дата загрузки</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {files.map((file) => (
          <Table.Tr
            key={file.id}
            style={{
              cursor: 'pointer',
              backgroundColor: file.id === selectedFileId ? 'var(--mantine-color-blue-light)' : undefined,
            }}
          >
            <Table.Td>
              <UnstyledButton onClick={() => onSelectFile(file)} w="100%">
                {file.id}
              </UnstyledButton>
            </Table.Td>
            <Table.Td>
              <UnstyledButton onClick={() => onSelectFile(file)} w="100%">
                {file.originalName}
              </UnstyledButton>
            </Table.Td>
            <Table.Td>
              <UnstyledButton onClick={() => onSelectFile(file)} w="100%">
                {file.rowCount}
              </UnstyledButton>
            </Table.Td>
            <Table.Td>
              <UnstyledButton onClick={() => onSelectFile(file)} w="100%">
                {file.uploadedBy}
              </UnstyledButton>
            </Table.Td>
            <Table.Td>
              <UnstyledButton onClick={() => onSelectFile(file)} w="100%">
                {dayjs(file.uploadedAt).format('DD.MM.YYYY HH:mm')}
              </UnstyledButton>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
