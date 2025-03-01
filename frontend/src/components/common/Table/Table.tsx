import { MantineReactTable, MRT_ColumnDef } from 'mantine-react-table';
import { Box } from '@mantine/core';

export interface TableColumn {
  accessorKey: string;
  header: string;
}

export interface TableProps<T extends Record<string, unknown>> {
  columns: MRT_ColumnDef<T>[];
  data: T[];
}

export default function Table<T extends Record<string, unknown>>({ columns, data }: TableProps<T>) {
  return (
    <Box>
      <MantineReactTable
        columns={columns}
        data={data}
        enableColumnActions={false}
        enableColumnFilters={false}
        enablePagination={true}
        enableSorting={true}
        mantineTableProps={{
          striped: true,
          highlightOnHover: true,
        }}
        initialState={{
          density: 'xs',
          pagination: { pageSize: 10, pageIndex: 0 },
        }}
      />
    </Box>
  );
}
