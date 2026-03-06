"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Hash,
  Lock,
  Send,
  Mic,
  MicOff,
  ChevronLeft,
  Bot,
  User,
  Shield,
} from "lucide-react"
import {
  chatChannels,
  chatMessages as initialMessages,
  getAllMembers,
  type ChatMessage,
  type ChatChannel,
} from "@/lib/workspace-data"

interface CompanyChatProps {
  /** When a user is @mentioned, notify parent so sidebar can flash */
  onMention?: (mentionedId: string) => void
}

export function CompanyChat({ onMention }: CompanyChatProps) {
  const [channels] = useState<ChatChannel[]>(chatChannels)
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [activeChannel, setActiveChannel] = useState("general")
  const [input, setInput] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [showChannelList, setShowChannelList] = useState(true)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionIndex, setMentionIndex] = useState(0)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const allMembers = getAllMembers()
  const channelMessages = messages.filter((m) => m.channelId === activeChannel)
  const activeChannelData = channels.find((c) => c.id === activeChannel)

  // Filtered mention suggestions
  const mentionSuggestions = mentionQuery !== null
    ? allMembers.filter((m) =>
        m.name.toLowerCase().startsWith(mentionQuery.toLowerCase())
      )
    : []

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [channelMessages.length, activeChannel])

  // Count unread mentions per channel (simplified: messages that mention paul)
  function getChannelUnread(channelId: string) {
    return messages.filter(
      (m) => m.channelId === channelId && m.mentions?.includes("admin-paul")
    ).length
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setInput(val)

    // Detect @mention trigger
    const cursorPos = e.target.selectionStart ?? val.length
    const textBeforeCursor = val.slice(0, cursorPos)
    const atMatch = textBeforeCursor.match(/@(\w*)$/)
    if (atMatch) {
      setMentionQuery(atMatch[1])
      setMentionIndex(0)
    } else {
      setMentionQuery(null)
    }
  }

  function insertMention(memberName: string) {
    const cursorPos = inputRef.current?.selectionStart ?? input.length
    const textBefore = input.slice(0, cursorPos)
    const textAfter = input.slice(cursorPos)
    const replaced = textBefore.replace(/@(\w*)$/, `@${memberName} `)
    setInput(replaced + textAfter)
    setMentionQuery(null)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (mentionQuery !== null && mentionSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setMentionIndex((i) => Math.min(i + 1, mentionSuggestions.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setMentionIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()
        insertMention(mentionSuggestions[mentionIndex].name)
        return
      } else if (e.key === "Escape") {
        setMentionQuery(null)
        return
      }
    }
    if (e.key === "Enter" && mentionQuery === null) {
      e.preventDefault()
      sendMessage()
    }
  }

  function sendMessage() {
    if (!input.trim()) return

    // Extract mentions from message
    const mentionMatches = input.match(/@(\w+)/g) || []
    const mentionedIds = mentionMatches
      .map((m) => {
        const name = m.slice(1)
        const member = allMembers.find(
          (mb) => mb.name.toLowerCase() === name.toLowerCase()
        )
        return member?.id
      })
      .filter(Boolean) as string[]

    const newMsg: ChatMessage = {
      id: `cm-${Date.now()}`,
      channelId: activeChannel,
      senderId: "admin-paul",
      senderName: "Paul",
      senderAvatar: "/agents/paul.png",
      senderType: "admin",
      message: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      mentions: mentionedIds.length > 0 ? mentionedIds : undefined,
    }

    setMessages((prev) => [...prev, newMsg])
    setInput("")
    setMentionQuery(null)

    // Notify parent for sidebar flash
    mentionedIds.forEach((id) => onMention?.(id))
  }

  const toggleVoice = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert("Voice not supported in this browser."); return }
    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = "en-US"
    recognitionRef.current = recognition
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results).map((r) => r[0].transcript).join("")
      setInput(transcript)
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognition.start()
    setIsListening(true)
  }, [isListening])

  // Render message text with highlighted @mentions and #channels
  function renderMessageText(text: string) {
    const parts = text.split(/(@\w+|#\w+)/g)
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return (
          <span key={i} className="rounded bg-accent/15 px-1 font-semibold text-accent">
            {part}
          </span>
        )
      }
      if (part.startsWith("#")) {
        return (
          <span key={i} className="rounded bg-primary/10 px-1 font-medium text-primary/80">
            {part}
          </span>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  const senderTypeIcon = (type: ChatMessage["senderType"]) => {
    if (type === "agent") return <Bot className="h-3 w-3 text-accent" />
    if (type === "admin") return <Shield className="h-3 w-3 text-accent" />
    return <User className="h-3 w-3 text-muted-foreground" />
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Channel sidebar */}
      <div
        className={cn(
          "flex shrink-0 flex-col border-r border-border bg-card",
          showChannelList
            ? "w-full sm:w-[220px]"
            : "hidden sm:flex sm:w-[220px]"
        )}
      >
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-bold text-foreground">Channels</h2>
          <p className="text-[11px] text-muted-foreground">Kicker Ventures private workspace</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {channels.map((ch) => {
            const unread = getChannelUnread(ch.id)
            const isActive = activeChannel === ch.id
            return (
              <button
                key={ch.id}
                onClick={() => {
                  setActiveChannel(ch.id)
                  setShowChannelList(false)
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-accent/10 font-semibold text-accent"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {ch.id === "clients" ? (
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <Hash className="h-3.5 w-3.5 shrink-0" />
                )}
                <span className="truncate">{ch.name}</span>
                {unread > 0 && !isActive && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">
                    {unread}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
            <Lock className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">All chats are private to Kicker Ventures</span>
          </div>
        </div>
      </div>

      {/* Message pane */}
      <div
        className={cn(
          "flex flex-1 flex-col",
          showChannelList ? "hidden sm:flex" : "flex"
        )}
      >
        {/* Channel header */}
        <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-3">
          {/* Back button on mobile */}
          <button
            onClick={() => setShowChannelList(true)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted sm:hidden"
            aria-label="Back to channels"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {activeChannelData?.id === "clients" ? (
            <Lock className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Hash className="h-4 w-4 text-muted-foreground" />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-foreground">{activeChannelData?.name}</h3>
            {activeChannelData?.description && (
              <p className="truncate text-[11px] text-muted-foreground">{activeChannelData.description}</p>
            )}
          </div>
          <Badge variant="outline" className="hidden text-[10px] sm:inline-flex">
            {channelMessages.length} messages
          </Badge>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
          <div className="mx-auto max-w-3xl space-y-4">
            {channelMessages.length === 0 && (
              <div className="py-12 text-center">
                <Hash className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  No messages in #{activeChannelData?.name} yet. Start the conversation!
                </p>
              </div>
            )}
            {channelMessages.map((msg) => (
              <div key={msg.id} className="group flex gap-3">
                <Avatar className="mt-0.5 h-8 w-8 shrink-0">
                  {msg.senderAvatar ? (
                    <AvatarImage src={msg.senderAvatar} alt={msg.senderName} />
                  ) : null}
                  <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-bold">
                    {msg.senderName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{msg.senderName}</span>
                    {senderTypeIcon(msg.senderType)}
                    <span className="text-[11px] text-muted-foreground">{msg.timestamp}</span>
                  </div>
                  <p className="mt-0.5 text-sm leading-relaxed text-foreground/90">
                    {renderMessageText(msg.message)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-border bg-card px-3 py-3 sm:px-4">
          <div className="relative mx-auto max-w-3xl">
            {/* Mention autocomplete dropdown */}
            {mentionQuery !== null && mentionSuggestions.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border border-border bg-card p-1 shadow-lg">
                {mentionSuggestions.map((member, i) => (
                  <button
                    key={member.id}
                    onClick={() => insertMention(member.name)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                      i === mentionIndex
                        ? "bg-accent/10 text-accent"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    {member.type === "agent" ? (
                      <Bot className="h-3.5 w-3.5 text-accent" />
                    ) : member.type === "admin" ? (
                      <Shield className="h-3.5 w-3.5 text-accent" />
                    ) : (
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className="font-medium">{member.name}</span>
                    <Badge variant="outline" className="ml-auto text-[9px] capitalize">
                      {member.type}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleVoice}
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                  isListening
                    ? "bg-destructive text-destructive-foreground animate-pulse"
                    : "border border-border bg-background text-muted-foreground hover:text-foreground"
                )}
                aria-label={isListening ? "Stop listening" : "Voice message"}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Listening..." : `Message #${activeChannelData?.name}... (use @ to mention)`}
                className={cn(
                  "flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-accent",
                  isListening && "ring-1 ring-destructive/50"
                )}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-40"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
