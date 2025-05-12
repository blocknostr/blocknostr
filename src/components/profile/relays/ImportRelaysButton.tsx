
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { DialogHeader, DialogTitle, Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface ImportRelaysButtonProps {
  onImportRelays: (urls: string[]) => void;
}

export function ImportRelaysButton({ onImportRelays }: ImportRelaysButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fileContent, setFileContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setFileContent(event.target?.result as string || "");
    };
    reader.readAsText(file);
  };
  
  const handleImport = () => {
    try {
      setIsLoading(true);
      const relays = parseRelays(fileContent);
      
      // Fix comparison from boolean > number to comparing relays length
      if (relays.length > 0) {
        onImportRelays(relays);
        setIsOpen(false);
        toast.success(`Imported ${relays.length} relays`);
      } else {
        toast.error("No valid relay URLs found");
      }
    } catch (error) {
      console.error("Error importing relays:", error);
      toast.error("Invalid relay format");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1"
      >
        <Upload className="h-4 w-4" />
        <span>Import</span>
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Relays</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file">Upload Relay List</Label>
              <input
                id="file"
                type="file"
                accept=".txt,.json"
                onChange={handleFileChange}
                className="w-full cursor-pointer rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              />
              <p className="text-xs text-muted-foreground">
                Supports plain text (one relay URL per line) or JSON formats
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleImport}
              disabled={!fileContent || isLoading}
            >
              {isLoading ? "Importing..." : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Parse relay URLs from various formats
function parseRelays(content: string): string[] {
  // Try to parse as JSON first
  try {
    const parsed = JSON.parse(content);
    
    // Handle array of URLs
    if (Array.isArray(parsed)) {
      return parsed.filter(url => typeof url === 'string' && url.startsWith('wss://'));
    }
    
    // Handle object with relay URLs as keys
    if (typeof parsed === 'object' && parsed !== null) {
      return Object.keys(parsed).filter(url => url.startsWith('wss://'));
    }
  } catch (e) {
    // Not JSON, try parse as plain text
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(url => url.startsWith('wss://'));
  }
  
  return [];
}
