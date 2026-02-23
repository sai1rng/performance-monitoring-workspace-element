import { useEffect, useRef, useCallback } from 'react';
import useProvisioningStore from '@stores/provisioningStore';
import { vewService } from '@services/vew.service';
import useNotification from '@hooks/useNotification';
import {
  PROVISIONING_POLLING_CONSTANTS,
  WORKSPACE_STATUS_CONSTANTS,
  WORKSPACE_FORM_CONSTANTS,
} from '@constants/workspace.constants';
import { useQueryClient } from '@tanstack/react-query';
import { getWorkspaceById } from '@services/workspace.services';
import { setCachedWorkspace } from '@utils/common';
import { QUERY_KEYS } from '@constants/QueryKeys';

export const ProvisionedCompoundProductPolling = () => {
  const notification = useNotification();
  const queryClient = useQueryClient();

  const compoundProductIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const completedCompoundProductsRef = useRef<Set<string>>(new Set());

  const isFinalStatus = useCallback((status: string): boolean => {
    const finalStatuses = [
      WORKSPACE_STATUS_CONSTANTS.STATUSES.LAUNCHED,
      WORKSPACE_STATUS_CONSTANTS.STATUSES.STARTING_ERROR,
      WORKSPACE_STATUS_CONSTANTS.STATUSES.STOPPED,
      WORKSPACE_STATUS_CONSTANTS.STATUSES.STOPPING_ERROR,
    ];

    return finalStatuses.includes(status as any);
  }, []);

  const refreshWorkspaceCache = useCallback(
    async (workspaceId: number) => {
      try {
        const updatedWorkspace = await getWorkspaceById(workspaceId);

        queryClient.setQueriesData({ queryKey: [QUERY_KEYS.WORKSPACES] }, (oldData: any) =>
          setCachedWorkspace(oldData, updatedWorkspace)
        );

        queryClient.setQueryData([QUERY_KEYS.WORKSPACES, workspaceId], updatedWorkspace);
      } catch (error) {
        console.error(`Error refreshing workspace cache for ${workspaceId}:`, error);
      }
    },
    [queryClient]
  );

  const handleFinalStatus = useCallback(
    async (
      status: string,
      compoundProductId: string,
      workspaceId: number,
      workspaceName: string,
      compoundProductVersionName: string
    ) => {
      const { removeProvisionedCompoundProduct } = useProvisioningStore.getState();

      switch (status) {
        case WORKSPACE_STATUS_CONSTANTS.STATUSES.LAUNCHED:
          notification.success(
            `Compound product "${compoundProductVersionName}" in workspace "${workspaceName}" started successfully`
          );
          await refreshWorkspaceCache(workspaceId);
          break;

        case WORKSPACE_STATUS_CONSTANTS.STATUSES.STARTING_ERROR:
          notification.error(
            `Failed to start compound product "${compoundProductVersionName}" in workspace "${workspaceName}". Please try again.`
          );
          break;

        case WORKSPACE_STATUS_CONSTANTS.STATUSES.STOPPED:
          notification.success(
            `Compound product "${compoundProductVersionName}" in workspace "${workspaceName}" stopped successfully`
          );
          await refreshWorkspaceCache(workspaceId);
          break;

        case WORKSPACE_STATUS_CONSTANTS.STATUSES.STOPPING_ERROR:
          notification.error(
            `Failed to stop compound product "${compoundProductVersionName}" in workspace "${workspaceName}". Please try again.`
          );
          break;

        default:
          break;
      }

      removeProvisionedCompoundProduct(compoundProductId);
    },
    [notification, refreshWorkspaceCache]
  );

  const checkCompoundProductStatus = useCallback(
    async (compoundProductId: string, projectId: string, workspaceId: number, workspaceName: string) => {
      if (completedCompoundProductsRef.current.has(compoundProductId)) {
        return;
      }

      try {
        const details = await vewService.getProvisionedCompoundProductDetails(projectId, compoundProductId);

        const status =
          WORKSPACE_STATUS_CONSTANTS.STATUSES[details.status as keyof typeof WORKSPACE_STATUS_CONSTANTS.STATUSES];

        if (!status) {
          return;
        }

        if (isFinalStatus(status)) {
          completedCompoundProductsRef.current.add(compoundProductId);
          await handleFinalStatus(
            status,
            compoundProductId,
            workspaceId,
            workspaceName,
            details.compoundProductVersionId
          );
        }
      } catch (error) {
        console.error(`Error checking compound product status for ${compoundProductId}:`, error);
      }
    },
    [isFinalStatus, handleFinalStatus]
  );

  const pollCompoundProducts = useCallback(async () => {
    const { getProvisionedCompoundProducts } = useProvisioningStore.getState();
    const projectId = import.meta.env.PROJECT_ID || WORKSPACE_FORM_CONSTANTS.DEFAULT_PROJECT_ID;

    const compoundProducts = getProvisionedCompoundProducts();

    if (compoundProducts.length === 0) {
      completedCompoundProductsRef.current.clear();
      return;
    }

    await Promise.all(
      compoundProducts.map(({ compoundProductId, workspaceId, workspaceName }) =>
        checkCompoundProductStatus(compoundProductId, projectId, workspaceId, workspaceName)
      )
    );
  }, [checkCompoundProductStatus]);

  useEffect(() => {
    pollCompoundProducts();
    compoundProductIntervalRef.current = setInterval(pollCompoundProducts, PROVISIONING_POLLING_CONSTANTS.THREE_SEC);

    return () => {
      if (compoundProductIntervalRef.current) {
        clearInterval(compoundProductIntervalRef.current);
      }
    };
  }, [pollCompoundProducts]);

  return null;
};
