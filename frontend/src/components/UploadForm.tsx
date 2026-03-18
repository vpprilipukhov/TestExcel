import { Group, Text } from '@mantine/core';
import { Dropzone, MS_EXCEL_MIME_TYPE } from '@mantine/dropzone';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadFile } from '../api/client';
import { notifications } from '@mantine/notifications';

const ACCEPTED_TYPES = [
  ...MS_EXCEL_MIME_TYPE,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export function UploadForm() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (file: File) => uploadFile(file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      notifications.show({
        title: 'Файл загружен',
        message: `${data.originalName} — ${data.rowCount} строк`,
        color: 'green',
      });
    },
    onError: () => {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось загрузить файл',
        color: 'red',
      });
    },
  });

  return (
    <Dropzone
      onDrop={(files) => {
        if (files[0]) mutation.mutate(files[0]);
      }}
      accept={ACCEPTED_TYPES}
      maxSize={50 * 1024 * 1024}
      loading={mutation.isPending}
      multiple={false}
    >
      <Group justify="center" gap="xl" mih={120} style={{ pointerEvents: 'none' }}>
        <div>
          <Text size="xl" inline>
            Перетащите Excel файл сюда или нажмите для выбора
          </Text>
          <Text size="sm" c="dimmed" inline mt={7}>
            Поддерживаются .xlsx и .xls файлы
          </Text>
        </div>
      </Group>
    </Dropzone>
  );
}
