import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Articles</h1>
        <Button asChild>
          <Link to="/articles/create" className="flex items-center gap-2">
            <Plus size={16} />
            New Article
          </Link>
        </Button>
      </div>
      
      <div className="my-6">
        <ArticleSearch 
          onSearch={setSearchQuery}
          onTagSelect={setSelectedTag}
          selectedTag={selectedTag}
        />
      </div>
      
      {!searchQuery && !selectedTag && (
        <>
          <div className="mb-8">
            <ArticleFeatured />
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="latest">Latest</TabsTrigger>
                <TabsTrigger value="trending">Trending</TabsTrigger>
                {isLoggedIn && <TabsTrigger value="following">Following</TabsTrigger>}
              </TabsList>
              
              {isLoggedIn && (
                <div className="flex gap-3">
                  <Button variant="outline" asChild>
                    <Link to="/articles/me">My Articles</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/articles/drafts">Drafts</Link>
                  </Button>
                </div>
              )}
            </div>
            
            <TabsContent value="latest" className="mt-0">
              <ArticleFeed type="latest" />
            </TabsContent>
            
            <TabsContent value="trending" className="mt-0">
              <ArticleFeed type="trending" />
            </TabsContent>
            
            {isLoggedIn && (
              <TabsContent value="following" className="mt-0">
                <ArticleFeed type="following" />
              </TabsContent>
            )}
          </Tabs>
        </>
      )}
      
      {(searchQuery || selectedTag) && (
        <div className="mt-4">
          <h2 className="text-2xl font-bold mb-4">
            {searchQuery ? `Search results for "${searchQuery}"` : `Articles tagged with #${selectedTag}`}
          </h2>
          <ArticleFeed 
            type="search" 
            searchQuery={searchQuery}
            hashtag={selectedTag || undefined}
          />
        </div>
      )}
      
      {!searchQuery && !selectedTag && (
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-4">Recommended For You</h2>
          <RecommendedArticles />
        </div>
      )}
    </div>
  );
};

export default ArticlesPage;
