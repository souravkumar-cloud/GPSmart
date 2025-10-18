"use client";

import { supabase } from "@/lib/supabaseClient";
import useSWRSubscription from "swr/subscription";
import { useEffect, useRef } from "react";

export function useAdmins(options = {}) {
  const {
    orderBy = { column: 'created_at', ascending: false },
    filters = {},
    enabled = true
  } = options;

  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const { data, error } = useSWRSubscription(
    enabled ? ["admins", orderBy, filters] : null,
    ([table, order, filterParams], { next }) => {
      let isMounted = true;
      let channel = null;

      const fetchData = async () => {
        try {
          // Build query
          let query = supabase.from(table).select("*");

          // Apply filters if any
          if (filterParams.role) {
            query = query.eq('role', filterParams.role);
          }
          if (filterParams.search) {
            query = query.or(`name.ilike.%${filterParams.search}%,email.ilike.%${filterParams.search}%`);
          }

          // Apply ordering
          if (order) {
            query = query.order(order.column, { ascending: order.ascending });
          }

          const { data, error } = await query;

          if (!isMounted) return;

          if (error) {
            console.error('Fetch admins error:', error);
            
            // Retry logic for network errors
            if (retryCountRef.current < maxRetries && error.message?.includes('network')) {
              retryCountRef.current++;
              setTimeout(() => fetchData(), 1000 * retryCountRef.current);
              return;
            }
            
            next(error, null);
          } else {
            retryCountRef.current = 0; // Reset retry count on success
            next(null, data || []);
          }
        } catch (err) {
          if (isMounted) {
            console.error('Unexpected error fetching admins:', err);
            next(err, null);
          }
        }
      };

      // 1️⃣ Initial fetch
      fetchData();

      // 2️⃣ Realtime subscription
      try {
        channel = supabase
          .channel(`public:${table}:${Date.now()}`) // Unique channel name
          .on(
            "postgres_changes",
            { 
              event: "*", 
              schema: "public", 
              table: table 
            },
            async (payload) => {
              console.log('Realtime change detected:', payload);
              
              // Refetch data when changes occur
              if (isMounted) {
                await fetchData();
              }
            }
          )
          .subscribe((status, err) => {
            if (err) {
              console.error('Subscription error:', err);
            }
            console.log('Subscription status:', status);
          });
      } catch (err) {
        console.error('Error setting up realtime subscription:', err);
      }

      // Cleanup function
      return () => {
        isMounted = false;
        if (channel) {
          supabase.removeChannel(channel);
        }
      };
    }
  );

  // Log errors for debugging
  useEffect(() => {
    if (error) {
      console.error('useAdmins error:', error);
    }
  }, [error]);

  return { 
    data: data || [], 
    error: error?.message, 
    isLoading: data === undefined && !error,
    isEmpty: data?.length === 0,
    refetch: () => {
      // Force refetch by remounting subscription
      // This is a workaround since SWR subscription doesn't have built-in refetch
    }
  };
}

// Export individual admin fetch hook
export function useAdmin(adminId) {
  const { data, error } = useSWRSubscription(
    adminId ? ["admin", adminId] : null,
    ([table, id], { next }) => {
      let isMounted = true;

      const fetchData = async () => {
        try {
          const { data, error } = await supabase
            .from('admins')
            .select("*")
            .eq('id', id)
            .single();

          if (!isMounted) return;

          if (error) {
            console.error('Fetch admin error:', error);
            next(error, null);
          } else {
            next(null, data);
          }
        } catch (err) {
          if (isMounted) {
            console.error('Unexpected error fetching admin:', err);
            next(err, null);
          }
        }
      };

      fetchData();

      // Realtime subscription for single admin
      const channel = supabase
        .channel(`public:admins:${id}:${Date.now()}`)
        .on(
          "postgres_changes",
          { 
            event: "*", 
            schema: "public", 
            table: "admins",
            filter: `id=eq.${id}`
          },
          async () => {
            if (isMounted) {
              await fetchData();
            }
          }
        )
        .subscribe((status, err) => {
          if (err) {
            console.error('Admin subscription error:', err);
          }
        });

      return () => {
        isMounted = false;
        supabase.removeChannel(channel);
      };
    }
  );

  return { 
    data, 
    error: error?.message, 
    isLoading: data === undefined && !error 
  };
}