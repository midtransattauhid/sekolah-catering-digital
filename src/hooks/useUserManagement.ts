import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { UserRole, ProfileUser, ProfileData } from '@/types/userManagement';

export const useUserManagement = () => {
  const [profileUsers, setProfileUsers] = useState<ProfileUser[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsersAndRoles();
  }, []);

  const fetchUsersAndRoles = async () => {
    try {
      console.log('Fetching users and roles...');
      
      // Fetch from profiles table
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, created_at, role');
        
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }
      
      console.log('Profiles data:', profilesData);
      
      // Fetch user roles (get only the latest role per user)
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .order('created_at', { ascending: false });

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        throw rolesError;
      }
      
      console.log('Roles data:', rolesData);
      
      // Create a map to store unique users with their latest roles
      const uniqueUsers = new Map<string, ProfileUser>();
      
      // Process profiles first
      if (profilesData && Array.isArray(profilesData)) {
        (profilesData as ProfileData[]).forEach((profile: ProfileData) => {
          uniqueUsers.set(profile.id, {
            id: profile.id,
            full_name: profile.full_name,
            created_at: profile.created_at,
            role: profile.role,
            email: null
          });
        });
      }
      
      // Process roles and update user roles (only keep latest role per user)
      const processedRoles: UserRole[] = [];
      const seenUsers = new Set<string>();
      
      if (rolesData && Array.isArray(rolesData)) {
        rolesData.forEach(role => {
          if (!seenUsers.has(role.user_id)) {
            seenUsers.add(role.user_id);
            processedRoles.push(role);
            
            // Update user role in the map or add missing user
            if (uniqueUsers.has(role.user_id)) {
              const existingUser = uniqueUsers.get(role.user_id)!;
              existingUser.role = role.role;
            } else {
              // Add user that exists in roles but not in profiles
              uniqueUsers.set(role.user_id, {
                id: role.user_id,
                full_name: null,
                created_at: new Date().toISOString(),
                role: role.role,
                email: null
              });
            }
          }
        });
      }
      
      const combinedUsers = Array.from(uniqueUsers.values());
      console.log('Combined unique users:', combinedUsers);
      
      setProfileUsers(combinedUsers);
      setUserRoles(processedRoles);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data pengguna. Pastikan Anda memiliki akses admin.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      console.log('Updating role for user:', userId, 'to:', newRole);
      
      // Update or insert user role (upsert will handle duplicates)
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({ 
          user_id: userId, 
          role: newRole 
        }, {
          onConflict: 'user_id'
        });

      if (roleError) {
        console.error('Error updating user_roles:', roleError);
        throw roleError;
      }

      // Update profiles table as well
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (profileError) {
        console.error('Error updating profiles:', profileError);
        throw profileError;
      }

      toast({
        title: "Berhasil",
        description: `Role pengguna berhasil diubah menjadi ${newRole}`,
      });

      // Refresh data
      fetchUsersAndRoles();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Gagal mengubah role pengguna",
        variant: "destructive",
      });
    }
  };

  const getUserRole = (userId: string) => {
    const userRole = userRoles.find(role => role.user_id === userId);
    const profileRole = profileUsers.find(user => user.id === userId)?.role;
    return userRole?.role || profileRole || 'parent';
  };

  return {
    profileUsers,
    loading,
    updateUserRole,
    getUserRole
  };
};
