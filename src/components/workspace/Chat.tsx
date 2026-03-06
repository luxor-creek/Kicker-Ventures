import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Plus, Hash, MessageSquare, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface ChatChannel {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

interface ChatMessage {
  id: string;
  content: string;
  channel_id: string;
  user_id: string;
  created_at: string;
}

interface Props {
  userId: string;
}

const Chat = ({ userId }: Props) => {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [profiles, setProfiles] = useState<Record<string, { name: string; avatar_url: string | null }>>({});
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load channels and profiles on mount
  useEffect(() => {
    const load = async () => {
      const [{ data: profs }, { data: chans }] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, avatar_url"),
        supabase.from("chat_channels").select("*").order("created_at", { ascending: true }),
      ]);
      if (profs) {
        const map: Record<string, { name: string; avatar_url: string | null }> = {};
        profs.forEach((p) => (map[p.user_id] = { name: p.full_name, avatar_url: p.avatar_url }));
        setProfiles(map);
      }
      if (chans) {
        setChannels(chans);
        if (chans.length > 0 && !selectedChannel) setSelectedChannel(chans[0].id);
      }
    };
    load();
  }, [userId]);

  // Load messages for selected channel + realtime subscription
  useEffect(() => {
    if (!selectedChannel) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("channel_id", selectedChannel)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    const channel = supabase
      .channel(`chat-${selectedChannel}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `channel_id=eq.${selectedChannel}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChannel]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedChannel) return;
    await supabase.from("chat_messages").insert({ content: newMsg.trim(), user_id: userId, channel_id: selectedChannel });
    setNewMsg("");
  };

  const createChannel = async () => {
    if (!newChannelName.trim()) return;
    const { data, error } = await supabase
      .from("chat_channels")
      .insert({ name: newChannelName.trim().toLowerCase().replace(/\s+/g, "-"), created_by: userId })
      .select()
      .single();
    if (error) {
      toast({ title: "Error creating channel", variant: "destructive" });
      return;
    }
    setChannels((prev) => [...prev, data]);
    setSelectedChannel(data.id);
    setNewChannelName("");
    setShowNewChannel(false);
  };

  const selectedChannelName = channels.find((c) => c.id === selectedChannel)?.name || "";

  return (
    <div className="flex gap-4 h-[calc(100vh-10rem)]">
      {/* Channel Sidebar */}
      <div className="w-52 shrink-0 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Channels</p>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowNewChannel(!showNewChannel)}>
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>

        {showNewChannel && (
          <div className="flex gap-1 mb-2">
            <Input
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createChannel()}
              placeholder="channel-name"
              className="h-8 text-sm"
            />
            <Button size="sm" className="h-8 px-2" onClick={createChannel}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        <ScrollArea className="flex-1">
          <div className="space-y-0.5">
            {channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setSelectedChannel(ch.id)}
                className={`w-full text-left text-sm px-3 py-2 rounded transition-colors flex items-center gap-2 ${
                  selectedChannel === ch.id ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Hash className="w-3.5 h-3.5 shrink-0" />
                {ch.name}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col border border-border/50 rounded-lg overflow-hidden">
        {!selectedChannel ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <MessageSquare className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No channel selected</p>
            <p className="text-sm text-muted-foreground">Select a channel or create a new one</p>
          </div>
        ) : (
          <>
            <div className="border-b border-border/50 px-4 py-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <Hash className="w-4 h-4" />
                {selectedChannelName}
              </p>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map((msg) => {
                  const profile = profiles[msg.user_id];
                  const isOwn = msg.user_id === userId;
                  return (
                    <div key={msg.id} className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
                      <div className="shrink-0 mt-4">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-primary" />
                          </div>
                        )}
                      </div>
                      <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                        <p className="text-[10px] text-muted-foreground mb-0.5">{profile?.name || "Unknown"}</p>
                        <div
                          className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${
                            isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>
            <div className="border-t border-border/50 p-3 flex gap-2">
              <Input
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message…"
                className="flex-1"
              />
              <Button size="icon" onClick={sendMessage}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Chat;
