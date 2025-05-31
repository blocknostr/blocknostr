import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { Clock, CheckCircle, X, Eye, AlertTriangle } from "lucide-react";
import { PendingPost } from "@/api/types/dao";

interface PendingPostsListProps {
  posts: PendingPost[];
  onApprove: (postId: string, originalPost: any) => Promise<boolean>;
  onReject?: (postId: string, originalPost: any, reason: string) => Promise<boolean>;
  isLoading?: boolean;
  isApproving?: boolean;
}

const PendingPostsList: React.FC<PendingPostsListProps> = ({ 
  posts, 
  onApprove,
  onReject,
  isLoading = false,
  isApproving = false
}) => {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PendingPost | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const handleApprove = async (post: PendingPost) => {
    // Convert PendingPost to the Event format needed by the approval function
    const originalPost = {
      id: post.id,
      pubkey: post.author,
      created_at: post.createdAt,
      kind: post.kind,
      tags: post.tags,
      content: post.content,
      sig: "" // This will be filled by the actual event data
    };
    
    await onApprove(post.id, originalPost);
  };

  const handleRejectClick = (post: PendingPost) => {
    setSelectedPost(post);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedPost || !onReject || !rejectReason.trim()) return;

    setIsRejecting(true);
    try {
      const originalPost = {
        id: selectedPost.id,
        pubkey: selectedPost.author,
        created_at: selectedPost.createdAt,
        kind: selectedPost.kind,
        tags: selectedPost.tags,
        content: selectedPost.content,
        sig: ""
      };

      const success = await onReject(selectedPost.id, originalPost, rejectReason.trim());
      if (success) {
        setRejectDialogOpen(false);
        setSelectedPost(null);
        setRejectReason("");
      }
    } finally {
      setIsRejecting(false);
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
                <div className="w-32 h-8 bg-muted rounded mt-4" />
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
          <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No pending posts</h3>
          <p className="text-muted-foreground">
            All community posts have been reviewed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id} className="border-orange-200 bg-orange-50 dark:bg-orange-900/10">
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
                  </div>
                </div>
              </div>
              
              <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-300">
                Pending Review
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {post.title && (
              <h3 className="font-semibold mb-2">{post.title}</h3>
            )}
            
            <div className="prose prose-sm max-w-none mb-4">
              <p className="whitespace-pre-wrap">{post.content}</p>
            </div>
            
            <div className="flex items-center gap-2 pt-3 border-t">
              <Button
                onClick={() => handleApprove(post)}
                disabled={isApproving || isRejecting}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isApproving ? "Approving..." : "Approve"}
              </Button>
              
              {onReject && (
                <Button
                  onClick={() => handleRejectClick(post)}
                  variant="outline"
                  size="sm"
                  disabled={isApproving || isRejecting}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              )}
            </div>
            
            <div className="mt-2 p-2 bg-muted rounded text-xs text-muted-foreground">
              💡 Tip: Review posts carefully before approving. Approved posts will be visible to all community members.
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Reject Reason Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Reject Post
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this post. This will help the author understand why their content was not approved.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedPost && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Post to reject:</p>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {selectedPost.content}
                </p>
              </div>
            )}
            
            <div>
              <label htmlFor="reject-reason" className="text-sm font-medium mb-2 block">
                Rejection Reason *
              </label>
              <Textarea
                id="reject-reason"
                placeholder="Please explain why this post doesn't meet community guidelines..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                maxLength={500}
                required
              />
              <div className="text-right text-xs text-muted-foreground mt-1">
                {rejectReason.length}/500
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectConfirm}
              disabled={!rejectReason.trim() || isRejecting}
              className="bg-red-600 hover:bg-red-700"
            >
              <X className="h-4 w-4 mr-2" />
              {isRejecting ? "Rejecting..." : "Reject Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PendingPostsList; 

