
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { UserRole, ProfileUser } from '@/types/userManagement';

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
      
      // Fetch profiles first - this is our main source of user data
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }
      
      console.log('Profiles data:', profilesData);
      
      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        // Don't throw error here, just log it and continue with profiles only
        console.log('Continuing without user_roles data');
      }
      
      console.log('Roles data:', rolesData);
      
      // Get current user for admin check
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log('Current user:', currentUser);
      
      // Try to get auth users (this might fail if not admin)
      let authUsers: any[] = [];
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
        if (!authError && authData?.users) {
          authUsers = authData.users;
          console.log('Auth users:', authUsers);
        }
      } catch (error) {
        console.log('Could not fetch auth users (might not have admin access):', error);
      }
      
      // Process the data
      const combinedUsers: ProfileUser[] = [];
      const processedRoles: UserRole[] = [];
      
      // Process roles data if available
      if (rolesData && Array.isArray(rolesData)) {
        const seenUsers = new Set<string>();
        rolesData.forEach(role => {
          if (role?.user_id && !seenUsers.has(role.user_id)) {
            seenUsers.add(role.user_id);
            processedRoles.push({
              user_id: role.user_id,
              role: role.role || 'parent'
            });
          }
        });
      }
      
      // Process profiles data
      if (profilesData && Array.isArray(profilesData)) {
        profilesData.forEach(profile => {
          if (profile?.id) {
            const authUser = authUsers.find(u => u?.id === profile.id);
            const userRole = processedRoles.find(r => r?.user_id === profile.id);
            
            // Create user object with fallbacks
            const user: ProfileUser = {
              id: profile.id,
              full_name: profile.full_name || authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || `User ${profile.id.slice(0, 8)}`,
              email: authUser?.email || `user-${profile.id.slice(0, 8)}@example.com`,
              created_at: profile.created_at || new Date().toISOString(),
              role: userRole?.role || profile.role || 'parent'
            };
            
            combinedUsers.push(user);
          }
        });
      }
      
      // If no profiles but we have auth users, create entries for them
      if (combinedUsers.length === 0 && authUsers.length > 0) {
        authUsers.forEach(authUser => {
          if (authUser?.id) {
            const userRole = processedRoles.find(r => r?.user_id === authUser.id);
            
            const user: ProfileUser = {
              id: authUser.id,
              full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || `User ${authUser.id.slice(0, 8)}`,
              email: authUser.email || `user-${authUser.id.slice(0, 8)}@example.com`,
              created_at: authUser.created_at || new Date().toISOString(),
              role: userRole?.role || 'parent'
            };
            
            combinedUsers.push(user);
          }
        });
      }
      
      console.log('Final combined users:', combinedUsers);
      
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
      
      // Update user_roles table first
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
        // Don't throw error here, continue if user_roles was updated successfully
        console.log('Profile update failed but user_roles was updated');
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
