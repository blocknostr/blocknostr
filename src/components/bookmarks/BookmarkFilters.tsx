
import React, { useState } from "react";
import { Search, Plus, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { BookmarkCollection } from "@/lib/nostr";

interface BookmarkFiltersProps {
  isLoggedIn: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCollection: string | null;
  setSelectedCollection: (collection: string | null) => void;
  collections: BookmarkCollection[];
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  allTags: string[];
  handleResetFilters: () => void;
  handleRemoveTag: (tag: string) => void;
  handleCreateCollection: () => void;
  newCollectionName: string;
  setNewCollectionName: (name: string) => void;
  newCollectionColor: string;
  setNewCollectionColor: (color: string) => void;
  newCollectionDescription: string;
  setNewCollectionDescription: (description: string) => void;
  isCollectionDialogOpen: boolean;
  setIsCollectionDialogOpen: (isOpen: boolean) => void;
}

const BookmarkFilters: React.FC<BookmarkFiltersProps> = ({
  isLoggedIn,
  searchTerm,
  setSearchTerm,
  selectedCollection,
  setSelectedCollection,
  collections,
  selectedTags,
  setSelectedTags,
  allTags,
  handleResetFilters,
  handleRemoveTag,
  handleCreateCollection,
  newCollectionName,
  setNewCollectionName,
  newCollectionColor,
  setNewCollectionColor,
  newCollectionDescription,
  setNewCollectionDescription,
  isCollectionDialogOpen,
  setIsCollectionDialogOpen
}) => {
  if (!isLoggedIn) return null;

  return (
    <>
      <div className="mt-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bookmarks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <div className="flex gap-2 items-center flex-wrap">
          <Select
            value={selectedCollection || "all"}
            onValueChange={(value) => setSelectedCollection(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-[150px] md:w-[180px]">
              <SelectValue placeholder="All collections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All collections</SelectItem>
              {collections.map((collection) => (
                <SelectItem key={collection.id} value={collection.id}>
                  {collection.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Dialog open={isCollectionDialogOpen} onOpenChange={setIsCollectionDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Collection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create new collection</DialogTitle>
                <DialogDescription>
                  Create a new collection to organize your bookmarks.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="collection-name">Name</Label>
                  <Input
                    id="collection-name"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="e.g., Programming, Articles, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="collection-color">Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="collection-color"
                      type="color"
                      value={newCollectionColor}
                      onChange={(e) => setNewCollectionColor(e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <span className="text-sm">{newCollectionColor}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="collection-description">Description (optional)</Label>
                  <Input
                    id="collection-description"
                    value={newCollectionDescription}
                    onChange={(e) => setNewCollectionDescription(e.target.value)}
                    placeholder="Brief description of this collection"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCollectionDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateCollection}>Create Collection</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Tags
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Filter by tags</DialogTitle>
                <DialogDescription>
                  Select tags to filter your bookmarks.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-wrap gap-2 py-4 max-h-[200px] overflow-y-auto">
                {allTags.map((tag) => (
                  <Button
                    key={tag}
                    variant={selectedTags.includes(tag) ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (selectedTags.includes(tag)) {
                        setSelectedTags(selectedTags.filter(t => t !== tag));
                      } else {
                        setSelectedTags([...selectedTags, tag]);
                      }
                    }}
                  >
                    {tag}
                  </Button>
                ))}
                {allTags.length === 0 && (
                  <p className="text-sm text-muted-foreground">No tags found</p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedTags([])}>Clear</Button>
                <Button>Apply</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {(searchTerm || selectedCollection || selectedTags.length > 0) && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>
      
      {/* Active filters */}
      {selectedTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedTags.map(tag => (
            <div 
              key={tag}
              className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1"
            >
              {tag}
              <button 
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 hover:text-primary"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default BookmarkFilters;
