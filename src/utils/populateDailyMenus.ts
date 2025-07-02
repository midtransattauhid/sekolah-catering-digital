
import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';

export const populateDailyMenus = async () => {
  try {
    // First, get all available food items
    const { data: foodItems, error: foodError } = await supabase
      .from('food_items')
      .select('*')
      .eq('is_available', true);

    if (foodError) throw foodError;

    if (!foodItems || foodItems.length === 0) {
      console.log('No food items found');
      return;
    }

    // Create daily menus for the next 7 days
    const promises = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');

      // Check if daily menus already exist for this date
      const { data: existingMenus } = await supabase
        .from('daily_menus')
        .select('id')
        .eq('date', dateStr);

      if (existingMenus && existingMenus.length > 0) {
        console.log(`Daily menus already exist for ${dateStr}`);
        continue;
      }

      // Create daily menus for all food items
      const dailyMenuItems = foodItems.map(item => ({
        date: dateStr,
        food_item_id: item.id,
        price: item.price,
        is_available: true,
        max_quantity: 50,
        current_quantity: 0
      }));

      promises.push(
        supabase
          .from('daily_menus')
          .insert(dailyMenuItems)
      );
    }

    await Promise.all(promises);
    console.log('Daily menus populated successfully');
  } catch (error) {
    console.error('Error populating daily menus:', error);
  }
};
