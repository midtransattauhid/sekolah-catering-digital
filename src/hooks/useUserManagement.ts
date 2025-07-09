
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
      
      // Fetch from auth.users for email and profiles for other info
      const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Error fetching auth users:', authError);
        // Fallback to profiles only if auth admin access fails
        return fetchProfilesOnly();
      }
      
      // Fetch from profiles table
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, created_at, role');
        
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }
      
      console.log('Auth users:', users);
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
      
      // Combine auth users with profiles data
      const combinedUsers: ProfileUser[] = [];
      const processedRoles: UserRole[] = [];
      const seenUsers = new Set<string>();
      
      // Process roles to get latest role per user
      if (rolesData && Array.isArray(rolesData)) {
        rolesData.forEach(role => {
          if (!seenUsers.has(role.user_id)) {
            seenUsers.add(role.user_id);
            processedRoles.push(role);
          }
        });
      }
      
      // Combine all user data
      const allUserIds = new Set<string>();
      
      // Add users from auth
      if (users && Array.isArray(users)) {
        users.forEach(user => {
          allUserIds.add(user.id);
        });
      }
      
      // Add users from profiles
      if (profilesData && Array.isArray(profilesData)) {
        profilesData.forEach(profile => {
          allUserIds.add(profile.id);
        });
      }
      
      // Add users from roles
      if (processedRoles && Array.isArray(processedRoles)) {
        processedRoles.forEach(role => {
          allUserIds.add(role.user_id);
        });
      }
      
      // Create combined user objects
      Array.from(allUserIds).forEach(userId => {
        const authUser = users?.find(u => u.id === userId);
        const profile = profilesData?.find(p => p.id === userId);
        const userRole = processedRoles.find(r => r.user_id === userId);
        
        combinedUsers.push({
          id: userId,
          full_name: profile?.full_name || authUser?.user_metadata?.full_name || null,
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

  const fetchProfilesOnly = async () => {
    try {
      console.log('Fetching profiles only...');
      
      // Fetch from profiles table only
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, created_at, role');
        
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }
      
      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .order('created_at', { ascending: false });

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        throw rolesError;
      }
      
      // Process the data similar to above but without auth users
      const combinedUsers: ProfileUser[] = [];
      const processedRoles: UserRole[] = [];
      const seenUsers = new Set<string>();
      
      if (rolesData && Array.isArray(rolesData)) {
        rolesData.forEach(role => {
          if (!seenUsers.has(role.user_id)) {
            seenUsers.add(role.user_id);
            processedRoles.push(role);
          }
        });
      }
      
      const allUserIds = new Set<string>();
      
      if (profilesData && Array.isArray(profilesData)) {
        profilesData.forEach(profile => {
          allUserIds.add(profile.id);
        });
      }
      
      if (processedRoles && Array.isArray(processedRoles)) {
        processedRoles.forEach(role => {
          allUserIds.add(role.user_id);
        });
      }
      
      Array.from(allUserIds).forEach(userId => {
        const profile = profilesData?.find(p => p.id === userId);
        const userRole = processedRoles.find(r => r.user_id === userId);
        
        combinedUsers.push({
          id: userId,
          full_name: profile?.full_name || null,
          email: null, // No email available without auth access
          created_at: profile?.created_at || new Date().toISOString(),
          role: userRole?.role || profile?.role || 'parent'
        });
      });
      
      setProfileUsers(combinedUsers);
      setUserRoles(processedRoles);
    } catch (error) {
      console.error('Error in fallback fetch:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data pengguna.",
        variant: "destructive",
      });
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
