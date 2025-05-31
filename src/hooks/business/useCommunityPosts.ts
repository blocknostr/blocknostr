import { useState, useEffect } from 'react';
import { daoService } from '@/lib/dao/dao-service';
import { nostrService } from '@/lib/nostr';
import { 
  CommunityPost, 
  PendingPost, 
  RejectedPost, 
  ContentReport, 
  ModerationLogEntry, 
  MemberBan 
} from '@/api/types/dao';
import { toast } from '@/lib/toast';

export function useCommunityPosts(communityId: string) {
  // State for different types of posts
  const [approvedPosts, setApprovedPosts] = useState<CommunityPost[]>([]);
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([]);
  const [rejectedPosts, setRejectedPosts] = useState<RejectedPost[]>([]);
  
  // State for moderation features
  const [contentReports, setContentReports] = useState<ContentReport[]>([]);
  const [moderationLogs, setModerationLogs] = useState<ModerationLogEntry[]>([]);
  const [bannedMembers, setBannedMembers] = useState<MemberBan[]>([]);
  
  // Loading states
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingPendingPosts, setLoadingPendingPosts] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);

  const currentUserPubkey = nostrService.publicKey;

  // Fetch all community posts data
  useEffect(() => {
    if (!communityId) return;

    const fetchAllData = async () => {
      try {
        setLoadingPosts(true);
        setLoadingPendingPosts(true);
        setLoadingReports(true);

        // Fetch all data in parallel
        const [
          approved,
          pending,
          rejected,
          reports,
          logs,
          banned
        ] = await Promise.all([
          daoService.getApprovedCommunityPosts(communityId),
          daoService.getPendingCommunityPosts(communityId),
          daoService.getRejectedCommunityPosts(communityId),
          daoService.getContentReports(communityId),
          daoService.getModerationLogs(communityId),
          daoService.getBannedMembers(communityId)
        ]);

        setApprovedPosts(approved);
        setPendingPosts(pending);
        setRejectedPosts(rejected);
        setContentReports(reports);
        setModerationLogs(logs);
        setBannedMembers(banned);

      } catch (error) {
        console.error('Error fetching community posts data:', error);
        toast.error('Failed to load community posts');
      } finally {
        setLoadingPosts(false);
        setLoadingPendingPosts(false);
        setLoadingReports(false);
      }
    };

    fetchAllData();
  }, [communityId]);

  // Submit a new community post
  const submitCommunityPost = async (content: string, title?: string): Promise<boolean> => {
    if (!currentUserPubkey || !communityId) {
      toast.error('You must be logged in to submit posts');
      return false;
    }

    try {
      setLoadingPosts(true);
      const postId = await daoService.submitCommunityPost(communityId, content, title);
      
      if (postId) {
        toast.success('Post submitted for moderation');
        
        // Create a temporary pending post for immediate UI feedback
        const tempPost: PendingPost = {
          id: postId,
          communityId,
          content,
          title,
          author: currentUserPubkey,
          createdAt: Math.floor(Date.now() / 1000),
          kind: 1,
          tags: [['a', `34550:${communityId}`, '']]
        };
        
        setPendingPosts(prev => [tempPost, ...prev]);
        return true;
      } else {
        toast.error('Failed to submit post');
        return false;
      }
    } catch (error) {
      console.error('Error submitting post:', error);
      toast.error('Failed to submit post');
      return false;
    } finally {
      setLoadingPosts(false);
    }
  };

  // Approve a community post (moderator action)
  const approveCommunityPost = async (postId: string, originalPost: any): Promise<boolean> => {
    if (!currentUserPubkey || !communityId) {
      toast.error('You must be logged in to approve posts');
      return false;
    }

    try {
      const approvalId = await daoService.approveCommunityPost(postId, communityId, originalPost);
      
      if (approvalId) {
        toast.success('Post approved successfully');
        
        // Move post from pending to approved
        const pendingPost = pendingPosts.find(p => p.id === postId);
        if (pendingPost) {
          const approvedPost: CommunityPost = {
            ...pendingPost,
            approvals: [{
              id: approvalId,
              postId,
              communityId,
              moderator: currentUserPubkey,
              approvedAt: Math.floor(Date.now() / 1000),
              originalPost: JSON.stringify(originalPost)
            }],
            isApproved: true,
            approvedBy: currentUserPubkey,
            approvedAt: Math.floor(Date.now() / 1000)
          };
          
          setApprovedPosts(prev => [approvedPost, ...prev]);
          setPendingPosts(prev => prev.filter(p => p.id !== postId));
        }
        
        return true;
      } else {
        toast.error('Failed to approve post');
        return false;
      }
    } catch (error) {
      console.error('Error approving post:', error);
      toast.error('Failed to approve post');
      return false;
    }
  };

  // Reject a community post (moderator action)
  const rejectCommunityPost = async (postId: string, originalPost: any, reason: string): Promise<boolean> => {
    if (!currentUserPubkey || !communityId) {
      toast.error('You must be logged in to reject posts');
      return false;
    }

    try {
      const rejectionId = await daoService.rejectCommunityPost(postId, communityId, originalPost, reason);
      
      if (rejectionId) {
        toast.success('Post rejected successfully');
        
        // Move post from pending to rejected
        const pendingPost = pendingPosts.find(p => p.id === postId);
        if (pendingPost) {
          const rejectedPost: RejectedPost = {
            ...pendingPost,
            rejection: {
              id: rejectionId,
              postId,
              communityId,
              moderator: currentUserPubkey,
              rejectedAt: Math.floor(Date.now() / 1000),
              reason,
              originalPost: JSON.stringify(originalPost)
            },
            isRejected: true
          };
          
          setRejectedPosts(prev => [rejectedPost, ...prev]);
          setPendingPosts(prev => prev.filter(p => p.id !== postId));
        }
        
        return true;
      } else {
        toast.error('Failed to reject post');
        return false;
      }
    } catch (error) {
      console.error('Error rejecting post:', error);
      toast.error('Failed to reject post');
      return false;
    }
  };

  // Report content for moderation
  const reportContent = async (
    targetId: string,
    targetType: 'post' | 'comment' | 'user',
    category: 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other',
    reason: string
  ): Promise<boolean> => {
    if (!currentUserPubkey || !communityId) {
      toast.error('You must be logged in to report content');
      return false;
    }

    try {
      const reportId = await daoService.reportContent(communityId, targetId, targetType, category, reason);
      
      if (reportId) {
        toast.success('Content reported successfully');
        
        // Add to reports list
        const newReport: ContentReport = {
          id: reportId,
          communityId,
          reporter: currentUserPubkey,
          targetId,
          targetType,
          category,
          reason,
          reportedAt: Math.floor(Date.now() / 1000),
          status: 'pending'
        };
        
        setContentReports(prev => [newReport, ...prev]);
        return true;
      } else {
        toast.error('Failed to report content');
        return false;
      }
    } catch (error) {
      console.error('Error reporting content:', error);
      toast.error('Failed to report content');
      return false;
    }
  };

  // Review and resolve a content report
  const reviewContentReport = async (
    reportId: string,
    resolution: string,
    status: 'reviewed' | 'resolved' | 'dismissed'
  ): Promise<boolean> => {
    if (!currentUserPubkey || !communityId) {
      toast.error('You must be logged in to review reports');
      return false;
    }

    try {
      const reviewId = await daoService.reviewContentReport(reportId, communityId, resolution, status);
      
      if (reviewId) {
        toast.success('Report reviewed successfully');
        
        // Update report status
        setContentReports(prev => prev.map(report => 
          report.id === reportId 
            ? { 
                ...report, 
                status, 
                reviewedBy: currentUserPubkey,
                reviewedAt: Math.floor(Date.now() / 1000),
                resolution 
              }
            : report
        ));
        
        return true;
      } else {
        toast.error('Failed to review report');
        return false;
      }
    } catch (error) {
      console.error('Error reviewing report:', error);
      toast.error('Failed to review report');
      return false;
    }
  };

  // Ban a member from the community
  const banMember = async (
    memberToBan: string,
    reason: string,
    durationHours?: number
  ): Promise<boolean> => {
    if (!currentUserPubkey || !communityId) {
      toast.error('You must be logged in to ban members');
      return false;
    }

    try {
      const banId = await daoService.banMember(communityId, memberToBan, reason, durationHours);
      
      if (banId) {
        toast.success('Member banned successfully');
        
        // Add to banned members list
        const newBan: MemberBan = {
          id: banId,
          communityId,
          bannedUser: memberToBan,
          moderator: currentUserPubkey,
          reason,
          bannedAt: Math.floor(Date.now() / 1000),
          expiresAt: durationHours ? Math.floor(Date.now() / 1000) + (durationHours * 3600) : undefined,
          isActive: true
        };
        
        setBannedMembers(prev => [newBan, ...prev]);
        return true;
      } else {
        toast.error('Failed to ban member');
        return false;
      }
    } catch (error) {
      console.error('Error banning member:', error);
      toast.error('Failed to ban member');
      return false;
    }
  };

  // Unban a member from the community
  const unbanMember = async (memberToUnban: string, reason?: string): Promise<boolean> => {
    if (!currentUserPubkey || !communityId) {
      toast.error('You must be logged in to unban members');
      return false;
    }

    try {
      const unbanId = await daoService.unbanMember(communityId, memberToUnban, reason);
      
      if (unbanId) {
        toast.success('Member unbanned successfully');
        
        // Update banned members list
        setBannedMembers(prev => prev.map(ban => 
          ban.bannedUser === memberToUnban 
            ? { ...ban, isActive: false }
            : ban
        ));
        
        return true;
      } else {
        toast.error('Failed to unban member');
        return false;
      }
    } catch (error) {
      console.error('Error unbanning member:', error);
      toast.error('Failed to unban member');
      return false;
    }
  };

  // Refresh all data
  const refreshData = async () => {
    if (!communityId) return;

    try {
      setLoadingPosts(true);
      setLoadingPendingPosts(true);
      setLoadingReports(true);

      const [
        approved,
        pending,
        rejected,
        reports,
        logs,
        banned
      ] = await Promise.all([
        daoService.getApprovedCommunityPosts(communityId),
        daoService.getPendingCommunityPosts(communityId),
        daoService.getRejectedCommunityPosts(communityId),
        daoService.getContentReports(communityId),
        daoService.getModerationLogs(communityId),
        daoService.getBannedMembers(communityId)
      ]);

      setApprovedPosts(approved);
      setPendingPosts(pending);
      setRejectedPosts(rejected);
      setContentReports(reports);
      setModerationLogs(logs);
      setBannedMembers(banned);

    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setLoadingPosts(false);
      setLoadingPendingPosts(false);
      setLoadingReports(false);
    }
  };

  return {
    // Data
    approvedPosts,
    pendingPosts,
    rejectedPosts,
    contentReports,
    moderationLogs,
    bannedMembers,
    
    // Loading states
    loadingPosts,
    loadingPendingPosts,
    loadingReports,
    
    // Actions
    submitCommunityPost,
    approveCommunityPost,
    rejectCommunityPost,
    reportContent,
    reviewContentReport,
    banMember,
    unbanMember,
    refreshData
  };
} 
