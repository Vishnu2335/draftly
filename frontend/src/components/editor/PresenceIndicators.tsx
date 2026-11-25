"use client";

import React, { useEffect, useState } from "react";
import { apiSendPresence, PresenceUser } from "@/lib/config";
import { Users } from "lucide-react";

interface PresenceIndicatorsProps {
  documentId: string;
  token: string;
  currentUserId?: string;
}

export default function PresenceIndicators({
  documentId,
  token,
  currentUserId,
}: PresenceIndicatorsProps) {
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!token || !documentId) return;

    let isMounted = true;

    const pingPresence = async () => {
      try {
        const res = await apiSendPresence(token, documentId);
        if (isMounted) {
          setActiveUsers(res.active_users);
        }
      } catch (err) {
        // Silently ignore presence errors to avoid interrupting writing
      }
    };

    // Immediate ping on mount
    pingPresence();

    // Heartbeat every 20 seconds
    const interval = setInterval(pingPresence, 20000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [documentId, token]);

  if (activeUsers.length === 0) return null;

  // Collaborators excluding current user
  const otherCollaborators = activeUsers.filter(
    (u) => u.user_id !== currentUserId
  );

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-white border-2 border-ink-border shadow-retro text-xs font-bold text-ink">
      <span className="relative flex h-2 w-2 mr-0.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-retroGreen opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-retroGreen"></span>
      </span>

      <div className="flex -space-x-1.5 items-center mr-1">
        {activeUsers.slice(0, 3).map((u) => (
          <div
            key={u.user_id}
            title={`${u.username} (${u.email}) - Viewing now`}
            className="w-5 h-5 rounded-full bg-ink text-white text-[9px] font-extrabold border border-white flex items-center justify-center uppercase shadow-xs cursor-default"
          >
            {u.username.slice(0, 2)}
          </div>
        ))}
      </div>

      <span className="text-[11px] font-bold text-ink hidden sm:inline">
        {otherCollaborators.length > 0
          ? `${activeUsers.length} editing live`
          : "You're live"}
      </span>
    </div>
  );
}
