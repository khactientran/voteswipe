import { useEffect, useMemo, useState } from "react";
import heroImage from "@/assets/hero-image.jpeg";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent as AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import VoteSwipeLogo from "@/components/VoteSwipeLogo";
import { NewSessionDialog } from "@/components/NewSessionDialog";
import { UploadImagesDialog } from "@/components/UploadImagesDialog";
import { useVotingSessions } from "@/hooks/useVotingSessions";
import { useToast } from "@/hooks/use-toast";
import { 
  Trash2, 
  Copy, 
  BarChart3, 
  Download,
  Eye,
  LogOut,
  Settings,
  Loader2
} from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { sessions, images, loading, createSession, deleteSession, deleteImage, uploadImages } = useVotingSessions();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/");
  };

  const copySessionLink = (sessionId: string) => {
    const link = `${window.location.origin}/vote/${sessionId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: "Voting session link copied to clipboard"
    });
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Session', 'Likes', 'OKs', 'Dislikes', 'Score'];
    const rows = sortedImages.map(img => [
      img.name,
      img.session_name || 'Unknown',
      img.likes.toString(),
      img.oks.toString(),
      img.dislikes.toString(),
      (img.likes - img.dislikes).toString()
    ]);

    // Escape fields to prevent CSV formula injection and quote properly
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => {
        const value = String(field ?? '');
        const needsFormulaEscape = /^[=+\-@]/.test(value);
        const safe = needsFormulaEscape ? `'${value}` : value;
        return '"' + safe.replace(/"/g, '""') + '"';
      }).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voting-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const calculateScore = (likes: number, dislikes: number) => likes - dislikes;

  type SortKey = 'name' | 'session_name' | 'likes' | 'oks' | 'dislikes' | 'score';
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Default selected session to most recent when sessions load
  useEffect(() => {
    if (!selectedSessionId && sessions.length > 0) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [sessions, selectedSessionId]);

  const filteredImages = useMemo(() => {
    if (!selectedSessionId) return [] as typeof images;
    return images.filter(img => img.session_id === selectedSessionId);
  }, [images, selectedSessionId]);

  const sortedImages = useMemo(() => {
    const withScores = filteredImages.map(img => ({ ...img, score: calculateScore(img.likes, img.dislikes) }));
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...withScores].sort((a, b) => {
      const av = (a as any)[sortKey];
      const bv = (b as any)[sortKey];
      if (typeof av === 'string' && typeof bv === 'string') {
        return av.localeCompare(bv) * dir;
      }
      return ((av ?? 0) - (bv ?? 0)) * dir;
    });
  }, [filteredImages, sortKey, sortDir]);

  const onSort = (key: SortKey) => {
    setSortKey(prev => {
      if (prev === key) {
        setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('desc');
      return key;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative text-foreground">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', imageRendering: 'pixelated' as any }}
      />
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-sm border-b shadow-soft relative">
        <div className="container mx-auto px-3 xs:px-4 py-3 xs:py-4">
          <div className="flex flex-col xs:flex-row justify-between items-center gap-3 xs:gap-0">
            <VoteSwipeLogo className="scale-75 xs:scale-100" />
            <div className="flex items-center gap-2 xs:gap-4">
              <Badge variant="outline" className="text-xs xs:text-sm text-foreground">
                <span className="hidden xs:inline">Admin Dashboard</span>
                <span className="xs:hidden">Admin</span>
              </Badge>
              <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs xs:text-sm">
                <LogOut className="w-3 xs:w-4 h-3 xs:h-4 mr-1 xs:mr-2" />
                <span className="hidden xs:inline">Logout</span>
                <span className="xs:hidden">Exit</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 xs:px-4 py-4 xs:py-6 md:py-8 relative">
        <div className="mb-4 xs:mb-6 md:mb-8">
          <h1 className="text-xl xs:text-2xl md:text-3xl font-bold mb-1 xs:mb-2">Dashboard</h1>
          <p className="text-xs xs:text-sm md:text-base text-muted-foreground">Manage your voting sessions and view real-time results</p>
        </div>

        <Tabs defaultValue="management" className="space-y-4 xs:space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
            <TabsTrigger value="management" className="flex items-center gap-1 xs:gap-2 text-xs xs:text-sm">
              <Settings className="w-3 xs:w-4 h-3 xs:h-4" />
              <span className="hidden xs:inline">Management</span>
              <span className="xs:hidden">Manage</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-1 xs:gap-2 text-xs xs:text-sm">
              <BarChart3 className="w-3 xs:w-4 h-3 xs:h-4" />
              Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="management" className="space-y-4 xs:space-y-6">
            {/* Session Management */}
            <Card className="p-3 xs:p-4 md:p-6 lg:p-8 bg-card/90 backdrop-blur-sm text-foreground w-full mx-auto text-sm xs:text-base md:text-lg">
              <div className="overflow-x-auto">
              <div className="flex flex-col gap-2 xs:gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 xs:mb-6">
                <h2 className="text-lg xs:text-xl md:text-2xl font-semibold">Voting Sessions</h2>
                <NewSessionDialog onCreateSession={createSession} />
              </div>

              {sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No voting sessions yet. Create your first session to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold break-words">{session.name}</h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground mt-1">
                          <span>{session.image_count || 0} images</span>
                          <span>{session.total_votes || 0} votes</span>
                          <span>Created {new Date(session.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 md:flex-nowrap md:justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copySessionLink(session.id)}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Link
                        </Button>
                        <UploadImagesDialog 
                          sessionId={session.id}
                          sessionName={session.name}
                          onUploadImages={uploadImages}
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Session</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{session.name}"? This will permanently delete all images and votes in this session.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteSession(session.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {/* Results */}
            <Card className="p-8 bg-card/90 backdrop-blur-sm text-foreground w-full max-w-[80vw] mx-auto text-lg">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                <h2 className="text-2xl font-semibold">Live Results</h2>
                <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:items-center sm:justify-end">
                  <div className="w-full min-w-0 sm:min-w-[220px] sm:w-[220px]">
                    <Select value={selectedSessionId ?? undefined} onValueChange={(v) => setSelectedSessionId(v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select session" />
                      </SelectTrigger>
                      <SelectContent>
                        {sessions.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={exportToCSV} disabled={sortedImages.length === 0}>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>

              {!selectedSessionId ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Select a session to view results.</p>
                </div>
              ) : sortedImages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No images for this session yet. Upload some images to see results!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-foreground">Image</TableHead>
                        <TableHead className="text-foreground align-middle w-[240px]">
                          <button className="inline-flex items-center gap-1 h-6 text-foreground" onClick={() => onSort('name')}>
                            Name
                            {sortKey === 'name' && (
                              <span className="text-xs text-foreground">{sortDir === 'asc' ? '▲' : '▼'}</span>
                            )}
                          </button>
                        </TableHead>
                        {/* Session column removed due to session filter */}
                        <TableHead className="text-center text-foreground align-middle">
                          <button className="inline-flex items-center gap-1 h-6 text-foreground" onClick={() => onSort('likes')}>
                            <span>❤️</span>
                            <span>Likes</span>
                            {sortKey === 'likes' && (
                              <span className="text-xs text-foreground">{sortDir === 'asc' ? '▲' : '▼'}</span>
                            )}
                          </button>
                        </TableHead>
                        <TableHead className="text-center text-foreground align-middle">
                          <button className="inline-flex items-center gap-1 h-6 text-foreground" onClick={() => onSort('oks')}>
                            <span>🙂</span>
                            <span>OKs</span>
                            {sortKey === 'oks' && (
                              <span className="text-xs text-foreground">{sortDir === 'asc' ? '▲' : '▼'}</span>
                            )}
                          </button>
                        </TableHead>
                        <TableHead className="text-center text-foreground align-middle">
                          <button className="inline-flex items-center gap-1 h-6 text-foreground" onClick={() => onSort('dislikes')}>
                            <span>👎</span>
                            <span>Dislikes</span>
                            {sortKey === 'dislikes' && (
                              <span className="text-xs text-foreground">{sortDir === 'asc' ? '▲' : '▼'}</span>
                            )}
                          </button>
                        </TableHead>
                        <TableHead className="text-center text-foreground align-middle">
                          <button className="inline-flex items-center gap-1 h-6 text-foreground" onClick={() => onSort('score')}>
                            Score
                            {sortKey === 'score' && (
                              <span className="text-xs text-foreground">{sortDir === 'asc' ? '▲' : '▼'}</span>
                            )}
                          </button>
                        </TableHead>
                        <TableHead className="text-center text-foreground align-middle">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedImages.map((image) => (
                        <TableRow key={image.id}>
                          <TableCell>
                            <img 
                              src={image.url} 
                              alt={image.name}
                              className="w-12 h-12 rounded-lg object-cover cursor-pointer"
                              onClick={() => setPreviewImage({ url: image.url, name: image.name })}
                            />
                          </TableCell>
                          <TableCell className="font-medium w-[240px] max-w-[240px] truncate">{image.name}</TableCell>
                          {/* Session name cell removed due to session filter */}
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-vote-like border-vote-like">
                              {image.likes}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-vote-ok border-vote-ok">
                              {image.oks}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-vote-dislike border-vote-dislike">
                              {image.dislikes}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={calculateScore(image.likes, image.dislikes) > 0 ? "default" : "destructive"}>
                              {calculateScore(image.likes, image.dislikes) > 0 ? "+" : ""}{calculateScore(image.likes, image.dislikes)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-1">
                              <Button variant="outline" size="sm" onClick={() => setPreviewImage({ url: image.url, name: image.name })}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Image</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{image.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteImage(image.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <Dialog open={!!previewImage} onOpenChange={(open) => { if (!open) setPreviewImage(null); }}>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle className="truncate">{previewImage?.name}</DialogTitle>
                  </DialogHeader>
                  {previewImage && (
                    <img src={previewImage.url} alt={previewImage.name} className="w-full h-auto rounded-md" />
                  )}
                </DialogContent>
              </Dialog>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;