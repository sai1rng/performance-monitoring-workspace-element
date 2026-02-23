import { ReactNode } from 'react';
import { Table, TableHead, TableBody, TableRow, TableCell, Button, PageIndicator } from '@bosch/react-frok';

export interface ColumnDef<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  cellRenderer?: (value: any, item: T) => ReactNode;
  width?: string;
}

export interface ActionButton<T> {
  label?: string;
  icon: string;
  onClick: (item: T) => void;
  className?: string;
  showLabel?: boolean | ((item: T) => boolean);
}

export interface FlexTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  actions?: ActionButton<T>[];
  title?: string;
  className?: string;
  keyExtractor: (item: T) => string | number;
  emptyStateMessage?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

function FlexTable<T>({
  data,
  columns,
  actions,
  title,
  className = '',
  keyExtractor,
  emptyStateMessage,
  pagination,
}: FlexTableProps<T>) {
  const hasActions = actions && actions.length > 0;

  const allColumns = [...columns];
  if (hasActions) {
    allColumns.push({
      header: 'Actions',
      accessor: () => null,
      cellRenderer: (_: any, item: T) => (
        <div className="flex gap-2">
          {actions.map((action, actionIndex) => (
            <Button
              key={actionIndex}
              icon={action.icon}
              label={
                action.showLabel
                  ? typeof action.showLabel === 'function'
                    ? action.showLabel(item)
                      ? action.label
                      : undefined
                    : action.label
                  : undefined
              }
              className={action.className}
              onClick={() => action.onClick(item)}
            />
          ))}
        </div>
      ),
    } as ColumnDef<T>);
  }
  return (
    <div className={`space-y-8 ${className}`}>
      {title && <p className="text-2xl font-semibold">{title}</p>}
      <Table>
        <TableHead>
          <TableRow>
            {allColumns.map((column, index) => (
              <TableCell key={index} header style={{ width: column.width, backgroundColor: 'white' }}>
                {column.header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.length > 0 ? (
            data.map((item) => (
              <TableRow key={keyExtractor(item)}>
                {allColumns.map((column, index) => (
                  <TableCell key={index}>{renderCellContent(item, column)}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell style={{ textAlign: 'center', padding: '1.5rem 0' }} colSpan={allColumns.length}>
                {emptyStateMessage || 'No data available'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <PageIndicator
            numbered
            pages={pagination.totalPages}
            selected={pagination.currentPage}
            onPageSelect={(event) => {
              const pageNumber = Number(event.currentTarget.getAttribute('data-index'));
              if (!isNaN(pageNumber)) {
                pagination.onPageChange(pageNumber);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

// Helper function to render cell content
function renderCellContent<T>(item: T, column: ColumnDef<T>): ReactNode {
  const accessor = column.accessor;
  let value;

  if (typeof accessor === 'function') {
    value = accessor(item);
  } else {
    value = item[accessor as keyof T];
  }

  if (column.cellRenderer) {
    return column.cellRenderer(value, item);
  }

  return value as ReactNode;
}

export default FlexTable;
