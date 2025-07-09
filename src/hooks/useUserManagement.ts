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
      
      // Fetch profiles first - this is our primary source of user data
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, created_at, role');
        
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }
      
      console.log('Profiles data:', profilesData);
      
      // Fetch user roles for role management
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .order('created_at', { ascending: false });

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        throw rolesError;
      }
      
      console.log('Roles data:', rolesData);
      
      // Try to get auth users for email data (admin access required)
      let authUsers: any[] = [];
      try {
        const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
        if (!authError && users) {
          authUsers = users;
          console.log('Auth users found:', authUsers.length);
        }
      } catch (error) {
        console.log('Could not fetch auth users (insufficient permissions):', error);
      }
      
      // Create combined user data prioritizing profiles table
      const combinedUsers: ProfileUser[] = [];
      const processedRoles: UserRole[] = [];
      
      // Process roles to get latest role per user
      if (rolesData && Array.isArray(rolesData)) {
        const roleMap = new Map<string, string>();
        rolesData.forEach(role => {
          if (role && role.user_id && role.role) {
            // Keep the first (most recent) role for each user
            if (!roleMap.has(role.user_id)) {
              roleMap.set(role.user_id, role.role);
              processedRoles.push(role);
            }
          }
        });
      }
      
      // Process profiles to create user list
      if (profilesData && Array.isArray(profilesData)) {
        profilesData.forEach(profile => {
          if (profile && profile.id) {
            const authUser = authUsers.find(u => u && u.id === profile.id);
            const userRole = processedRoles.find(r => r && r.user_id === profile.id);
            
            // Generate fallback name if needed
            let displayName = profile.full_name;
            if (!displayName || displayName.trim() === '') {
              if (authUser?.email) {
                displayName = authUser.email.split('@')[0];
              } else if (authUser?.user_metadata?.full_name) {
                displayName = authUser.user_metadata.full_name;
              } else {
                displayName = `User ${profile.id.slice(0, 8)}`;
              }
            }
            
            combinedUsers.push({
              id: profile.id,
              full_name: displayName,
              email: authUser?.email || null,
              created_at: profile.created_at || new Date().toISOString(),
              role: userRole?.role || profile.role || 'parent'
            });
          }
        });
      }
      
      // If no profiles exist but we have auth users, create entries for them
      if (combinedUsers.length === 0 && authUsers.length > 0) {
        authUsers.forEach(authUser => {
          if (authUser && authUser.id) {
            const userRole = processedRoles.find(r => r && r.user_id === authUser.id);
            
            combinedUsers.push({
              id: authUser.id,
              full_name: authUser.user_metadata?.full_name || 
                        authUser.email?.split('@')[0] || 
                        `User ${authUser.id.slice(0, 8)}`,
              email: authUser.email || null,
              created_at: authUser.created_at || new Date().toISOString(),
              role: userRole?.role || 'parent'
            });
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
      
      // Update user_roles table with upsert
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

      // Also update profiles table role
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
