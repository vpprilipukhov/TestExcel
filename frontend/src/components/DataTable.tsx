import { Table, Button, Text, ScrollArea } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getFileRows, getWordDownloadUrl, ExcelRow } from '../api/client';

interface Props {
  fileId: number;
  fileName: string;
}

const VISIBLE_COLUMNS: { key: keyof ExcelRow; label: string }[] = [
  { key: 'documentDate', label: 'Дата документа' },
  { key: 'documentNumber', label: '№ документа' },
  { key: 'clientName', label: 'Клиент' },
  { key: 'payerInn', label: 'ИНН плательщика' },
  { key: 'payerName', label: 'Плательщик' },
  { key: 'documentAmount', label: 'Сумма' },
  { key: 'currency', label: 'Валюта' },
  { key: 'recipientInn', label: 'ИНН получателя' },
  { key: 'recipientBankName', label: 'Банк получателя' },
  { key: 'status', label: 'Статус' },
];

export function DataTable({ fileId, fileName }: Props) {
  const { data: rows, isLoading } = useQuery({
    queryKey: ['fileRows', fileId],
    queryFn: () => getFileRows(fileId),
  });

  if (isLoading) return <Text>Загрузка данных...</Text>;
  if (!rows || rows.length === 0) return <Text c="dimmed">Нет данных</Text>;

  return (
    <div>
      <Text fw={500} mb="sm">
        Данные файла: {fileName} ({rows.length} строк)
      </Text>
      <ScrollArea>
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Действие</Table.Th>
              {VISIBLE_COLUMNS.map((col) => (
                <Table.Th key={col.key}>{col.label}</Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>
                  <Button
                    size="xs"
                    variant="light"
                    component="a"
                    href={getWordDownloadUrl(row.id)}
                    target="_blank"
                  >
                    Word
                  </Button>
                </Table.Td>
                {VISIBLE_COLUMNS.map((col) => (
                  <Table.Td key={col.key}>
                    {(row as any)[col.key] ?? ''}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </div>
  );
}
