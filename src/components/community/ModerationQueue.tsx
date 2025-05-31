import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Shield,
  CheckCircle,
  XCircle,
  Flag,
  Ban,
  UserX,
  Clock,
  AlertTriangle,
  MessageSquare,
  User,
  Calendar,
  Eye,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { 
  PendingPost, 
  RejectedPost, 
  ContentReport, 
  ModerationLogEntry, 
  MemberBan 
} from '@/api/types/dao';
import { nostrService } from '@/lib/nostr';

interface ModerationQueueProps {
  communityId: string;
  pendingPosts: PendingPost[];
  rejectedPosts: RejectedPost[];
  contentReports: ContentReport[];
  moderationLogs: ModerationLogEntry[];
  bannedMembers: MemberBan[];
  isLoading: boolean;
  onApprovePost: (postId: string, originalPost: any) => Promise<boolean>;
  onRejectPost: (postId: string, originalPost: any, reason: string) => Promise<boolean>;
  onReviewReport: (reportId: string, resolution: string, status: 'reviewed' | 'resolved' | 'dismissed') => Promise<boolean>;
  onBanMember: (memberToBan: string, reason: string, durationHours?: number) => Promise<boolean>;
  onUnbanMember: (memberToUnban: string, reason?: string) => Promise<boolean>;
  currentUserPubkey: string;
  isCreator: boolean;
}

