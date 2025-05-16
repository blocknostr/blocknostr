
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/navigation/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import ArticleFeed from "@/components/articles/ArticleFeed";
import ArticleFeatured from "@/components/articles/ArticleFeatured";
import RecommendedArticles from "@/components/articles/RecommendedArticles";
import ArticleSearch from "@/components/articles/ArticleSearch";
import { adaptedNostrService as nostrAdapter } from "@/lib/nostr/nostr-adapter";

const ArticlesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("latest");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const isLoggedIn = !!nostrAdapter.publicKey;
  
  return (
    <div className="container max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Articles</h1>
          <p className="text-muted-foreground mt-1">
            Discover and read articles from the community
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {isLoggedIn && (
            <Button asChild>
              <Link to="/articles/create" className="flex items-center gap-2">
                <Plus size={16} />
                Write Article
              </Link>
            </Button>
          )}
          
          {isLoggedIn && (
            <Button variant="outline" asChild>
              <Link to="/articles/me">My Articles</Link>
            </Button>
          )}
          
          {!isLoggedIn && (
            <Button variant="outline" asChild>
              <Link to="/settings">Login to Write</Link>
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <ArticleFeatured />
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-2">
              <TabsTrigger value="latest">Latest</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="following">Following</TabsTrigger>
            </TabsList>
            
            <TabsContent value="latest">
              <ArticleFeed type="latest" />
            </TabsContent>
            
            <TabsContent value="trending">
              <ArticleFeed type="trending" />
            </TabsContent>
            
            <TabsContent value="following">
              <ArticleFeed type="following" />
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="lg:col-span-4 space-y-6">
          <ArticleSearch
            onSearch={setSearchQuery}
            onTagSelect={setSelectedTag}
            selectedTag={selectedTag}
          />
          
          {searchQuery || selectedTag ? (
            <ArticleFeed 
              type="search" 
              searchQuery={searchQuery} 
              hashtag={selectedTag || undefined} 
            />
          ) : (
            <RecommendedArticles />
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticlesPage;
