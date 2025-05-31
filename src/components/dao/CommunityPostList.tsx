import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Clock, CheckCircle, Flag, MoreVertical } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommunityPost } from "@/api/types/dao";

interface CommunityPostListProps {
  posts: CommunityPost[];
  isLoading?: boolean;
  currentUserPubkey?: string;
  onReportContent?: (
    targetId: string,
    targetType: 'post' | 'comment' | 'user',
    category: 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other',
    reason: string
  ) => Promise<boolean>;
}

const CommunityPostList: React.FC<CommunityPostListProps> = ({ 
  posts, 
  isLoading = false,
  currentUserPubkey,
  onReportContent
}) => {
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [reportCategory, setReportCategory] = useState<'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other'>('spam');
  const [reportReason, setReportReason] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  const handleReportClick = (post: CommunityPost) => {
    setSelectedPost(post);
    setReportCategory('spam');
    setReportReason("");
    setReportDialogOpen(true);
  };

  const handleReportSubmit = async () => {
    if (!selectedPost || !onReportContent || !reportReason.trim()) return;

    setIsReporting(true);
    try {
      const success = await onReportContent(selectedPost.id, 'post', reportCategory, reportReason.trim());
      if (success) {
        setReportDialogOpen(false);
        setSelectedPost(null);
        setReportReason("");
      }
    } finally {
      setIsReporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="space-y-1">
                  <div className="w-24 h-4 bg-muted rounded" />
                  <div className="w-16 h-3 bg-muted rounded" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="w-3/4 h-4 bg-muted rounded" />
                <div className="w-1/2 h-4 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
          <p className="text-muted-foreground">
            Be the first to share something with this community!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {post.author.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {post.author.substring(0, 8)}...
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(post.createdAt * 1000), { 
                        addSuffix: true 
                      })}
                    </span>
                    {post.isApproved && (
                      <>
                        <span>•</span>
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span>Approved</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Post
                </Badge>
                
                {/* Only show report option if user is logged in and not the author */}
                {currentUserPubkey && currentUserPubkey !== post.author && onReportContent && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        title="Post options"
                        aria-label="Open post options menu"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleReportClick(post)}>
                        <Flag className="h-4 w-4 mr-2" />
                        Report Post
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {post.title && (
              <h3 className="font-semibold mb-2">{post.title}</h3>
            )}
            
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{post.content}</p>
            </div>
            
            {post.approvedBy && (
              <div className="mt-4 pt-3 border-t">
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>
                    Approved by {post.approvedBy.substring(0, 8)}... {" "}
                    {post.approvedAt && formatDistanceToNow(
                      new Date(post.approvedAt * 1000), 
                      { addSuffix: true }
                    )}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Report Content Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-red-500" />
              Report Content
            </DialogTitle>
            <DialogDescription>
              Report this post if it violates community guidelines. Reports will be reviewed by moderators.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedPost && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Post to report:</p>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {selectedPost.content}
                </p>
              </div>
            )}
            
            <div>
              <label htmlFor="report-category" className="text-sm font-medium mb-2 block">
                Report Category *
              </label>
              <Select value={reportCategory} onValueChange={(value: any) => setReportCategory(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                  <SelectItem value="misinformation">Misinformation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="report-reason" className="text-sm font-medium mb-2 block">
                Detailed Reason *
              </label>
              <Textarea
                id="report-reason"
                placeholder="Please explain why this content should be reviewed..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows={3}
                maxLength={500}
                required
              />
              <div className="text-right text-xs text-muted-foreground mt-1">
                {reportReason.length}/500
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReportDialogOpen(false)}
              disabled={isReporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReportSubmit}
              disabled={!reportReason.trim() || isReporting}
              className="bg-red-600 hover:bg-red-700"
            >
              <Flag className="h-4 w-4 mr-2" />
              {isReporting ? "Reporting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommunityPostList; 

