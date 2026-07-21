"use client";

// Mock useSession to bypass Google Sign-in and automatically load the admin panel
const useSession = () => ({
  data: { user: { email: "kirtagyacse2@gmail.com", name: "Kirtagya", image: null as string | null } },
  status: "authenticated" as "authenticated" | "loading" | "unauthenticated",
});
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Item {
  id: string;
  title: string;
  order: number;
  type: string;
  youtubeVideoId: string | null;
  playlistId: string | null;
}

interface Topic {
  id: string;
  title: string;
  order: number;
  kind: string;
  items: Item[];
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  // New topic form
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicKind, setNewTopicKind] = useState("COURSE_MANUAL");

  // New item form
  const [newItemTopicId, setNewItemTopicId] = useState("");
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemType, setNewItemType] = useState("MANUAL_MILESTONE");
  const [newItemVideoId, setNewItemVideoId] = useState("");

  // Playlist import form
  const [importTopicId, setImportTopicId] = useState("");
  const [importPlaylistId, setImportPlaylistId] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState("");

  // Edit item
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editVideoId, setEditVideoId] = useState("");
  const [editType, setEditType] = useState("");

  const fetchTopics = useCallback(async () => {
    try {
      const res = await fetch("/api/topics");
      if (res.ok) {
        const data = await res.json();
        setTopics(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchTopics();
  }, [status, fetchTopics]);

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle) return;
    await fetch("/api/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTopicTitle, kind: newTopicKind }),
    });
    setNewTopicTitle("");
    fetchTopics();
  };

  const handleDeleteTopic = async (id: string) => {
    if (!confirm("Delete this topic and all its items?")) return;
    await fetch("/api/topics", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchTopics();
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTopicId || !newItemTitle) return;
    await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topicId: newItemTopicId,
        title: newItemTitle,
        type: newItemVideoId ? "YOUTUBE_VIDEO" : newItemType,
        youtubeVideoId: newItemVideoId || null,
      }),
    });
    setNewItemTitle("");
    setNewItemVideoId("");
    fetchTopics();
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    await fetch("/api/items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchTopics();
  };

  const handleEditItem = async (id: string) => {
    await fetch("/api/items", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        title: editTitle,
        type: editVideoId ? "YOUTUBE_VIDEO" : editType,
        youtubeVideoId: editVideoId || null,
      }),
    });
    setEditingItem(null);
    fetchTopics();
  };

  const handleImportPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importTopicId || !importPlaylistId) return;
    setImporting(true);
    setImportResult("");

    // Extract playlist ID from URL if pasted
    let plId = importPlaylistId.trim();
    const urlMatch = plId.match(/[?&]list=([^&]+)/);
    if (urlMatch) plId = urlMatch[1];

    try {
      const res = await fetch("/api/youtube/playlist-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistId: plId, topicId: importTopicId }),
      });
      const data = await res.json();
      if (res.ok) {
        setImportResult(`✅ Imported ${data.count} videos`);
        setImportPlaylistId("");
        fetchTopics();
      } else {
        setImportResult(`❌ ${data.error}`);
      }
    } catch (err) {
      setImportResult("❌ Import failed");
    } finally {
      setImporting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[--color-accent-pink] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        {/* 3D background elements */}
        <div className="bg-3d-container">
          <div className="cyber-grid"></div>
          <div className="cube-3d" style={{ top: '25%', left: '15%' }}>
            <div className="face front"></div><div className="face back"></div><div className="face left"></div><div className="face right"></div><div className="face top"></div><div className="face bottom"></div>
          </div>
        </div>
        <div className="glass-card p-8 text-center relative z-10 border border-[--color-border-glass]">
          <p className="text-[--color-text-secondary] mb-4">Sign in to access admin</p>
          <Link href="/auth/signin" className="btn-gradient inline-block px-6 py-2.5 rounded-xl text-[#05020a] font-bold">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* 3D background elements */}
      <div className="bg-3d-container">
        <div className="cyber-grid"></div>
        <div className="cube-3d" style={{ top: '15%', left: '10%' }}>
          <div className="face front"></div><div className="face back"></div><div className="face left"></div><div className="face right"></div><div className="face top"></div><div className="face bottom"></div>
        </div>
        <div className="cube-3d large" style={{ top: '55%', right: '8%' }}>
          <div className="face front"></div><div className="face back"></div><div className="face left"></div><div className="face right"></div><div className="face top"></div><div className="face bottom"></div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#05020a]/85 border-b border-[--color-border-glass]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs font-bold text-[--color-text-muted] hover:text-[--color-accent-chartreuse] transition-colors">
              ← Dashboard
            </Link>
            <span className="text-[--color-text-muted] text-xs">/</span>
            <h1 className="font-bold text-sm text-[--color-text-primary] tracking-tight">Admin Control Panel</h1>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 relative z-10">
        {/* Add Topic */}
        <div className="glass-card p-6 border border-[--color-border-glass]">
          <h2 className="text-lg font-bold mb-4 gradient-text tracking-tight">Add New Topic</h2>
          <form onSubmit={handleAddTopic} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Topic title"
              value={newTopicTitle}
              onChange={(e) => setNewTopicTitle(e.target.value)}
              className="flex-1 bg-[#0d0417]/50 border border-[--color-border-glass] rounded-lg px-4 py-2.5 text-sm text-[--color-text-primary] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-accent-chartreuse]/40"
            />
            <select
              value={newTopicKind}
              onChange={(e) => setNewTopicKind(e.target.value)}
              className="bg-[#0d0417]/50 border border-[--color-border-glass] rounded-lg px-4 py-2.5 text-sm text-[--color-text-primary] focus:outline-none focus:border-[--color-accent-chartreuse]/40"
            >
              <option value="COURSE_MANUAL">Course (Manual)</option>
              <option value="SINGLE_VIDEO">Single Videos</option>
              <option value="PLAYLIST">Playlist</option>
              <option value="BOOK">Book</option>
            </select>
            <button
              type="submit"
              className="btn-gradient px-6 py-2.5 rounded-lg text-[#05020a] text-sm font-bold cursor-pointer"
            >
              Add Topic
            </button>
          </form>
        </div>

        {/* Add Item */}
        <div className="glass-card p-6 border border-[--color-border-glass]">
          <h2 className="text-lg font-bold mb-4 gradient-text tracking-tight">Add New Item</h2>
          <form onSubmit={handleAddItem} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={newItemTopicId}
                onChange={(e) => setNewItemTopicId(e.target.value)}
                className="bg-[#0d0417]/50 border border-[--color-border-glass] rounded-lg px-4 py-2.5 text-sm text-[--color-text-primary] focus:outline-none focus:border-[--color-accent-chartreuse]/40"
              >
                <option value="">Select topic...</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
              <select
                value={newItemType}
                onChange={(e) => setNewItemType(e.target.value)}
                className="bg-[#0d0417]/50 border border-[--color-border-glass] rounded-lg px-4 py-2.5 text-sm text-[--color-text-primary] focus:outline-none focus:border-[--color-accent-chartreuse]/40"
              >
                <option value="MANUAL_MILESTONE">Manual Milestone</option>
                <option value="YOUTUBE_VIDEO">YouTube Video</option>
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Item title"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                className="flex-1 bg-[#0d0417]/50 border border-[--color-border-glass] rounded-lg px-4 py-2.5 text-sm text-[--color-text-primary] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-accent-chartreuse]/40"
              />
              <input
                type="text"
                placeholder="YouTube Video ID (optional)"
                value={newItemVideoId}
                onChange={(e) => setNewItemVideoId(e.target.value)}
                className="sm:w-64 bg-[#0d0417]/50 border border-[--color-border-glass] rounded-lg px-4 py-2.5 text-sm text-[--color-text-primary] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-accent-chartreuse]/40"
              />
              <button
                type="submit"
                className="btn-gradient px-6 py-2.5 rounded-lg text-[#05020a] text-sm font-bold cursor-pointer"
              >
                Add Item
              </button>
            </div>
          </form>
        </div>

        {/* Import Playlist */}
        <div className="glass-card p-6 border border-[--color-border-glass]">
          <h2 className="text-lg font-bold mb-4 gradient-text tracking-tight">Import YouTube Playlist</h2>
          <form onSubmit={handleImportPlaylist} className="flex flex-col sm:flex-row gap-3">
            <select
              value={importTopicId}
              onChange={(e) => setImportTopicId(e.target.value)}
              className="bg-[#0d0417]/50 border border-[--color-border-glass] rounded-lg px-4 py-2.5 text-sm text-[--color-text-primary] focus:outline-none focus:border-[--color-accent-chartreuse]/40"
            >
              <option value="">Select topic...</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Playlist URL or ID"
              value={importPlaylistId}
              onChange={(e) => setImportPlaylistId(e.target.value)}
              className="flex-1 bg-[#0d0417]/50 border border-[--color-border-glass] rounded-lg px-4 py-2.5 text-sm text-[--color-text-primary] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-accent-chartreuse]/40"
            />
            <button
              type="submit"
              disabled={importing}
              className="btn-gradient px-6 py-2.5 rounded-lg text-[#05020a] text-sm font-bold disabled:opacity-50 cursor-pointer"
            >
              {importing ? "Importing..." : "Import"}
            </button>
          </form>
          {importResult && (
            <p className="mt-3 text-sm text-[--color-text-secondary] font-semibold">{importResult}</p>
          )}
        </div>

        {/* Topics & Items List */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold gradient-text tracking-tight">All Topics & Items</h2>
          {topics.map((topic) => (
            <div key={topic.id} className="glass-card overflow-hidden border border-[--color-border-glass]">
              <div className="p-4 flex items-center justify-between border-b border-white/5 bg-[#0d0417]/30">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-[--color-text-muted]">#{topic.order + 1}</span>
                  <h3 className="font-bold text-[--color-text-primary] text-base">{topic.title}</h3>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[--color-accent-carnation] bg-[--color-accent-pink]/10 border border-[--color-accent-pink]/25 px-2 py-0.5 rounded-full">
                    {topic.kind}
                  </span>
                  <span className="text-xs text-[--color-text-muted]">
                    {topic.items.length} items
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteTopic(topic.id)}
                  className="text-xs font-bold text-[--color-accent-pink] hover:text-[--color-accent-chartreuse] transition-colors cursor-pointer"
                >
                  Delete Topic
                </button>
              </div>
              <div className="p-3 space-y-1">
                {topic.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[--color-accent-pink]/5 group"
                  >
                    {editingItem === item.id ? (
                      <>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="flex-1 bg-[#0d0417]/70 border border-[--color-accent-pink]/40 rounded px-3 py-1.5 text-sm text-[--color-text-primary] focus:outline-none focus:border-[--color-accent-chartreuse]/40"
                        />
                        <input
                          type="text"
                          placeholder="Video ID"
                          value={editVideoId}
                          onChange={(e) => setEditVideoId(e.target.value)}
                          className="w-40 bg-[#0d0417]/70 border border-[--color-accent-pink]/40 rounded px-3 py-1.5 text-sm text-[--color-text-primary] focus:outline-none focus:border-[--color-accent-chartreuse]/40"
                        />
                        <button
                          onClick={() => handleEditItem(item.id)}
                          className="text-xs font-bold text-[--color-accent-chartreuse] hover:underline cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingItem(null)}
                          className="text-xs font-bold text-[--color-text-muted] hover:underline cursor-pointer"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-[--color-text-muted] font-mono w-6 text-right">
                          {item.order + 1}.
                        </span>
                        <span className="flex-1 text-sm text-[--color-text-primary] truncate">
                          {item.title}
                        </span>
                        {item.youtubeVideoId && (
                          <span className="text-[10px] font-mono text-[--color-accent-chartreuse] bg-[--color-accent-chartreuse]/10 border border-[--color-accent-chartreuse]/20 px-2 py-0.5 rounded">
                            {item.youtubeVideoId}
                          </span>
                        )}
                        <span className="text-[10px] text-[--color-text-muted]">
                          {item.type === "YOUTUBE_VIDEO" ? "🎬" : "📌"}
                        </span>
                        <button
                          onClick={() => {
                            setEditingItem(item.id);
                            setEditTitle(item.title);
                            setEditVideoId(item.youtubeVideoId ?? "");
                            setEditType(item.type);
                          }}
                          className="text-xs font-bold text-[--color-text-muted] opacity-0 group-hover:opacity-100 hover:text-[--color-accent-chartreuse] transition-all cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-xs font-bold text-[--color-text-muted] opacity-0 group-hover:opacity-100 hover:text-[--color-accent-pink] transition-all cursor-pointer"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                ))}
                {topic.items.length === 0 && (
                  <p className="text-xs text-[--color-text-muted] px-3 py-2">
                    No items yet. Add items above or import a playlist.
                  </p>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  </div>
  );
}