const ModerationQueue: React.FC<ModerationQueueProps> = ({
  communityId,
  pendingPosts,
  rejectedPosts,
  contentReports,
  moderationLogs,
  bannedMembers,
  isLoading,
  onApprovePost,
  onRejectPost,
  onReviewReport,
  onBanMember,
  onUnbanMember,
  currentUserPubkey,
  isCreator
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [reportResolution, setReportResolution] = useState('');
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState<string>('');
  const [selectedPost, setSelectedPost] = useState<PendingPost | null>(null);
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate counts for badges
  const pendingPostsCount = pendingPosts.length;
  const pendingReportsCount = contentReports.filter(r => r.status === 'pending').length;
  const activeBansCount = bannedMembers.filter(b => b.isActive).length;

  const handleApprovePost = async (post: PendingPost) => {
    setIsProcessing(true);
    try {
      const originalPost = {
        id: post.id,
        content: post.content,
        pubkey: post.author,
        created_at: post.createdAt,
        kind: post.kind,
        tags: post.tags
      };
      
      await onApprovePost(post.id, originalPost);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectPost = async (post: PendingPost, reason: string) => {
    if (!reason.trim()) return;
    
    setIsProcessing(true);
    try {
      const originalPost = {
        id: post.id,
        content: post.content,
        pubkey: post.author,
        created_at: post.createdAt,
        kind: post.kind,
        tags: post.tags
      };
      
      await onRejectPost(post.id, originalPost, reason);
      setRejectionReason('');
      setSelectedPost(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReviewReport = async (report: ContentReport, resolution: string, status: 'reviewed' | 'resolved' | 'dismissed') => {
    if (!resolution.trim()) return;
    
    setIsProcessing(true);
    try {
      await onReviewReport(report.id, resolution, status);
      setReportResolution('');
      setSelectedReport(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBanMember = async (memberToBan: string) => {
    if (!banReason.trim()) return;
    
    setIsProcessing(true);
    try {
      const durationHours = banDuration ? parseInt(banDuration) : undefined;
      await onBanMember(memberToBan, banReason, durationHours);
      setBanReason('');
      setBanDuration('');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatUserKey = (pubkey: string) => {
    try {
      return nostrService.getNpubFromHex(pubkey).substring(0, 12) + '...';
    } catch {
      return pubkey.substring(0, 12) + '...';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>;
      case 'reviewed':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Reviewed</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="text-green-600 border-green-600">Resolved</Badge>;
      case 'dismissed':
        return <Badge variant="outline" className="text-gray-600 border-gray-600">Dismissed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'spam':
        return <Trash2 className="h-4 w-4" />;
      case 'harassment':
        return <AlertTriangle className="h-4 w-4" />;
      case 'inappropriate':
        return <XCircle className="h-4 w-4" />;
      case 'misinformation':
        return <Flag className="h-4 w-4" />;
      default:
        return <Flag className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading moderation queue...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Moderation Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Pending Posts</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingPostsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Flag className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium">Pending Reports</p>
                <p className="text-2xl font-bold text-red-600">{pendingReportsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Ban className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Active Bans</p>
                <p className="text-2xl font-bold text-orange-600">{activeBansCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Total Actions</p>
                <p className="text-2xl font-bold text-green-600">{moderationLogs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Moderation Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="relative">
            Pending Posts
            {pendingPostsCount > 0 && (
              <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-xs">
                {pendingPostsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reports" className="relative">
            Reports
            {pendingReportsCount > 0 && (
              <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-xs">
                {pendingReportsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="bans">Banned Members</TabsTrigger>
          <TabsTrigger value="logs">Moderation Logs</TabsTrigger>
        </TabsList>

        {/* Pending Posts Tab */}
        <TabsContent value="pending" className="space-y-4">
          {pendingPosts.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Pending Posts</h3>
                <p className="text-muted-foreground">All posts have been reviewed!</p>
              </CardContent>
            </Card>
          ) : (
            pendingPosts.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://api.dicebear.com/7.x/shapes/svg?seed=${post.author}`} />
                        <AvatarFallback>{formatUserKey(post.author).substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{formatUserKey(post.author)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(post.createdAt * 1000), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                  {post.title && (
                    <CardTitle className="text-lg">{post.title}</CardTitle>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm leading-relaxed">{post.content}</p>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprovePost(post)}
                          disabled={isProcessing}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setSelectedPost(post)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reject Post</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground">
                                Please provide a reason for rejecting this post:
                              </p>
                              <Textarea
                                placeholder="Reason for rejection..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={3}
                              />
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setRejectionReason('');
                                    setSelectedPost(null);
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleRejectPost(post, rejectionReason)}
                                  disabled={!rejectionReason.trim() || isProcessing}
                                >
                                  Reject Post
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Post ID: {post.id.substring(0, 8)}...
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Content Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          {contentReports.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Reports</h3>
                <p className="text-muted-foreground">No content has been reported!</p>
              </CardContent>
            </Card>
          ) : (
            contentReports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {getCategoryIcon(report.category)}
                      <div>
                        <p className="font-medium capitalize">{report.category} Report</p>
                        <p className="text-sm text-muted-foreground">
                          Reported by {formatUserKey(report.reporter)} • {formatDistanceToNow(new Date(report.reportedAt * 1000), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(report.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Target: {report.targetType}</p>
                      <p className="text-sm text-muted-foreground">ID: {report.targetId.substring(0, 16)}...</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-1">Reason:</p>
                      <p className="text-sm">{report.reason}</p>
                    </div>
                    
                    {report.resolution && (
                      <div>
                        <p className="text-sm font-medium mb-1">Resolution:</p>
                        <p className="text-sm text-muted-foreground">{report.resolution}</p>
                      </div>
                    )}
                    
                    {report.status === 'pending' && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <Textarea
                            placeholder="Resolution notes..."
                            value={reportResolution}
                            onChange={(e) => setReportResolution(e.target.value)}
                            rows={2}
                          />
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleReviewReport(report, reportResolution, 'resolved')}
                              disabled={!reportResolution.trim() || isProcessing}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Resolve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReviewReport(report, reportResolution, 'dismissed')}
                              disabled={!reportResolution.trim() || isProcessing}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Banned Members Tab */}
        <TabsContent value="bans" className="space-y-4">
          {bannedMembers.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <UserX className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Banned Members</h3>
                <p className="text-muted-foreground">No members have been banned from this community.</p>
              </CardContent>
            </Card>
          ) : (
            bannedMembers.map((ban) => (
              <Card key={ban.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://api.dicebear.com/7.x/shapes/svg?seed=${ban.bannedUser}`} />
                        <AvatarFallback>{formatUserKey(ban.bannedUser).substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{formatUserKey(ban.bannedUser)}</p>
                        <p className="text-sm text-muted-foreground">
                          Banned by {formatUserKey(ban.moderator)} • {formatDistanceToNow(new Date(ban.bannedAt * 1000), { addSuffix: true })}
                        </p>
                        <p className="text-sm text-muted-foreground">Reason: {ban.reason}</p>
                        {ban.expiresAt && (
                          <p className="text-sm text-muted-foreground">
                            Expires: {formatDistanceToNow(new Date(ban.expiresAt * 1000), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant={ban.isActive ? "destructive" : "outline"}>
                        {ban.isActive ? "Active" : "Inactive"}
                      </Badge>
                      
                      {ban.isActive && isCreator && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onUnbanMember(ban.bannedUser, "Ban lifted by creator")}
                          disabled={isProcessing}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Unban
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Moderation Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Moderation Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {moderationLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No moderation actions recorded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {moderationLogs.map((log) => (
                      <div key={log.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                        <div className="flex-shrink-0">
                          <Shield className="h-4 w-4 text-primary mt-1" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">{formatUserKey(log.moderator)}</span>
                            <span className="text-muted-foreground"> performed action: </span>
                            <span className="font-medium capitalize">{log.action.replace('_', ' ')}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Target: {log.target.substring(0, 16)}...
                          </p>
                          {log.reason && (
                            <p className="text-sm text-muted-foreground">Reason: {log.reason}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(log.timestamp * 1000), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ModerationQueue; 
