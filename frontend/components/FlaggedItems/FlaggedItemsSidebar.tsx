"use client";

import { Flag } from "lucide-react";
import Link from "next/link";
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { useState, useEffect } from "react";

// This would ideally be fetched from an API
interface FlaggedItem {
  id: string;
  type: 'wallet' | 'transaction';
  value: string;
  reason: string;
  flaggedAt: Date;
}

export function FlaggedItemsSidebar() {
  // This is a placeholder. In a real implementation, you would fetch this data from an API
  const [flaggedItems, setFlaggedItems] = useState<FlaggedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call with setTimeout
    const fetchFlaggedItems = async () => {
      setLoading(true);
      try {
        // This would be replaced with an actual API call
        // e.g., const response = await fetch('/api/flagged-items');
        // const data = await response.json();
        
        // Mock data for demonstration
        const mockData: FlaggedItem[] = [
          {
            id: '1',
            type: 'wallet',
            value: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
            reason: 'Suspicious activity',
            flaggedAt: new Date()
          },
          {
            id: '2',
            type: 'transaction',
            value: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
            reason: 'High risk',
            flaggedAt: new Date(Date.now() - 86400000) // 1 day ago
          },
          {
            id: '3',
            type: 'wallet',
            value: '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX',
            reason: 'Sanctioned entity',
            flaggedAt: new Date(Date.now() - 172800000) // 2 days ago
          }
        ];
        
        setFlaggedItems(mockData);
      } catch (error) {
        console.error("Error fetching flagged items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFlaggedItems();
  }, []);

  if (loading) {
    return null;
  }

  if (flaggedItems.length === 0) {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        <Flag className="mr-2" />
        Flagged Items
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {flaggedItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton asChild>
                <Link 
                  href={`/forensics?input=${item.value}&isTxid=${item.type === 'transaction'}`}
                  className="flex items-center gap-2"
                >
                  <span className="truncate">{item.value}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {item.type === 'wallet' ? '💰' : '📝'}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
