
import React from "react";
import { Search, Plus, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
      <div className="mt-2 flex flex-col md:flex-row gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search bookmarks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-7 h-8 text-sm"
          />
        </div>
        
        <div className="flex gap-2 items-center flex-wrap">
          <Select
            value={selectedCollection || "all"}
            onValueChange={(value) => setSelectedCollection(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-[130px] md:w-[150px] h-8 text-xs">
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
              <Button variant="outline" size="sm" className="h-8 text-xs px-2">
                <Plus className="h-3.5 w-3.5 mr-1" />
                New
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Create collection</DialogTitle>
                <DialogDescription>
                  Organize your bookmarks with collections
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-1">
                  <Label htmlFor="collection-name" className="text-xs">Name</Label>
                  <Input
                    id="collection-name"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="e.g., Programming, Articles"
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="collection-color" className="text-xs">Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="collection-color"
                      type="color"
                      value={newCollectionColor}
                      onChange={(e) => setNewCollectionColor(e.target.value)}
                      className="w-10 h-8 p-1"
                    />
                    <span className="text-xs">{newCollectionColor}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="collection-description" className="text-xs">Description (optional)</Label>
                  <Input
                    id="collection-description"
                    value={newCollectionDescription}
                    onChange={(e) => setNewCollectionDescription(e.target.value)}
                    placeholder="Brief description"
                    className="h-8"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setIsCollectionDialogOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={handleCreateCollection}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs px-2">
                <Filter className="h-3.5 w-3.5 mr-1" />
                Tags
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Filter by tags</DialogTitle>
              </DialogHeader>
              <div className="flex flex-wrap gap-1.5 py-3 max-h-[180px] overflow-y-auto">
                {allTags.map((tag) => (
                  <Button
                    key={tag}
                    variant={selectedTags.includes(tag) ? "secondary" : "outline"}
                    size="sm"
                    className="h-6 text-xs"
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
                  <p className="text-xs text-muted-foreground">No tags found</p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setSelectedTags([])}>Clear</Button>
                <Button size="sm">Apply</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {(searchTerm || selectedCollection || selectedTags.length > 0) && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters} className="h-8 px-2">
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Active filters */}
      {selectedTags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedTags.map(tag => (
            <div 
              key={tag}
              className="bg-secondary text-secondary-foreground text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1"
            >
              {tag}
              <button 
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-primary"
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
