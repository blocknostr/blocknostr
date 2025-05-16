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
  return;
};
export default ArticlesPage;