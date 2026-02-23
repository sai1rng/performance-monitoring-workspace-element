import React from 'react';
import { Dropdown, TextArea, TextField } from '@bosch/react-frok';
import FormField from './molecules/forms/FormField';

interface WorkspaceDetailsTabProps {
  control: any;
  errors: any;
  compoundProducts?: any;
  isLoadingCompoundProducts: boolean;
}

export const WorkspaceDetailsTab: React.FC<WorkspaceDetailsTabProps> = React.memo(
  ({ control, errors, compoundProducts, isLoadingCompoundProducts }) => (
    <div className="flex flex-col gap-4">
      <FormField
        label="Name*"
        control={control}
        name="workspaceName"
        Component={TextField}
        error={errors.workspaceName}
      />
      <FormField
        label="Workspace URL*"
        control={control}
        name="workspaceUrlLink"
        Component={TextField}
        error={errors.workspaceUrlLink}
      />
      <FormField
        label="Compound Product Tag*"
        disabled={isLoadingCompoundProducts}
        control={control}
        name="compoundProducts"
        Component={Dropdown}
        options={
          compoundProducts?.compoundProducts?.map((product: any) => ({
            label: product.name,
            value: product.id,
          })) || []
        }
      />
      <FormField label="Description" control={control} name="workspaceDescription" Component={TextArea} />
    </div>
  )
);

WorkspaceDetailsTab.displayName = 'WorkspaceDetailsTab';
