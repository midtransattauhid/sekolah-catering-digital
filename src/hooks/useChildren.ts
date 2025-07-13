
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Child } from '@/types/checkout';

export const useChildren = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('children')
        .select('*');

      if (error) throw error;

      const formattedChildren = data?.map(child => ({
        id: child.id,
        name: child.name,
        class_name: child.class_name
      })) || [];

      setChildren(formattedChildren);
    } catch (error: any) {
      console.error('Error fetching children:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data anak",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  return {
    children,
    loading,
    fetchChildren
  };
};
