import { Button, Icon, Text } from '@bosch/react-frok';
import React from 'react';
import { useActiveUsers } from '../contexts/ActiveUsersContext';
import Card from './Card';

const ActiveUsersCard: React.FC = () => {
  // Use existing business logic from ActiveUsersContext
  const { activeUserCount, isConnected, error, reconnect } = useActiveUsers();

  const getStatusColor = () => {
    if (error) return '#dc3545';
    if (activeUserCount === 0) return '#666666';
    if (activeUserCount < 5) return '#ffc107';
    if (activeUserCount < 20) return '#28a745';
    return 'var(--bosch-blue)';
  };

  const getStatusText = () => {
    if (error) return 'Connection error';
    if (activeUserCount === 0) return 'No active users';
    if (activeUserCount === 1) return '1 user online';
    return `${activeUserCount} users online`;
  };

  return (
    <Card
      className="w-full"
      header={
        <>
          <Icon iconName="users-three" style={{ color: 'var(--bosch-red-50)', fontSize: '1.5rem' }} />
          <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>Active Users</div>
        </>
      }
      body={
        <div className="flex flex-col items-center justify-center">
          {error ? (
            <div className="text-center">
              <Text className="text-2xl font-bold" style={{ color: '#dc3545' }}>
                Error
              </Text>
              <Text style={{ color: '#666666', fontSize: '0.9rem' }}>{error}</Text>
              <div className="mt-2">
                <Button
                  label="Retry"
                  onClick={reconnect}
                  className="bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
                />
              </div>
            </div>
          ) : (
            <div className="text-center">
              <Text className="text-4xl font-bold" style={{ color: getStatusColor() }}>
                {activeUserCount}
              </Text>
              <Text style={{ color: '#666666', marginTop: '0.5rem' }}>{getStatusText()}</Text>
              {isConnected && (
                <div className="mt-2 flex items-center justify-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500" title="Real-time updates active"></div>
                  <Text style={{ fontSize: '0.8rem', color: '#666666' }}>Live</Text>
                </div>
              )}
            </div>
          )}
        </div>
      }
    />
  );
};

export default ActiveUsersCard;
