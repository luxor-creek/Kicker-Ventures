"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Star } from "lucide-react"
import type { AgentMessage } from "@/lib/workspace-data"

interface AgentMessagesProps {
  messages: AgentMessage[]
  title?: string
}

export function AgentMessages({ messages, title = "Agent Reports" }: AgentMessagesProps) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
        <button
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-card-foreground"
          aria-label="Search messages"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 divide-y divide-border overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 px-5 py-4 transition-colors hover:bg-muted/50 ${i === 0 ? "bg-accent/5" : ""}`}
          >
            <Avatar className="h-9 w-9 shrink-0 mt-0.5">
              <AvatarImage src={msg.avatar} alt={msg.agentName} />
              <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">
                {msg.agentName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-card-foreground">{msg.agentName}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-muted-foreground">{msg.timestamp}</span>
                  <button
                    className="text-muted-foreground/40 hover:text-accent transition-colors"
                    aria-label="Star message"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                {msg.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
