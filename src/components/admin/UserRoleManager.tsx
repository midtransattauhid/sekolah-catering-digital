
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { useUserManagement } from '@/hooks/useUserManagement';
import { UserRoleRow } from './UserRoleRow';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';

export const UserRoleManager = () => {
  const { profileUsers, loading, updateUserRole, getUserRole } = useUserManagement();
  
  const {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    nextPage,
    prevPage,
    canGoNext,
    canGoPrev,
    startIndex,
    endIndex,
    totalItems
  } = usePagination({
    data: profileUsers,
    itemsPerPage: 10
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Manajemen Role Pengguna
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {totalItems === 0 ? (
            <div className="text-center p-4 text-gray-500">
              Tidak ada data pengguna. Pastikan Anda memiliki akses admin.
            </div>
          ) : (
            <>
              {paginatedData.map((user) => (
                <UserRoleRow
                  key={user.id}
                  user={user}
                  currentRole={getUserRole(user.id)}
                  onRoleChange={updateUserRole}
                />
              ))}
              
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
                canGoNext={canGoNext}
                canGoPrev={canGoPrev}
                startIndex={startIndex}
                endIndex={endIndex}
                totalItems={totalItems}
                itemLabel="pengguna"
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
