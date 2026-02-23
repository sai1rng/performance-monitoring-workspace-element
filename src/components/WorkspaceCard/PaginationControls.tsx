import { Dropdown, PageIndicator } from '@bosch/react-frok';
import { ChangeEvent, FC, MouseEvent } from 'react';

interface PaginationControlsProps {
  totalPages: number;
  currentPage: number;
  onPageSelect: (event: MouseEvent<HTMLElement>) => void;
  onPageSizeChange: (pageSize: number) => void;
  disabled?: boolean;
}

const ROW_OPTIONS = [5, 10, 20];

const PaginationControls: FC<PaginationControlsProps> = ({
  totalPages,
  currentPage,
  onPageSelect,
  onPageSizeChange,
  disabled,
}) => {
  const handlePageSizeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onPageSizeChange(Number(e.target.value) * 2);
  };

  return (
    <div className="grid grid-cols-3 items-center">
      <div></div>
      <div className="flex justify-center">
        <PageIndicator
          numbered
          pages={totalPages}
          selected={currentPage + 1}
          onPageSelect={onPageSelect}
          disabled={disabled}
        />
      </div>
      <div className="flex justify-end">
        <Dropdown
          className="w-44"
          label="Rows per page"
          onChange={handlePageSizeChange}
          options={ROW_OPTIONS.map((size) => ({
            label: size.toString(),
            value: size,
            name: size.toString(),
          }))}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default PaginationControls;
