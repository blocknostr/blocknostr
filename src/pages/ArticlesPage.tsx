
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Search, BookOpen } from "lucide-react";
import { nostrService, NostrEvent } from "@/lib/nostr";
import { formatDistanceToNow } from "date-fns";

interface Article {
  id: string;
  title: string;
  summary: string;
  pubkey: string;
  created_at: number;
  profile?: {
    name?: string;
    display_name?: string;
    picture?: string;
  };
}

const ArticlesPage = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const toggleSidebar = () => {
    setSidebarVisible(prev => !prev);
  };

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        await nostrService.connectToUserRelays();

        // Subscribe to NIP-23 long-form content
        const articlesSubId = nostrService.subscribe(
          [
            {
              kinds: [30023], // Long-form content
              limit: 50
            }
          ],
          handleArticleEvent
        );

        return () => {
          nostrService.unsubscribe(articlesSubId);
        };
      } catch (error) {
        console.error("Error fetching articles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const handleArticleEvent = async (event: NostrEvent) => {
    try {
      // Extract title from tags
      const titleTag = event.tags.find(tag => tag[0] === "title");
      const title = titleTag && titleTag[1] ? titleTag[1] : "Untitled Article";

      // Get summary from content (first 150 chars)
      const summary = event.content.substring(0, 150) + (event.content.length > 150 ? "..." : "");

      // Add article to state if not already present
      setArticles(prev => {
        if (prev.some(a => a.id === event.id)) return prev;

        const newArticle: Article = {
          id: event.id || "",
          title,
          summary,
          pubkey: event.pubkey || "",
          created_at: event.created_at
        };

        // Fetch profile data for this article
        fetchProfileForArticle(event.pubkey || "", event.id || "");

        return [...prev, newArticle].sort((a, b) => b.created_at - a.created_at);
      });
    } catch (error) {
      console.error("Error processing article event:", error);
    }
  };

  const fetchProfileForArticle = async (pubkey: string, articleId: string) => {
    try {
      const metadataSubId = nostrService.subscribe(
        [
          {
            kinds: [0],
            authors: [pubkey],
            limit: 1
          }
        ],
        (event) => {
          try {
            const metadata = JSON.parse(event.content);
            
            setArticles(prev => 
              prev.map(article => {
                if (article.id === articleId) {
                  return {
                    ...article,
                    profile: {
                      name: metadata.name,
                      display_name: metadata.display_name,
                      picture: metadata.picture
                    }
                  };
                }
                return article;
              })
            );
          } catch (e) {
            console.error('Failed to parse profile metadata:', e);
          }
          
          nostrService.unsubscribe(metadataSubId);
        }
      );
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  // Filter articles based on search term
  const filteredArticles = articles.filter(article => 
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile sidebar - conditionally shown */}
      <div className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden ${sidebarVisible ? 'block' : 'hidden'}`} 
           onClick={() => setSidebarVisible(false)}>
        <div className="w-64 h-full bg-background border-r" onClick={e => e.stopPropagation()}>
          <Sidebar />
        </div>
      </div>
      
      {/* Desktop sidebar */}
      <Sidebar />
      
      <div className="flex-1 ml-0 md:ml-64">
        <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center h-14 px-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="mr-2 md:hidden"
              onClick={toggleSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold">Articles</h1>
          </div>
        </header>
        
        <div className="max-w-3xl mx-auto p-4">
          <div className="flex items-center mb-6 relative">
            <Search className="absolute left-3 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search articles..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading articles...</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No articles found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredArticles.map(article => (
                <Card key={article.id} className="hover:bg-accent/10 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl">{article.title}</CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-muted-foreground">
                      {article.summary}
                    </p>
                  </CardContent>
                  
                  <CardFooter className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={article.profile?.picture} />
                        <AvatarFallback>
                          {article.profile?.name?.charAt(0) || 
                           article.profile?.display_name?.charAt(0) || 
                           'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        {article.profile?.display_name || 
                         article.profile?.name || 
                         nostrService.getNpubFromHex(article.pubkey).substring(0, 8) + '...'}
                      </span>
                    </div>
                    
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(article.created_at * 1000), { addSuffix: true })}
                    </span>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticlesPage;
