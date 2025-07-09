
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
      
      // Fetch from profiles table first
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, created_at, role');
        
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }
      
      console.log('Profiles data:', profilesData);
      
      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .order('created_at', { ascending: false });

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        throw rolesError;
      }
      
      console.log('Roles data:', rolesData);
      
      // Try to fetch from auth.users for email (this might fail if not admin)
      let authUsers: any[] = [];
      try {
        const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
        if (!authError && users) {
          authUsers = users;
          console.log('Auth users:', authUsers);
        }
      } catch (error) {
        console.log('Could not fetch auth users (might not have admin access):', error);
      }
      
      // Combine all user data
      const combinedUsers: ProfileUser[] = [];
      const processedRoles: UserRole[] = [];
      const seenUsers = new Set<string>();
      
      // Process roles to get latest role per user
      if (rolesData && Array.isArray(rolesData) && rolesData.length > 0) {
        rolesData.forEach(role => {
          if (role && role.user_id && !seenUsers.has(role.user_id)) {
            seenUsers.add(role.user_id);
            processedRoles.push(role);
          }
        });
      }
      
      // Get all unique user IDs
      const allUserIds = new Set<string>();
      
      // Add users from profiles
      if (profilesData && Array.isArray(profilesData) && profilesData.length > 0) {
        profilesData.forEach(profile => {
          if (profile && profile.id) {
            allUserIds.add(profile.id);
          }
        });
      }
      
      // Add users from roles
      if (processedRoles.length > 0) {
        processedRoles.forEach(role => {
          if (role && role.user_id) {
            allUserIds.add(role.user_id);
          }
        });
      }
      
      // Add users from auth
      if (authUsers.length > 0) {
        authUsers.forEach(user => {
          if (user && user.id) {
            allUserIds.add(user.id);
          }
        });
      }
      
      // Create combined user objects
      Array.from(allUserIds).forEach(userId => {
        const authUser = authUsers.find(u => u && u.id === userId);
        const profile = profilesData?.find(p => p && p.id === userId);
        const userRole = processedRoles.find(r => r && r.user_id === userId);
        
        combinedUsers.push({
          id: userId,
          full_name: profile?.full_name || authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || null,
          email: authUser?.email || null,
          created_at: profile?.created_at || authUser?.created_at || new Date().toISOString(),
          role: userRole?.role || profile?.role || 'parent'
        });
      });
      
      console.log('Combined users:', combinedUsers);
      
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
