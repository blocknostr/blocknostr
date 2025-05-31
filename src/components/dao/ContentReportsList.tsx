import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Flag, Clock, CheckCircle, X, AlertTriangle, Eye } from "lucide-react";
import { ContentReport } from "@/api/types/dao";

interface ContentReportsListProps {
  reports: ContentReport[];
  onReviewReport: (reportId: string, resolution: string, status: 'reviewed' | 'resolved' | 'dismissed') => Promise<boolean>;
  isLoading?: boolean;
  isReviewing?: boolean;
}

const ContentReportsList: React.FC<ContentReportsListProps> = ({ 
  reports, 
  onReviewReport,
  isLoading = false,
  isReviewing = false
}) => {
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [resolution, setResolution] = useState("");
  const [reviewStatus, setReviewStatus] = useState<'reviewed' | 'resolved' | 'dismissed'>('reviewed');

  const handleReviewClick = (report: ContentReport) => {
    setSelectedReport(report);
    setResolution("");
    setReviewStatus('reviewed');
    setReviewDialogOpen(true);
  };

  const handleReviewConfirm = async () => {
    if (!selectedReport || !resolution.trim()) return;

    const success = await onReviewReport(selectedReport.id, resolution.trim(), reviewStatus);
    if (success) {
      setReviewDialogOpen(false);
      setSelectedReport(null);
      setResolution("");
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'spam': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'harassment': return 'bg-red-100 text-red-800 border-red-300';
      case 'inappropriate': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'misinformation': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'reviewed': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-300';
      case 'dismissed': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
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

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Flag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No reports</h3>
          <p className="text-muted-foreground">
            No content has been reported in this community.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Content Reports</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Flag className="h-4 w-4" />
          <span>{reports.length} report{reports.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {reports.map((report) => (
        <Card key={report.id} className="border-red-200 bg-red-50/50 dark:bg-red-900/10">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {report.reporter.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    Reported by {report.reporter.substring(0, 8)}...
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(report.reportedAt * 1000), { 
                        addSuffix: true 
                      })}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-xs ${getCategoryColor(report.category)}`}>
                  {report.category}
                </Badge>
                <Badge variant="outline" className={`text-xs ${getStatusColor(report.status)}`}>
                  {report.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-1">Target: {report.targetType}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {report.targetId.substring(0, 16)}...
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-1">Reason:</p>
                <p className="text-sm text-muted-foreground">
                  {report.reason}
                </p>
              </div>
              
              {report.status === 'pending' && (
                <div className="flex items-center gap-2 pt-3 border-t">
                  <Button
                    onClick={() => handleReviewClick(report)}
                    disabled={isReviewing}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Review
                  </Button>
                </div>
              )}
              
              {report.reviewedBy && (
                <div className="pt-3 border-t">
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>
                      Reviewed by {report.reviewedBy.substring(0, 8)}... {" "}
                      {report.reviewedAt && formatDistanceToNow(
                        new Date(report.reviewedAt * 1000), 
                        { addSuffix: true }
                      )}
                    </span>
                  </div>
                  {report.resolution && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Resolution: {report.resolution}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Review Report Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-blue-500" />
              Review Content Report
            </DialogTitle>
            <DialogDescription>
              Review this report and provide your decision and reasoning.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedReport && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Report Details:</p>
                  <Badge variant="outline" className={`text-xs ${getCategoryColor(selectedReport.category)}`}>
                    {selectedReport.category}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  <strong>Target:</strong> {selectedReport.targetType} ({selectedReport.targetId.substring(0, 16)}...)
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Reason:</strong> {selectedReport.reason}
                </p>
              </div>
            )}
            
            <div>
              <label htmlFor="review-status" className="text-sm font-medium mb-2 block">
                Review Decision *
              </label>
              <Select value={reviewStatus} onValueChange={(value: any) => setReviewStatus(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select review decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reviewed">Reviewed - Under Investigation</SelectItem>
                  <SelectItem value="resolved">Resolved - Action Taken</SelectItem>
                  <SelectItem value="dismissed">Dismissed - No Action Needed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="resolution" className="text-sm font-medium mb-2 block">
                Resolution Notes *
              </label>
              <Textarea
                id="resolution"
                placeholder="Explain your decision and any actions taken..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={3}
                maxLength={500}
                required
              />
              <div className="text-right text-xs text-muted-foreground mt-1">
                {resolution.length}/500
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              disabled={isReviewing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReviewConfirm}
              disabled={!resolution.trim() || isReviewing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isReviewing ? "Submitting..." : "Submit Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentReportsList; 

