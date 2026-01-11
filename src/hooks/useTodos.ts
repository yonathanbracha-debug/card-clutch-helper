import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

export type TodoType = 
  | 'cancel_subscription' 
  | 'review_subscription' 
  | 'claim_benefit' 
  | 'switch_card_rule' 
  | 'contact_issuer' 
  | 'set_autopay' 
  | 'verify_statement';

export type TodoStatus = 'open' | 'done' | 'snoozed';

export interface Todo {
  id: string;
  user_id: string;
  type: TodoType;
  title: string;
  description: string;
  cta_label: string | null;
  cta_url: string | null;
  impact_usd: number;
  status: TodoStatus;
  snooze_until: string | null;
  source: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function useTodos() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTodos = useCallback(async () => {
    if (!user) {
      setTodos([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('to_dos')
        .select('*')
        .eq('user_id', user.id)
        .order('impact_usd', { ascending: false });

      if (error) throw error;

      // Filter out snoozed todos that haven't expired
      const now = new Date();
      const activeTodos = (data || []).filter(todo => {
        if (todo.status !== 'snoozed') return true;
        if (!todo.snooze_until) return true;
        return new Date(todo.snooze_until) <= now;
      }) as Todo[];

      setTodos(activeTodos);
    } catch (err) {
      console.error('Error fetching todos:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const updateTodoStatus = async (id: string, status: TodoStatus) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('to_dos')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setTodos(prev => 
        prev.map(t => t.id === id ? { ...t, status } : t)
      );
    } catch (err) {
      console.error('Error updating todo:', err);
      throw err;
    }
  };

  const snoozeTodo = async (id: string, days: number) => {
    if (!user) return;

    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + days);

    try {
      const { error } = await supabase
        .from('to_dos')
        .update({ 
          status: 'snoozed' as TodoStatus, 
          snooze_until: snoozeUntil.toISOString(),
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setTodos(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Error snoozing todo:', err);
      throw err;
    }
  };

  const createTodo = async (todo: Omit<Todo, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      // Check for duplicates using source
      const sourceKey = JSON.stringify(todo.source);
      const existing = todos.find(t => 
        t.type === todo.type && 
        JSON.stringify(t.source) === sourceKey &&
        t.status === 'open'
      );

      if (existing) {
        console.log('Duplicate todo detected, skipping:', todo.title);
        return existing;
      }

      const insertData = {
        user_id: user.id,
        type: todo.type as string,
        title: todo.title,
        description: todo.description,
        cta_label: todo.cta_label,
        cta_url: todo.cta_url,
        impact_usd: todo.impact_usd,
        status: todo.status as string,
        snooze_until: todo.snooze_until,
        source: todo.source as Json,
      };

      const { data, error } = await supabase
        .from('to_dos')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setTodos(prev => [data as Todo, ...prev].sort((a, b) => b.impact_usd - a.impact_usd));
      }

      return data as Todo;
    } catch (err) {
      console.error('Error creating todo:', err);
      throw err;
    }
  };

  const openTodos = todos.filter(t => t.status === 'open');
  const doneTodos = todos.filter(t => t.status === 'done');
  const totalImpact = openTodos.reduce((sum, t) => sum + t.impact_usd, 0);

  return {
    todos,
    openTodos,
    doneTodos,
    totalImpact,
    loading,
    updateTodoStatus,
    snoozeTodo,
    createTodo,
    refetch: fetchTodos,
  };
}
