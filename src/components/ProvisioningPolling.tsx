import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useProvisioningStore from '@stores/provisioningStore';
import { getWorkspaceById } from '@services/workspace.services';
import useNotification from '@hooks/useNotification';
import { Workspace } from 'src/types/workspace.type';
import { PROVISIONING_POLLING_CONSTANTS } from '@constants/workspace.constants';
import { setCachedWorkspace } from '@utils/common';

interface WorkspaceCounts {
  compoundProductProvisioningCount: number;
  provisionedCompoundProductCount: number;
}

interface ProvisioningChangeResult {
  provisioningCountDecreased: boolean;
  provisionedCountIncreased: boolean;
  currentProvisioningCount: number;
}

export const ProvisioningPolling = () => {
  const queryClient = useQueryClient();
  const notification = useNotification();

  const previousCountsRef = useRef<Map<number, WorkspaceCounts>>(new Map());
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval>>();

  const updateStoredCounts = useCallback((workspaceId: number, counts: WorkspaceCounts) => {
    previousCountsRef.current.set(workspaceId, counts);
  }, []);

  const isFirstPoll = useCallback((workspaceId: number): boolean => {
    return !previousCountsRef.current.has(workspaceId);
  }, []);

  const calculateProvisioningChanges = useCallback(
    (currentCounts: WorkspaceCounts, previousCounts: WorkspaceCounts): ProvisioningChangeResult => {
      return {
        provisioningCountDecreased:
          currentCounts.compoundProductProvisioningCount < previousCounts.compoundProductProvisioningCount,
        provisionedCountIncreased:
          currentCounts.provisionedCompoundProductCount > previousCounts.provisionedCompoundProductCount,
        currentProvisioningCount: currentCounts.compoundProductProvisioningCount,
      };
    },
    []
  );

  const handleProvisioningSuccess = useCallback(
    (workspace: Workspace) => {
      notification.success(`Provisioning completed successfully for "${workspace.workspaceName}"`);

      queryClient.setQueriesData(
        { queryKey: [PROVISIONING_POLLING_CONSTANTS.QUERY_KEYS.WORKSPACES[0]] },
        (oldData: any) => setCachedWorkspace(oldData, workspace)
      );
    },
    [notification, queryClient]
  );

  const handleProvisioningError = useCallback(
    (workspace: Workspace) => {
      notification.error(
        `Error when provisioning "${workspace.workspaceName}". Please check the workspace for details.`
      );

      queryClient.setQueriesData(
        { queryKey: [PROVISIONING_POLLING_CONSTANTS.QUERY_KEYS.WORKSPACES[0]] },
        (oldData: any) => setCachedWorkspace(oldData, workspace)
      );
    },
    [notification, queryClient]
  );

  const processWorkspace = useCallback(
    async (workspaceId: number, completeProvisioning: (id: number) => void) => {
      const workspace = await queryClient.fetchQuery<Workspace>({
        queryKey: PROVISIONING_POLLING_CONSTANTS.QUERY_KEYS.WORKSPACE_BY_ID(workspaceId),
        queryFn: () => getWorkspaceById(workspaceId),
        staleTime: 0,
      });

      const currentCounts: WorkspaceCounts = {
        compoundProductProvisioningCount: workspace.compoundProductProvisioningCount || 0,
        provisionedCompoundProductCount: workspace.provisionedCompoundProductCount || 0,
      };

      if (isFirstPoll(workspaceId)) {
        updateStoredCounts(workspaceId, currentCounts);
        return;
      }

      const previousCounts = previousCountsRef.current.get(workspaceId)!;

      const { provisioningCountDecreased, provisionedCountIncreased, currentProvisioningCount } =
        calculateProvisioningChanges(currentCounts, previousCounts);

      if (provisioningCountDecreased && provisionedCountIncreased) {
        handleProvisioningSuccess(workspace);
      }

      if (currentProvisioningCount === 0) {
        completeProvisioning(workspaceId);
      }

      if (provisioningCountDecreased && !provisionedCountIncreased && currentProvisioningCount === 0) {
        handleProvisioningError(workspace);
      }

      updateStoredCounts(workspaceId, currentCounts);
    },
    [
      queryClient,
      isFirstPoll,
      updateStoredCounts,
      calculateProvisioningChanges,
      handleProvisioningSuccess,
      handleProvisioningError,
    ]
  );

  const cleanupRemovedWorkspaces = useCallback((currentWorkspaceIds: number[]) => {
    const currentIds = new Set(currentWorkspaceIds);
    previousCountsRef.current.forEach((_, id) => {
      if (!currentIds.has(id)) {
        previousCountsRef.current.delete(id);
      }
    });
  }, []);

  const pollWorkspaces = useCallback(async () => {
    const { getProvisioningWorkspaces, completeProvisioning } = useProvisioningStore.getState();

    const provisioningWorkspaceIds = getProvisioningWorkspaces();

    if (provisioningWorkspaceIds.length === 0) {
      return;
    }

    await Promise.all(
      provisioningWorkspaceIds.map((workspaceId) => processWorkspace(workspaceId, completeProvisioning))
    );

    cleanupRemovedWorkspaces(provisioningWorkspaceIds);
  }, [processWorkspace, cleanupRemovedWorkspaces]);

  useEffect(() => {
    pollWorkspaces();
    pollingIntervalRef.current = setInterval(pollWorkspaces, PROVISIONING_POLLING_CONSTANTS.THREE_MIN);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [pollWorkspaces]);

  return null;
};
