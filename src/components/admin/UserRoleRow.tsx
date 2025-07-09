
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, UserCheck, Users } from 'lucide-react';
import { ProfileUser } from '@/types/userManagement';

interface UserRoleRowProps {
  user: ProfileUser;
  currentRole: string;
  onRoleChange: (userId: string, newRole: string) => void;
}

export const UserRoleRow = ({ user, currentRole, onRoleChange }: UserRoleRowProps) => {
  const getRoleIcon = () => {
    if (currentRole === 'admin') {
      return <Shield className="h-4 w-4 text-red-600" />;
    } else if (currentRole === 'cashier') {
      return <UserCheck className="h-4 w-4 text-blue-600" />;
    } else {
      return <Users className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'cashier':
        return 'Kasir';
      case 'parent':
        return 'Orangtua';
      default:
        return role;
    }
  };

  const displayName = user.full_name || `User ${user.id.slice(0, 8)}`;
  const displaySubtext = user.full_name 
    ? `ID: ${user.id.slice(0, 8)}...` 
    : `ID: ${user.id}`;

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gray-100 rounded-full">
          {getRoleIcon()}
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-900">
            {displayName}
          </p>
          <p className="text-sm text-gray-500">
            {displaySubtext}
          </p>
          <div className="flex items-center mt-1">
            <span className="text-xs text-gray-400 mr-2">Role saat ini:</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              currentRole === 'admin' ? 'bg-red-100 text-red-800' :
              currentRole === 'cashier' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {getRoleLabel(currentRole)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Select
          value={currentRole}
          onValueChange={(newRole) => onRoleChange(user.id, newRole)}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="parent">Orangtua</SelectItem>
            <SelectItem value="cashier">Kasir</SelectItem>
            <SelectItem value="admin">Administrator</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
